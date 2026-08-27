import type { SupabaseClient } from "@supabase/supabase-js";
import { formatISO } from "date-fns";
import type { Database } from "@/types/database.types";
import { SubscriptionsRepository } from "../repositories/subscriptions.repository";
import { RecurringTransactionsService } from "@/features/recurring-transactions/services/recurring-transactions.service";
import { calculateSubscriptionCost, type SubscriptionCostResult } from "@/lib/financial-engine";
import type { CreateSubscriptionInput } from "../validations/subscription.schema";
import type { Subscription } from "../types/subscription.types";

export interface SubscriptionsOverview {
  subscriptions: Subscription[];
  cost: SubscriptionCostResult;
}

export class SubscriptionsService {
  private readonly repository: SubscriptionsRepository;
  private readonly recurring: RecurringTransactionsService;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new SubscriptionsRepository(supabase);
    this.recurring = new RecurringTransactionsService(supabase);
  }

  async getOverview(): Promise<SubscriptionsOverview> {
    const subscriptions = await this.repository.list();
    const cost = calculateSubscriptionCost(subscriptions.map((s) => ({ id: s.id, amount: s.amount, frequency: s.frequency, active: s.active })));
    return { subscriptions, cost };
  }

  /**
   * Si `autoTrackAsExpense` viene marcado, además de la suscripción (para el
   * resumen de costos) crea su recurring_transaction vinculado — así el
   * gasto se registra solo cada ciclo, sin darlo de alta dos veces. Ver
   * 0007_link_subscriptions_to_recurring.sql.
   */
  async createSubscription(userId: string, input: CreateSubscriptionInput): Promise<string> {
    let recurringTransactionId: string | null = null;

    if (input.autoTrackAsExpense && input.accountId && input.categoryId) {
      recurringTransactionId = await this.recurring.createRecurring(userId, {
        transactionType: "EXPENSE",
        accountId: input.accountId,
        destinationAccountId: "",
        categoryId: input.categoryId,
        description: input.name,
        amount: input.amount,
        frequency: input.frequency,
        startDate: input.nextPaymentDate,
        endDate: "",
        notes: `Generado automáticamente desde la suscripción "${input.name}".`,
      });
    }

    const subscription = await this.repository.create(userId, {
      name: input.name,
      provider: input.provider || null,
      category_id: input.categoryId || null,
      amount: input.amount,
      frequency: input.frequency,
      next_payment_date: input.nextPaymentDate,
      account_id: input.accountId || null,
      start_date: formatISO(new Date(), { representation: "date" }),
      notes: input.notes || null,
      recurring_transaction_id: recurringTransactionId,
    });
    return subscription.id;
  }

  /** Cancela la suscripción y, si generaba su gasto automático, desactiva también esa recurrencia. */
  async cancelSubscription(id: string): Promise<void> {
    const recurringTransactionId = await this.repository.cancel(id, formatISO(new Date(), { representation: "date" }));
    if (recurringTransactionId) {
      await this.recurring.setActive(recurringTransactionId, false);
    }
  }
}
