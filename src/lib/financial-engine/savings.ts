import Decimal from "decimal.js";
import { toMoney } from "@/lib/utils/money";

/**
 * Ahorro del período = ingresos - gastos (equivalente al flujo de caja neto
 * del período; ver docs/financial-engine.md para la justificación de no
 * separar "ahorro" de "cash flow" en el MVP).
 */
export function calculateSavings(income: Decimal | string | number, expenses: Decimal | string | number): Decimal {
  return toMoney(income).minus(toMoney(expenses));
}

/** Tasa de ahorro = ahorro / ingresos * 100. Protegida contra ingreso cero. */
export function calculateSavingsRate(income: Decimal | string | number, savings: Decimal | string | number): Decimal {
  const incomeAmount = toMoney(income);
  if (incomeAmount.lessThanOrEqualTo(0)) return new Decimal(0);
  return toMoney(savings).dividedBy(incomeAmount).times(100);
}
