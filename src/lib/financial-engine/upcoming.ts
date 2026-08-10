import Decimal from "decimal.js";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { sumMoney, toMoney } from "@/lib/utils/money";
import type { SubscriptionInput, UpcomingPaymentItem, UpcomingPaymentUrgency } from "./types";

const MONTHLY_EQUIVALENT_FACTOR: Record<SubscriptionInput["frequency"], Decimal> = {
  WEEKLY: new Decimal(52).dividedBy(12),
  MONTHLY: new Decimal(1),
  QUARTERLY: new Decimal(1).dividedBy(3),
  SEMIANNUAL: new Decimal(1).dividedBy(6),
  ANNUAL: new Decimal(1).dividedBy(12),
};

export interface SubscriptionCostResult {
  activeCount: number;
  monthlyCost: Decimal;
  annualCost: Decimal;
}

/** Costo mensual/anual equivalente de todas las suscripciones activas (§17). */
export function calculateSubscriptionCost(subscriptions: SubscriptionInput[]): SubscriptionCostResult {
  const active = subscriptions.filter((s) => s.active);
  const monthlyCost = sumMoney(
    active.map((s) => toMoney(s.amount).times(MONTHLY_EQUIVALENT_FACTOR[s.frequency])),
  );
  return {
    activeCount: active.length,
    monthlyCost,
    annualCost: monthlyCost.times(12),
  };
}

function classifyUrgency(dueDateIso: string, todayIso: string): UpcomingPaymentUrgency {
  const diff = differenceInCalendarDays(parseISO(dueDateIso), parseISO(todayIso));
  if (diff < 0) return "OVERDUE";
  if (diff === 0) return "DUE_TODAY";
  if (diff === 1) return "DUE_TOMORROW";
  if (diff <= 7) return "DUE_THIS_WEEK";
  return "UPCOMING";
}

export interface UpcomingPaymentSource {
  id: string;
  label: string;
  amount: Decimal | string | number;
  dueDate: string;
  kind: UpcomingPaymentItem["kind"];
}

/**
 * Consolida bills + cuotas de préstamo + estados de tarjeta + suscripciones
 * en una sola lista de "próximos pagos", clasificada por urgencia (§17/§24).
 */
export function calculateUpcomingPayments(
  sources: UpcomingPaymentSource[],
  todayIso: string,
  horizonDays: number,
): UpcomingPaymentItem[] {
  return sources
    .map((source) => ({
      id: source.id,
      label: source.label,
      amount: toMoney(source.amount),
      dueDate: source.dueDate,
      kind: source.kind,
      urgency: classifyUrgency(source.dueDate, todayIso),
    }))
    .filter((item) => {
      const diff = differenceInCalendarDays(parseISO(item.dueDate), parseISO(todayIso));
      return diff <= horizonDays; // incluye atrasados (diff negativo) y futuros dentro del horizonte
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
