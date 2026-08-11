import type { SupabaseClient } from "@supabase/supabase-js";
import { formatISO } from "date-fns";
import type { Database } from "@/types/database.types";
import { SubscriptionsRepository } from "../repositories/subscriptions.repository";
import { calculateSubscriptionCost, type SubscriptionCostResult } from "@/lib/financial-engine";
import type { CreateSubscriptionInput } from "../validations/subscription.schema";
import type { Subscription } from "../types/subscription.types";

export interface SubscriptionsOverview {
  subscriptions: Subscription[];
  cost: SubscriptionCostResult;
}

export class SubscriptionsService {
  private readonly repository: SubscriptionsRepository;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new SubscriptionsRepository(supabase);
  }

  async getOverview(): Promise<SubscriptionsOverview> {
    const subscriptions = await this.repository.list();
    const cost = calculateSubscriptionCost(subscriptions.map((s) => ({ id: s.id, amount: s.amount, frequency: s.frequency, active: s.active })));
    return { subscriptions, cost };
  }

  async createSubscription(userId: string, input: CreateSubscriptionInput): Promise<string> {
    const subscription = await this.repository.create(userId, {
      name: input.name,
      provider: input.provider || null,
      category_id: input.categoryId || null,
      amount: input.amount,
      frequency: input.frequency,
      next_payment_date: input.nextPaymentDate,
      start_date: formatISO(new Date(), { representation: "date" }),
      notes: input.notes || null,
    });
    return subscription.id;
  }

  cancelSubscription(id: string): Promise<void> {
    return this.repository.cancel(id, formatISO(new Date(), { representation: "date" }));
  }
}
