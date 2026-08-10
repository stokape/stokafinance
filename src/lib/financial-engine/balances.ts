import Decimal from "decimal.js";
import { sumMoney, toMoney } from "@/lib/utils/money";
import type { AccountBalanceInput, LedgerEntryInput } from "./types";

/**
 * Saldo de una cuenta = saldo inicial + suma de sus ledger entries.
 * No usa `transactions` directamente: el ledger ya excluyó lo PENDING/
 * CANCELLED/soft-deleted (ver trigger fn_sync_ledger_entries).
 */
export function calculateAccountBalance(
  account: Pick<AccountBalanceInput, "id" | "initialBalance">,
  ledgerEntries: LedgerEntryInput[],
): Decimal {
  const entriesForAccount = ledgerEntries.filter(
    (entry) => entry.targetType === "ACCOUNT" && entry.targetId === account.id,
  );
  return sumMoney([account.initialBalance, ...entriesForAccount.map((e) => e.amount)]);
}

/**
 * Suma el saldo de todas las cuentas activas. Asume una única moneda (PEN)
 * en el MVP — sumar monedas distintas requiere tasas de cambio, que quedan
 * fuera de alcance hasta que se implemente multi-currency real.
 */
export function calculateTotalBalance(
  accounts: AccountBalanceInput[],
  ledgerEntries: LedgerEntryInput[],
  options: { onlyActive?: boolean } = {},
): Decimal {
  const onlyActive = options.onlyActive ?? true;
  const relevant = onlyActive ? accounts.filter((a) => a.active) : accounts;
  return sumMoney(relevant.map((account) => calculateAccountBalance(account, ledgerEntries)));
}

/** Deuda actual de una tarjeta = suma de sus ledger entries (CREDIT_CARD). */
export function calculateCreditCardDebt(creditCardId: string, ledgerEntries: LedgerEntryInput[]): Decimal {
  const entries = ledgerEntries.filter((e) => e.targetType === "CREDIT_CARD" && e.targetId === creditCardId);
  return sumMoney(entries.map((e) => e.amount));
}

/** Saldo pendiente de un préstamo = suma de sus ledger entries (LOAN). */
export function calculateLoanBalance(loanId: string, ledgerEntries: LedgerEntryInput[]): Decimal {
  const entries = ledgerEntries.filter((e) => e.targetType === "LOAN" && e.targetId === loanId);
  return sumMoney(entries.map((e) => e.amount));
}

/** Deuda total = suma de deudas de tarjetas + saldos de préstamos + pasivos manuales. */
export function calculateTotalDebt(params: {
  creditCardDebts: Decimal[];
  loanBalances: Decimal[];
  otherLiabilities?: Decimal[];
}): Decimal {
  return sumMoney([...params.creditCardDebts, ...params.loanBalances, ...(params.otherLiabilities ?? [])]);
}

export function calculateCreditUtilization(currentDebt: Decimal | string | number, creditLimit: Decimal | string | number): Decimal {
  const limit = toMoney(creditLimit);
  if (limit.lessThanOrEqualTo(0)) return new Decimal(0);
  return toMoney(currentDebt).dividedBy(limit).times(100);
}
