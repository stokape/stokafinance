import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { TransactionForEngine } from "@/lib/financial-engine";
import type { TransactionFilters, TransactionListItem, PaginatedResult } from "../types/transaction.types";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

function mapRow(
  row: TransactionRow,
  accountNames: Map<string, string>,
  categoryNames: Map<string, string>,
): TransactionListItem {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    destinationAccountId: row.destination_account_id,
    creditCardId: row.credit_card_id,
    loanId: row.loan_id,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    transactionType: row.transaction_type,
    description: row.description,
    amount: row.amount,
    principalAmount: row.principal_amount,
    interestAmount: row.interest_amount,
    currency: row.currency,
    transactionDate: row.transaction_date,
    status: row.status,
    paymentMethod: row.payment_method,
    merchant: row.merchant,
    notes: row.notes,
    source: row.source,
    externalReference: row.external_reference,
    createdAt: row.created_at,
    accountName: row.account_id ? (accountNames.get(row.account_id) ?? null) : null,
    destinationAccountName: row.destination_account_id ? (accountNames.get(row.destination_account_id) ?? null) : null,
    categoryName: row.category_id ? (categoryNames.get(row.category_id) ?? null) : null,
  };
}

/** Único punto de acceso a Supabase para `transactions`. Sólo el Transaction Intake Service debe llamar a `insert`. */
export class TransactionsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async insert(row: Database["public"]["Tables"]["transactions"]["Insert"]): Promise<TransactionRow> {
    const { data, error } = await this.supabase.from("transactions").insert(row).select("*").single();
    if (error) throw error;
    return data;
  }

  async list(filters: TransactionFilters): Promise<PaginatedResult<TransactionListItem>> {
    let query = this.supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.accountId) {
      query = query.or(`account_id.eq.${filters.accountId},destination_account_id.eq.${filters.accountId}`);
    }
    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.transactionType) query = query.eq("transaction_type", filters.transactionType);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.dateFrom) query = query.gte("transaction_date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("transaction_date", filters.dateTo);
    if (filters.search) {
      const term = filters.search.replace(/[%_]/g, "");
      query = query.or(`description.ilike.%${term}%,merchant.ilike.%${term}%`);
    }

    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const accountIds = new Set<string>();
    const categoryIds = new Set<string>();
    for (const row of rows) {
      if (row.account_id) accountIds.add(row.account_id);
      if (row.destination_account_id) accountIds.add(row.destination_account_id);
      if (row.category_id) categoryIds.add(row.category_id);
    }

    const [accountNames, categoryNames] = await Promise.all([
      this.namesFor("accounts", Array.from(accountIds)),
      this.namesFor("categories", Array.from(categoryIds)),
    ]);

    return {
      items: rows.map((row) => mapRow(row, accountNames, categoryNames)),
      total: count ?? 0,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  /**
   * Vista mínima para el Financial Engine (dashboard, reportes, forecast):
   * sin joins, sólo los campos que las funciones puras necesitan.
   */
  async listForEngine(dateFrom: string, dateTo: string): Promise<TransactionForEngine[]> {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("id, transaction_type, amount, interest_amount, category_id, transaction_date, status, deleted_at")
      .gte("transaction_date", dateFrom)
      .lte("transaction_date", dateTo);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      type: row.transaction_type,
      amount: row.amount,
      interestAmount: row.interest_amount,
      categoryId: row.category_id,
      date: row.transaction_date,
      status: row.status,
      deletedAt: row.deleted_at,
    }));
  }

  private async namesFor(table: "accounts" | "categories", ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const { data, error } = await this.supabase.from(table).select("id, name").in("id", ids);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.id as string, row.name as string]));
  }

  /** Cancela (soft) una transacción: el trigger de ledger revierte su efecto en saldos automáticamente. */
  async cancel(id: string): Promise<void> {
    const { error } = await this.supabase.from("transactions").update({ status: "CANCELLED" }).eq("id", id);
    if (error) throw error;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  /** Detección de duplicados por combinación cuenta+fecha+monto+descripción (usado por importación CSV, Fase 8). */
  async findPotentialDuplicate(params: {
    accountId: string;
    transactionDate: string;
    amount: string;
    description: string;
  }): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("account_id", params.accountId)
      .eq("transaction_date", params.transactionDate)
      .eq("amount", params.amount)
      .eq("description", params.description)
      .is("deleted_at", null);
    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
