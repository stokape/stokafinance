import Decimal from "decimal.js";
import { getCurrencySymbol } from "@/lib/config/app";

/**
 * Utilidades monetarias. Todo valor de dinero que entra o sale del Financial
 * Engine debe pasar por aquí — nunca operar `number` directamente sobre
 * montos financieros (errores de punto flotante). Postgres almacena
 * NUMERIC/DECIMAL; en TypeScript usamos `decimal.js` como equivalente.
 */

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = string | number | Decimal;

/** Convierte cualquier entrada numérica/string/Decimal a Decimal, sin pasar por `number` cuando el input ya es string. */
export function toMoney(value: MoneyInput): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

export function addMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return toMoney(a).plus(toMoney(b));
}

export function subtractMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return toMoney(a).minus(toMoney(b));
}

export function multiplyMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return toMoney(a).times(toMoney(b));
}

export function divideMoney(a: MoneyInput, b: MoneyInput): Decimal {
  const divisor = toMoney(b);
  if (divisor.isZero()) return new Decimal(0);
  return toMoney(a).dividedBy(divisor);
}

export function sumMoney(values: MoneyInput[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(toMoney(v)), new Decimal(0));
}

/** Redondea a 2 decimales (centavos) con el modo de redondeo estándar. */
export function roundMoney(value: MoneyInput): Decimal {
  return toMoney(value).toDecimalPlaces(2);
}

export function isPositive(value: MoneyInput): boolean {
  return toMoney(value).greaterThan(0);
}

export function isNegative(value: MoneyInput): boolean {
  return toMoney(value).lessThan(0);
}

export function isZero(value: MoneyInput): boolean {
  return toMoney(value).isZero();
}

export function toNumber(value: MoneyInput): number {
  return toMoney(value).toNumber();
}

/** Formatea un monto como "S/ 1,250.50" usando el locale/moneda del usuario. */
export function formatMoney(value: MoneyInput, currency = "PEN", locale = "es-PE"): string {
  const amount = roundMoney(value).toNumber();
  const symbol = getCurrencySymbol(currency);
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? "-" : "";
  return `${sign}${symbol} ${formatted}`;
}

/** Formatea un porcentaje, ej. formatPercentage(32.456) -> "32.5%" */
export function formatPercentage(value: MoneyInput, decimals = 1): string {
  return `${toMoney(value).toDecimalPlaces(decimals).toString()}%`;
}
