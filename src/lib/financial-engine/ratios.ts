import Decimal from "decimal.js";
import { sumMoney, toMoney } from "@/lib/utils/money";
import type { TransactionForEngine } from "./types";

/** Deuda/Ingreso = pagos mensuales de deuda / ingreso mensual * 100. */
export function calculateDebtToIncome(
  monthlyDebtPayments: Decimal | string | number,
  monthlyIncome: Decimal | string | number,
): Decimal {
  const income = toMoney(monthlyIncome);
  if (income.lessThanOrEqualTo(0)) return new Decimal(0);
  return toMoney(monthlyDebtPayments).dividedBy(income).times(100);
}

/**
 * % de gasto fijo sobre el total. `fixedCategoryIds` lo decide el usuario al
 * marcar categorías como fijas (vivienda, seguros, etc.); sin esa marca el
 * motor no puede inferir qué es fijo, así que se recibe como parámetro.
 */
export function calculateFixedExpenseRatio(
  expenseTransactions: TransactionForEngine[],
  fixedCategoryIds: Set<string>,
): Decimal {
  const total = sumMoney(expenseTransactions.map((tx) => tx.amount));
  if (total.lessThanOrEqualTo(0)) return new Decimal(0);
  const fixed = sumMoney(
    expenseTransactions.filter((tx) => tx.categoryId && fixedCategoryIds.has(tx.categoryId)).map((tx) => tx.amount),
  );
  return fixed.dividedBy(total).times(100);
}

export function calculateDiscretionaryExpenseRatio(
  expenseTransactions: TransactionForEngine[],
  fixedCategoryIds: Set<string>,
): Decimal {
  return new Decimal(100).minus(calculateFixedExpenseRatio(expenseTransactions, fixedCategoryIds));
}

/** Meses de fondo de emergencia = saldo líquido / gasto mensual promedio. */
export function calculateEmergencyFundMonths(
  liquidBalance: Decimal | string | number,
  averageMonthlyExpenses: Decimal | string | number,
): Decimal {
  const expenses = toMoney(averageMonthlyExpenses);
  if (expenses.lessThanOrEqualTo(0)) return new Decimal(0);
  return toMoney(liquidBalance).dividedBy(expenses);
}
