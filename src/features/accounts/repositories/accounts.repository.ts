import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Account, AccountWithBalance } from "../types/account.types";

function mapRow(row: Database["public"]["Tables"]["accounts"]["Row"]): Account {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    institution: row.institution,
    accountType: row.account_type,
    currency: row.currency,
    initialBalance: row.initial_balance,
    icon: row.icon,
    active: row.active,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/**
 * Único punto de acceso a Supabase para `accounts`. RLS filtra por
 * user_id = auth.uid(). `account_balances` es una VIEW derivada del ledger
 * (sin FK real hacia `accounts`), así que PostgREST no puede "embeberla"
 * automáticamente: se consulta aparte y se combina en memoria.
 */
export class AccountsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async balancesById(accountIds: string[]): Promise<Map<string, string>> {
    if (accountIds.length === 0) return new Map();
    const { data, error } = await this.supabase
      .from("account_balances")
      .select("account_id, current_balance")
      .in("account_id", accountIds);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.account_id, row.current_balance]));
  }

  async list(options: { includeInactive?: boolean } = {}): Promise<AccountWithBalance[]> {
    let query = this.supabase.from("accounts").select("*").is("deleted_at", null).order("created_at", { ascending: true });

    if (!options.includeInactive) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;
    if (error) throw error;

    const accounts = data ?? [];
    const balances = await this.balancesById(accounts.map((a) => a.id));

    return accounts.map((row) => ({
      ...mapRow(row),
      currentBalance: balances.get(row.id) ?? row.initial_balance,
    }));
  }

  async findById(id: string): Promise<AccountWithBalance | null> {
    const { data, error } = await this.supabase.from("accounts").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const balances = await this.balancesById([data.id]);
    return { ...mapRow(data), currentBalance: balances.get(data.id) ?? data.initial_balance };
  }

  async create(userId: string, input: Omit<Database["public"]["Tables"]["accounts"]["Insert"], "user_id">): Promise<Account> {
    const { data, error } = await this.supabase
      .from("accounts")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return mapRow(data);
  }

  async update(id: string, patch: Database["public"]["Tables"]["accounts"]["Update"]): Promise<Account> {
    const { data, error } = await this.supabase.from("accounts").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return mapRow(data);
  }

  /** Soft delete: nunca se borra un registro financiero desde la UI (§33/§48). */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("accounts")
      .update({ deleted_at: new Date().toISOString(), active: false })
      .eq("id", id);
    if (error) throw error;
  }

  /** true si la cuenta tiene al menos una transacción no eliminada asociada (origen o destino). */
  async hasTransactions(id: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .or(`account_id.eq.${id},destination_account_id.eq.${id}`)
      .is("deleted_at", null);
    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
