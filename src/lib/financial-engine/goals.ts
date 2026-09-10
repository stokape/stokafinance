import Decimal from "decimal.js";
import { addMonths, differenceInCalendarMonths, formatISO, parseISO } from "date-fns";
import { toMoney } from "@/lib/utils/money";

export type ContributionFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

/**
 * Convierte un aporte periódico (ej. S/100 quincenal) a su equivalente
 * mensual, para poder comparar/sumar ritmos de ahorro con distinta
 * frecuencia en la misma unidad. Usa meses de 30.44 días en promedio
 * (365.25/12) para semanal/quincenal — no es exacto calendario a
 * calendario, es una tasa de referencia para proyectar, no una cuota real.
 */
export function contributionToMonthlyPace(amount: string | number | Decimal, frequency: ContributionFrequency): Decimal {
  const value = toMoney(amount);
  const occurrencesPerYear: Record<ContributionFrequency, number> = {
    WEEKLY: 52,
    BIWEEKLY: 26,
    MONTHLY: 12,
    QUARTERLY: 4,
    SEMIANNUAL: 2,
    ANNUAL: 1,
  };
  return value.times(occurrencesPerYear[frequency]).dividedBy(12);
}

/**
 * Proyecta cuándo se alcanzaría una meta a un ritmo mensual de ahorro dado.
 * `null` = no se puede proyectar (sin ritmo, o ritmo en 0) — mejor no
 * mostrar nada a mostrar una fecha inventada. Si ya está cumplida, hoy.
 */
export function estimateGoalCompletionDate(
  amountRemaining: string | number | Decimal,
  monthlyPace: string | number | Decimal,
  todayIso: string,
): string | null {
  const remaining = toMoney(amountRemaining);
  if (remaining.lessThanOrEqualTo(0)) return todayIso;

  const pace = toMoney(monthlyPace);
  if (pace.lessThanOrEqualTo(0)) return null;

  const monthsNeeded = remaining.dividedBy(pace).ceil().toNumber();
  return formatISO(addMonths(parseISO(todayIso), monthsNeeded), { representation: "date" });
}

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
