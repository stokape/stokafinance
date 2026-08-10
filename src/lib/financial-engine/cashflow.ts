import Decimal from "decimal.js";
import { sumMoney, toMoney } from "@/lib/utils/money";
import type { TransactionForEngine } from "./types";

/** Filtra transacciones válidas para KPIs: CONFIRMED y no eliminadas (§58). */
function isCountable(tx: TransactionForEngine): boolean {
  return tx.status === "CONFIRMED" && tx.deletedAt === null;
}

function isWithinMonth(dateIso: string, year: number, month: number): boolean {
  const [y, m] = dateIso.split("-").map(Number);
  return y === year && m === month;
}

function isWithinRange(dateIso: string, startIso: string, endIso: string): boolean {
  return dateIso >= startIso && dateIso <= endIso;
}

/**
 * Ingreso del mes. Sólo cuenta `INCOME`. Las transferencias entre cuentas
 * propias NUNCA se cuentan como ingreso (regla crítica §58/§10).
 */
export function calculateMonthlyIncome(transactions: TransactionForEngine[], year: number, month: number): Decimal {
  const income = transactions.filter(
    (tx) => isCountable(tx) && tx.type === "INCOME" && isWithinMonth(tx.date, year, month),
  );
  return sumMoney(income.map((tx) => tx.amount));
}

/**
 * Gasto del mes. Cuenta `EXPENSE` + `CARD_PURCHASE` (una compra con tarjeta
 * es gasto en la fecha de compra aunque el banco no se mueva hasta el pago,
 * §58) + el componente de interés de `LOAN_PAYMENT` (el capital no es gasto,
 * es amortización de deuda). `CARD_PAYMENT` nunca se cuenta: sería duplicar
 * el gasto ya reconocido en la compra.
 */
export function calculateMonthlyExpenses(transactions: TransactionForEngine[], year: number, month: number): Decimal {
  const inMonth = transactions.filter((tx) => isCountable(tx) && isWithinMonth(tx.date, year, month));

  const directExpenses = inMonth.filter((tx) => tx.type === "EXPENSE" || tx.type === "CARD_PURCHASE");
  const loanInterest = inMonth.filter((tx) => tx.type === "LOAN_PAYMENT" && tx.interestAmount);

  return sumMoney([
    ...directExpenses.map((tx) => tx.amount),
    ...loanInterest.map((tx) => tx.interestAmount as Decimal | string | number),
  ]);
}

export function calculateMonthlyCashFlow(monthlyIncome: Decimal, monthlyExpenses: Decimal): Decimal {
  return monthlyIncome.minus(monthlyExpenses);
}

/** Igual que calculateMonthlyIncome/Expenses pero para un rango de fechas arbitrario (reportes). */
export function calculateCashFlowForRange(
  transactions: TransactionForEngine[],
  startIso: string,
  endIso: string,
): { income: Decimal; expenses: Decimal; netCashFlow: Decimal } {
  const inRange = transactions.filter((tx) => isCountable(tx) && isWithinRange(tx.date, startIso, endIso));

  const income = sumMoney(inRange.filter((tx) => tx.type === "INCOME").map((tx) => tx.amount));

  const directExpenses = inRange.filter((tx) => tx.type === "EXPENSE" || tx.type === "CARD_PURCHASE");
  const loanInterest = inRange.filter((tx) => tx.type === "LOAN_PAYMENT" && tx.interestAmount);
  const expenses = sumMoney([
    ...directExpenses.map((tx) => tx.amount),
    ...loanInterest.map((tx) => tx.interestAmount as Decimal | string | number),
  ]);

  return { income, expenses, netCashFlow: income.minus(expenses) };
}

/** Agrupa gastos por categoría dentro de un rango de fechas (para gráficos y alertas). */
export function groupExpensesByCategory(
  transactions: TransactionForEngine[],
  startIso: string,
  endIso: string,
): Map<string | null, Decimal> {
  const inRange = transactions.filter(
    (tx) =>
      isCountable(tx) &&
      (tx.type === "EXPENSE" || tx.type === "CARD_PURCHASE") &&
      isWithinRange(tx.date, startIso, endIso),
  );

  const totals = new Map<string | null, Decimal>();
  for (const tx of inRange) {
    const current = totals.get(tx.categoryId) ?? new Decimal(0);
    totals.set(tx.categoryId, current.plus(toMoney(tx.amount)));
  }
  return totals;
}
