import Decimal from "decimal.js";
import { differenceInCalendarMonths, parseISO } from "date-fns";
import { toMoney } from "@/lib/utils/money";

export interface GoalProgressResult {
  percentageComplete: Decimal;
  amountRemaining: Decimal;
  isComplete: boolean;
}

/** Progreso de una meta de ahorro (§18): % alcanzado y monto faltante. */
export function calculateGoalProgress(targetAmount: string | number | Decimal, currentAmount: string | number | Decimal): GoalProgressResult {
  const target = toMoney(targetAmount);
  const current = toMoney(currentAmount);
  const amountRemaining = Decimal.max(target.minus(current), 0);
  const percentageComplete = target.greaterThan(0) ? Decimal.min(current.dividedBy(target).times(100), 100) : new Decimal(0);

  return {
    percentageComplete,
    amountRemaining,
    isComplete: current.greaterThanOrEqualTo(target),
  };
}

/**
 * Ahorro mensual requerido para llegar a la meta en la fecha objetivo
 * (§18). Sin fecha objetivo, o con la fecha ya vencida, no hay forma de
 * repartir el faltante en el tiempo — se devuelve el monto faltante
 * completo (equivalente a "necesitas esto ya").
 */
export function calculateRequiredMonthlyContribution(
  amountRemaining: string | number | Decimal,
  targetDate: string | null,
  todayIso: string,
): Decimal {
  const remaining = toMoney(amountRemaining);
  if (remaining.lessThanOrEqualTo(0)) return new Decimal(0);
  if (!targetDate) return remaining;

  const monthsRemaining = differenceInCalendarMonths(parseISO(targetDate), parseISO(todayIso));
  if (monthsRemaining <= 0) return remaining;

  return remaining.dividedBy(monthsRemaining);
}
