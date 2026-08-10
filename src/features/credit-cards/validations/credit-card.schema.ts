import { z } from "zod";
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema } from "@/lib/validations/money.schema";
import { requiredUuidSchema } from "@/lib/validations/select.schema";

export const createCreditCardSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre a la tarjeta").max(80),
  bank: z.string().trim().min(1, "Indica el banco emisor").max(80),
  brand: z.string().trim().max(40).optional().or(z.literal("")),
  lastFourDigits: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Deben ser 4 dígitos")
    .optional()
    .or(z.literal("")),
  currency: currencyCodeSchema.default("PEN"),
  creditLimit: moneyAmountSchema(),
  closingDay: z.coerce.number().int().min(1).max(31),
  paymentDay: z.coerce.number().int().min(1).max(31),
  annualInterestRate: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .optional()
    .or(z.literal("")),
});
export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;

export const createCardPurchaseSchema = z.object({
  creditCardId: requiredUuidSchema("Selecciona una tarjeta"),
  categoryId: requiredUuidSchema("Selecciona una categoría"),
  description: z.string().trim().min(1, "Describe la compra").max(200),
  merchant: z.string().trim().max(120).optional().or(z.literal("")),
  amount: moneyAmountSchema(),
  purchaseDate: isoDateSchema,
  installments: z.coerce.number().int().min(1).max(60).default(1),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateCardPurchaseInput = z.infer<typeof createCardPurchaseSchema>;

export const payCreditCardSchema = z.object({
  creditCardId: requiredUuidSchema("Selecciona una tarjeta"),
  accountId: requiredUuidSchema("Selecciona la cuenta de origen"),
  amount: moneyAmountSchema(),
  paymentDate: isoDateSchema,
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type PayCreditCardInput = z.infer<typeof payCreditCardSchema>;
