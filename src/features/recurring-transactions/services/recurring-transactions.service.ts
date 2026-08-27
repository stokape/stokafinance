import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, addWeeks, addYears, formatISO } from "date-fns";
import type { Database } from "@/types/database.types";
import { RecurringTransactionsRepository } from "../repositories/recurring-transactions.repository";
import { TransactionIntakeService } from "@/features/transactions/services/transaction-intake.service";
import type { CreateRecurringTransactionInput } from "../validations/recurring-transaction.schema";
import type { RecurringFrequency, RecurringTransaction } from "../types/recurring-transaction.types";

/** Límite de ejecuciones atrasadas que se generan de una sola vez (evita un loop descontrolado si la app no se abrió en mucho tiempo). */
const MAX_CATCH_UP_OCCURRENCES = 24;

function nextOccurrence(dateIso: string, frequency: RecurringFrequency): string {
  const date = new Date(`${dateIso}T00:00:00`);
  const next =
    frequency === "WEEKLY"
      ? addWeeks(date, 1)
      : frequency === "BIWEEKLY"
        ? addWeeks(date, 2)
        : frequency === "MONTHLY"
          ? addMonths(date, 1)
          : frequency === "QUARTERLY"
            ? addMonths(date, 3)
            : frequency === "SEMIANNUAL"
              ? addMonths(date, 6)
              : addYears(date, 1);
  return formatISO(next, { representation: "date" });
}

export class RecurringTransactionsService {
  private readonly repository: RecurringTransactionsRepository;
  private readonly intake: TransactionIntakeService;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new RecurringTransactionsRepository(supabase);
    this.intake = new TransactionIntakeService(supabase);
  }

  /**
   * Genera los movimientos vencidos (§28) y luego devuelve la lista
   * actualizada. Sin cron: se ejecuta "al abrir" (cuando se visita la
   * página), mismo patrón zero-cost que bills recurrentes y las cuotas de
   * tarjeta — documentado en docs/costs.md.
   */
  async listAndCatchUp(userId: string): Promise<RecurringTransaction[]> {
    const today = formatISO(new Date(), { representation: "date" });
    const due = await this.repository.listDue(today);

    for (const recurring of due) {
      let occurrenceDate = recurring.nextOccurrenceDate;
      let iterations = 0;

      while (occurrenceDate <= today && iterations < MAX_CATCH_UP_OCCURRENCES) {
        if (recurring.endDate && occurrenceDate > recurring.endDate) break;

        await this.intake.intake({
          userId,
          source: "RECURRING",
          transactionType: recurring.transactionType,
          amount: recurring.amount,
          currency: recurring.currency,
          accountId: recurring.accountId,
          destinationAccountId: recurring.destinationAccountId,
          categoryId: recurring.categoryId,
          description: recurring.description,
          transactionDate: occurrenceDate,
          recurringTransactionId: recurring.id,
        });

        occurrenceDate = nextOccurrence(occurrenceDate, recurring.frequency);
        iterations += 1;
      }

      await this.repository.updateNextOccurrence(recurring.id, occurrenceDate);

      if (recurring.endDate && occurrenceDate > recurring.endDate) {
        await this.repository.setActive(recurring.id, false);
      }
    }

    return this.repository.list();
  }

  async createRecurring(userId: string, input: CreateRecurringTransactionInput): Promise<string> {
    return this.repository.create(userId, {
      transaction_type: input.transactionType,
      account_id: input.accountId,
      destination_account_id: input.transactionType === "TRANSFER" ? input.destinationAccountId || null : null,
      category_id: input.transactionType === "TRANSFER" ? null : input.categoryId || null,
      description: input.description,
      amount: input.amount,
      frequency: input.frequency,
      start_date: input.startDate,
      end_date: input.endDate || null,
      next_occurrence_date: input.startDate,
      notes: input.notes || null,
    });
  }

  setActive(id: string, active: boolean): Promise<void> {
    return this.repository.setActive(id, active);
  }
}
