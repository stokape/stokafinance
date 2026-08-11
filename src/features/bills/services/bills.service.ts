import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, addWeeks, addYears, formatISO } from "date-fns";
import type { Database } from "@/types/database.types";
import { BillsRepository } from "../repositories/bills.repository";
import { TransactionIntakeService } from "@/features/transactions/services/transaction-intake.service";
import { calculateUpcomingPayments } from "@/lib/financial-engine";
import type { CreateBillInput } from "../validations/bill.schema";
import type { Bill, BillRecurrence, BillWithUrgency } from "../types/bill.types";

function nextOccurrence(dueDate: string, recurrence: BillRecurrence): string {
  const date = new Date(`${dueDate}T00:00:00`);
  const next =
    recurrence === "WEEKLY"
      ? addWeeks(date, 1)
      : recurrence === "BIWEEKLY"
        ? addWeeks(date, 2)
        : recurrence === "MONTHLY"
          ? addMonths(date, 1)
          : recurrence === "QUARTERLY"
            ? addMonths(date, 3)
            : recurrence === "SEMIANNUAL"
              ? addMonths(date, 6)
              : addYears(date, 1);
  return formatISO(next, { representation: "date" });
}

export class BillsService {
  private readonly repository: BillsRepository;
  private readonly intake: TransactionIntakeService;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new BillsRepository(supabase);
    this.intake = new TransactionIntakeService(supabase);
  }

  /** Pagos pendientes clasificados por urgencia (§17/§24) — calculado en vivo, nunca persistido. */
  async listUpcoming(horizonDays = 30): Promise<BillWithUrgency[]> {
    const bills = await this.repository.list();
    const today = formatISO(new Date(), { representation: "date" });
    const urgencies = calculateUpcomingPayments(
      bills.map((b) => ({ id: b.id, label: b.name, amount: b.amount, dueDate: b.dueDate, kind: "BILL" })),
      today,
      horizonDays,
    );
    const urgencyById = new Map(urgencies.map((u) => [u.id, u.urgency]));

    return bills
      .map((bill) => ({ ...bill, urgency: urgencyById.get(bill.id) ?? ("UPCOMING" as const) }))
      .filter((bill) => urgencyById.has(bill.id))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async createBill(userId: string, input: CreateBillInput): Promise<string> {
    const bill = await this.repository.create(userId, {
      name: input.name,
      category_id: input.categoryId || null,
      amount: input.amount,
      due_date: input.dueDate,
      provider: input.provider || null,
      recurring: input.recurring,
      recurrence: input.recurring && input.recurrence ? input.recurrence : null,
      notes: input.notes || null,
      status: "PENDING",
    });
    return bill.id;
  }

  /**
   * Marca un pago como pagado (§12): genera el movimiento financiero
   * correspondiente (EXPENSE) vinculado al bill, y si es recurrente,
   * proyecta automáticamente el siguiente vencimiento — sin depender de un
   * cron (consistente con la estrategia zero-cost, ver docs/costs.md).
   */
  async markAsPaid(userId: string, billId: string, accountId: string, paymentDate: string): Promise<string> {
    const bill = await this.repository.findById(billId);
    if (!bill) throw new Error("BILL_NOT_FOUND");

    const result = await this.intake.intake({
      userId,
      source: "BILL",
      transactionType: "EXPENSE",
      amount: bill.amount,
      currency: bill.currency,
      accountId,
      categoryId: bill.categoryId,
      billId: bill.id,
      description: bill.name,
      merchant: bill.provider,
      transactionDate: paymentDate,
    });

    await this.repository.markPaid(billId, result.transactionId, paymentDate);

    if (bill.recurring && bill.recurrence) {
      await this.repository.create(userId, {
        name: bill.name,
        category_id: bill.categoryId,
        amount: bill.amount,
        due_date: nextOccurrence(bill.dueDate, bill.recurrence),
        provider: bill.provider,
        recurring: true,
        recurrence: bill.recurrence,
        notes: bill.notes,
        status: "PENDING",
      });
    }

    return result.transactionId;
  }

  cancelBill(id: string): Promise<void> {
    return this.repository.cancel(id);
  }

  listAllBills(): Promise<Bill[]> {
    return this.repository.list({ includePaid: true });
  }
}
