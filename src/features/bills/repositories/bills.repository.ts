import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Bill } from "../types/bill.types";

type BillRow = Database["public"]["Tables"]["bills"]["Row"];

function mapBill(row: BillRow, categoryName: string | null): Bill {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    categoryId: row.category_id,
    categoryName,
    amount: row.amount,
    currency: row.currency,
    dueDate: row.due_date,
    expectedPaymentDate: row.expected_payment_date,
    accountId: row.account_id,
    status: row.status,
    recurrence: row.recurrence,
    recurring: row.recurring,
    provider: row.provider,
    notes: row.notes,
    paidTransactionId: row.paid_transaction_id,
  };
}

/** Único punto de acceso a Supabase para `bills`. RLS filtra por user_id = auth.uid(). */
export class BillsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async categoryNamesById(ids: string[]): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) return new Map();
    const { data, error } = await this.supabase.from("categories").select("id, name").in("id", uniqueIds);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.id, row.name]));
  }

  async list(options: { includePaid?: boolean } = {}): Promise<Bill[]> {
    let query = this.supabase.from("bills").select("*").order("due_date", { ascending: true });
    if (!options.includePaid) query = query.in("status", ["PENDING", "SCHEDULED", "OVERDUE"]);

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const categoryNames = await this.categoryNamesById(rows.map((r) => r.category_id).filter((id): id is string => id !== null));
    return rows.map((row) => mapBill(row, row.category_id ? (categoryNames.get(row.category_id) ?? null) : null));
  }

  async findById(id: string): Promise<Bill | null> {
    const { data, error } = await this.supabase.from("bills").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const categoryNames = await this.categoryNamesById(data.category_id ? [data.category_id] : []);
    return mapBill(data, data.category_id ? (categoryNames.get(data.category_id) ?? null) : null);
  }

  async create(userId: string, input: Omit<Database["public"]["Tables"]["bills"]["Insert"], "user_id">): Promise<Bill> {
    const { data, error } = await this.supabase
      .from("bills")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single();
    if (error) throw error;
    return mapBill(data, null);
  }

  async markPaid(id: string, transactionId: string, paymentDate: string): Promise<void> {
    const { error } = await this.supabase
      .from("bills")
      .update({ status: "PAID", paid_transaction_id: transactionId, expected_payment_date: paymentDate })
      .eq("id", id);
    if (error) throw error;
  }

  async cancel(id: string): Promise<void> {
    const { error } = await this.supabase.from("bills").update({ status: "CANCELLED" }).eq("id", id);
    if (error) throw error;
  }
}
