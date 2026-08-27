import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Subscription } from "../types/subscription.types";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

function mapSubscription(row: SubscriptionRow, categoryName: string | null): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    provider: row.provider,
    categoryId: row.category_id,
    categoryName,
    amount: row.amount,
    currency: row.currency,
    frequency: row.frequency,
    nextPaymentDate: row.next_payment_date,
    accountId: row.account_id,
    active: row.active,
    startDate: row.start_date,
    cancellationDate: row.cancellation_date,
    notes: row.notes,
    recurringTransactionId: row.recurring_transaction_id,
  };
}

/** Único punto de acceso a Supabase para `subscriptions`. RLS filtra por user_id = auth.uid(). */
export class SubscriptionsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async categoryNamesById(ids: string[]): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) return new Map();
    const { data, error } = await this.supabase.from("categories").select("id, name").in("id", uniqueIds);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.id, row.name]));
  }

  async list(options: { includeInactive?: boolean } = {}): Promise<Subscription[]> {
    let query = this.supabase.from("subscriptions").select("*").order("next_payment_date", { ascending: true });
    if (!options.includeInactive) query = query.eq("active", true);

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const categoryNames = await this.categoryNamesById(rows.map((r) => r.category_id).filter((id): id is string => id !== null));
    return rows.map((row) => mapSubscription(row, row.category_id ? (categoryNames.get(row.category_id) ?? null) : null));
  }

  async create(userId: string, input: Omit<Database["public"]["Tables"]["subscriptions"]["Insert"], "user_id">): Promise<Subscription> {
    const { data, error } = await this.supabase
      .from("subscriptions")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single();
    if (error) throw error;
    return mapSubscription(data, null);
  }

  /** Devuelve el `recurring_transaction_id` vinculado (si había uno) para que el service lo desactive también. */
  async cancel(id: string, cancellationDate: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("subscriptions")
      .update({ active: false, cancellation_date: cancellationDate })
      .eq("id", id)
      .select("recurring_transaction_id")
      .single();
    if (error) throw error;
    return data.recurring_transaction_id;
  }
}
