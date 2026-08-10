import Decimal from "decimal.js";
import { addDays, formatISO, parseISO } from "date-fns";
import { toMoney } from "@/lib/utils/money";
import type { ForecastDayPoint, ForecastEvent, ForecastResult } from "./types";

function toDateOnlyIso(date: Date): string {
  return formatISO(date, { representation: "date" });
}

/**
 * Proyecta el saldo día a día aplicando eventos futuros conocidos (bills,
 * cuotas de préstamo/tarjeta, suscripciones, recurrentes) sobre el saldo
 * actual. Horizonte típico: 7/15/30/60/90 días (§24).
 *
 * No inventa eventos: si un movimiento no está en `events`, no aparece en la
 * proyección. Los eventos deben venir ya resueltos por el service layer
 * (bills pendientes, próximas cuotas, próximas suscripciones, etc.).
 */
export function forecastCashFlow(
  currentBalance: Decimal | string | number,
  events: ForecastEvent[],
  todayIso: string,
  horizonDays: number,
): ForecastResult {
  const startingBalance = toMoney(currentBalance);
  const startDate = parseISO(todayIso);

  const eventsByDate = new Map<string, ForecastEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  const days: ForecastDayPoint[] = [];
  let runningBalance = startingBalance;
  let lowestBalance = startingBalance;
  let lowestBalanceDate: string | null = todayIso;
  const negativeDates: string[] = [];

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const date = toDateOnlyIso(addDays(startDate, offset));
    const dayEvents = eventsByDate.get(date) ?? [];

    if (dayEvents.length > 0) {
      const delta = dayEvents.reduce((acc, e) => acc.plus(toMoney(e.amount)), new Decimal(0));
      runningBalance = runningBalance.plus(delta);
    }

    if (runningBalance.lessThan(lowestBalance)) {
      lowestBalance = runningBalance;
      lowestBalanceDate = date;
    }
    if (runningBalance.isNegative()) {
      negativeDates.push(date);
    }

    days.push({ date, projectedBalance: runningBalance, events: dayEvents });
  }

  return {
    startingBalance,
    endingBalance: runningBalance,
    days,
    lowestBalance,
    lowestBalanceDate,
    negativeDates,
  };
}
