import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { RecurringTransaction } from "../types/recurring-transaction.types";

type RecurringRow = Database["public"]["Tables"]["recurring_transactions"]["Row"];

function mapRow(row: RecurringRow, accountNames: Map<string, string>, categoryNames: Map<string, string>): RecurringTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    accountName: row.account_id ? (accountNames.get(row.account_id) ?? null) : null,
    destinationAccountId: row.destination_account_id,
    destinationAccountName: row.destination_account_id ? (accountNames.get(row.destination_account_id) ?? null) : null,
    categoryId: row.category_id,
    categoryName: row.category_id ? (categoryNames.get(row.category_id) ?? null) : null,
    transactionType: row.transaction_type,
    description: row.description,
    amount: row.amount,
    currency: row.currency,
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date,
    nextOccurrenceDate: row.next_occurrence_date,
    active: row.active,
    notes: row.notes,
  };
}

/** Único punto de acceso a Supabase para `recurring_transactions`. RLS filtra por user_id = auth.uid(). */
export class RecurringTransactionsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async namesFor(table: "accounts" | "categories", ids: string[]): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) return new Map();
    const { data, error } = await this.supabase.from(table).select("id, name").in("id", uniqueIds);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.id as string, row.name as string]));
  }

  async list(options: { includeInactive?: boolean } = {}): Promise<RecurringTransaction[]> {
    let query = this.supabase.from("recurring_transactions").select("*").order("next_occurrence_date", { ascending: true });
    if (!options.includeInactive) query = query.eq("active", true);

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const accountIds = rows.flatMap((r) => [r.account_id, r.destination_account_id]).filter((id): id is string => id !== null);
    const categoryIds = rows.map((r) => r.category_id).filter((id): id is string => id !== null);
    const [accountNames, categoryNames] = await Promise.all([this.namesFor("accounts", accountIds), this.namesFor("categories", categoryIds)]);

    return rows.map((row) => mapRow(row, accountNames, categoryNames));
  }

  /** Todas las recurrencias activas con `next_occurrence_date <= todayIso` — candidatas a generar movimientos. */
  async listDue(todayIso: string): Promise<RecurringTransaction[]> {
    const { data, error } = await this.supabase
      .from("recurring_transactions")
      .select("*")
      .eq("active", true)
      .lte("next_occurrence_date", todayIso);
    if (error) throw error;

    const rows = data ?? [];
    const accountIds = rows.flatMap((r) => [r.account_id, r.destination_account_id]).filter((id): id is string => id !== null);
    const categoryIds = rows.map((r) => r.category_id).filter((id): id is string => id !== null);
    const [accountNames, categoryNames] = await Promise.all([this.namesFor("accounts", accountIds), this.namesFor("categories", categoryIds)]);

    return rows.map((row) => mapRow(row, accountNames, categoryNames));
  }

  async create(userId: string, input: Omit<Database["public"]["Tables"]["recurring_transactions"]["Insert"], "user_id">): Promise<string> {
    const { data, error } = await this.supabase
      .from("recurring_transactions")
      .insert({ ...input, user_id: userId })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateNextOccurrence(id: string, nextOccurrenceDate: string): Promise<void> {
    const { error } = await this.supabase.from("recurring_transactions").update({ next_occurrence_date: nextOccurrenceDate }).eq("id", id);
    if (error) throw error;
  }

  async setActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase.from("recurring_transactions").update({ active }).eq("id", id);
    if (error) throw error;
  }
}
