import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Toda tabla propia del usuario (tiene `user_id`, o es `profiles` con
 * `id = auth.uid()`). Deliberadamente NO incluye `rate_limit_events` (no es
 * un dato personal identificable del usuario, es un contador de intentos
 * por IP/email) ni las vistas de saldo (son derivadas, se recalculan desde
 * estas mismas tablas).
 *
 * Si agregas una tabla nueva con `user_id` a una migración, agrégala aquí
 * también — igual que `scripts/check-rls.mjs` para RLS, esto no se detecta
 * solo.
 */
const OWNED_TABLES = [
  "accounts",
  "categories",
  "subcategories",
  "recurring_transactions",
  "import_batches",
  "credit_cards",
  "credit_card_transactions",
  "credit_card_installment_plans",
  "credit_card_statements",
  "loans",
  "loan_installments",
  "bills",
  "transactions",
  "ledger_entries",
  "budgets",
  "budget_categories",
  "subscriptions",
  "financial_goals",
  "goal_contributions",
  "assets",
  "liabilities",
  "financial_snapshots",
  "audit_logs",
  "whatsapp_connections",
] as const satisfies readonly (keyof Database["public"]["Tables"])[];

export interface DataExport {
  exportedAt: string;
  account: { id: string; email: string | undefined };
  data: Record<string, unknown[]>;
}

/**
 * Exportación completa de "mis datos" (derecho de acceso/portabilidad).
 * Corre con el cliente autenticado del usuario (nunca service_role) — RLS
 * garantiza que cada tabla sólo devuelve sus propias filas, así que no hace
 * falta ningún filtro `user_id` explícito aquí.
 */
export class DataExportService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async exportAll(userId: string, email: string | undefined): Promise<DataExport> {
    const { data: profile, error: profileError } = await this.supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profileError) throw profileError;

    const tableResults = await Promise.all(
      OWNED_TABLES.map(async (table) => {
        const { data, error } = await this.supabase.from(table).select("*");
        if (error) throw error;
        return [table, data ?? []] as const;
      }),
    );

    return {
      exportedAt: new Date().toISOString(),
      account: { id: userId, email },
      data: {
        profile: profile ? [profile] : [],
        ...Object.fromEntries(tableResults),
      },
    };
  }
}
