import { z } from "zod";

/**
 * Zod schema para montos monetarios. A propósito NO usa `z.coerce.number()`:
 * un form siempre entrega string, y convertir a `number` introduce
 * aritmética de punto flotante antes de llegar a `Decimal`. Este schema
 * valida el formato y deja el valor como string — la conversión a Decimal
 * ocurre en el service layer vía `toMoney()` (ver lib/utils/money.ts).
 */
export function moneyAmountSchema(options: { allowZero?: boolean; allowNegative?: boolean } = {}) {
  const { allowZero = false, allowNegative = false } = options;
  const pattern = allowNegative ? /^-?\d{1,12}(\.\d{1,2})?$/ : /^\d{1,12}(\.\d{1,2})?$/;

  return z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim())
    .refine((value) => pattern.test(value), { message: "Ingresa un monto válido (máximo 2 decimales)" })
    .refine((value) => (allowZero ? true : Number(value) !== 0), { message: "El monto no puede ser 0" });
}

export const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(3, "Usa el código ISO de 3 letras (PEN, USD...)");

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)");
