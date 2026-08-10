import Decimal from "decimal.js";
import { toMoney } from "@/lib/utils/money";
import type { SafeToSpendInput } from "./types";

/**
 * "Dinero disponible para gastar" (§23). NO es el saldo bancario: resta
 * obligaciones previstas antes de decir cuánto se puede gastar libremente.
 *
 * safeToSpend =
 *     saldo líquido
 *   + ingresos confirmados dentro del horizonte
 *   - pagos obligatorios previstos (bills)
 *   - pagos de deuda previstos (tarjetas, préstamos)
 *   - presupuesto ya reservado (lo no gastado de categorías presupuestadas)
 *   - meta mínima de ahorro configurable
 *
 * El resultado se trunca en 0 (nunca se comunica un "disponible" negativo
 * como si fuera gastable; un valor negativo se reporta aparte como déficit).
 */
export function calculateAvailableToSpend(input: SafeToSpendInput): {
  safeToSpend: Decimal;
  isDeficit: boolean;
  rawAmount: Decimal;
} {
  const rawAmount = toMoney(input.liquidBalance)
    .plus(toMoney(input.confirmedUpcomingIncome))
    .minus(toMoney(input.upcomingObligatoryPayments))
    .minus(toMoney(input.upcomingDebtPayments))
    .minus(toMoney(input.reservedBudget))
    .minus(toMoney(input.minimumSavingsGoal));

  return {
    rawAmount,
    isDeficit: rawAmount.isNegative(),
    safeToSpend: Decimal.max(rawAmount, 0),
  };
}
