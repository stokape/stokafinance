import { assertFeatureEnabled } from "@/lib/config/features";
import type { TransactionIntakeInput } from "@/features/transactions/types/intake.types";

/**
 * Contrato futuro para sincronización directa con bancos (Fase Futura C).
 * Sin implementación productiva y sin almacenamiento de credenciales
 * bancarias en ningún caso (§45). Activar requiere `BANK_SYNC_ENABLED=true`
 * y una decisión explícita de agregador/proveedor (ver docs/costs.md).
 */
export interface BankTransactionAdapter {
  fetchRecentTransactions(userId: string, accountId: string): Promise<Partial<TransactionIntakeInput>[]>;
}

export function getBankTransactionAdapter(): BankTransactionAdapter {
  assertFeatureEnabled("bankSyncEnabled");
  throw new Error("Bank Sync aún no implementado. Ver docs/costs.md.");
}
