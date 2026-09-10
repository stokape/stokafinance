import { z } from "zod";
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema } from "@/lib/validations/money.schema";
import { requiredUuidSchema } from "@/lib/validations/select.schema";

const RECURRING_FREQUENCY_VALUES = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"] as const;

export const createExpenseSchema = z
  .object({
    accountId: requiredUuidSchema("Selecciona una cuenta"),
    categoryId: requiredUuidSchema("Selecciona una categoría"),
    subcategoryId: z.string().uuid().optional().or(z.literal("")),
    amount: moneyAmountSchema(),
    currency: currencyCodeSchema.default("PEN"),
    transactionDate: isoDateSchema,
    description: z.string().trim().min(1, "Describe el gasto").max(200),
    merchant: z.string().trim().max(120).optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    // Checkbox: "on" cuando está marcado, ausente (undefined) si no. Cuando
    // está marcado, este gasto no se registra una sola vez: se crea como
    // recurring_transactions (ver RecurringTransactionsService) y se
    // registrará solo cada ciclo — mismo mecanismo que ya usan
    // suscripciones y facturas recurrentes, ahora accesible desde el mismo
    // formulario de "Nuevo movimiento" en vez de una pantalla aparte.
    isRecurring: z.string().optional(),
    frequency: z.enum(RECURRING_FREQUENCY_VALUES).optional(),
    endDate: isoDateSchema.optional().or(z.literal("")),
  })
  .refine((data) => !data.isRecurring || !!data.frequency, {
    message: "Selecciona la frecuencia",
    path: ["frequency"],
  });
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const createIncomeSchema = z.object({
  accountId: requiredUuidSchema("Selecciona una cuenta"),
  categoryId: requiredUuidSchema("Selecciona una categoría"),
  amount: moneyAmountSchema(),
  currency: currencyCodeSchema.default("PEN"),
  transactionDate: isoDateSchema,
  description: z.string().trim().min(1, "Describe el ingreso").max(200),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;

export const createTransferSchema = z
  .object({
    accountId: requiredUuidSchema("Selecciona la cuenta de origen"),
    destinationAccountId: requiredUuidSchema("Selecciona la cuenta de destino"),
    amount: moneyAmountSchema(),
    currency: currencyCodeSchema.default("PEN"),
    transactionDate: isoDateSchema,
    description: z.string().trim().max(200).optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => data.accountId !== data.destinationAccountId, {
    message: "La cuenta de origen y destino deben ser distintas",
    path: ["destinationAccountId"],
  });
export type CreateTransferInput = z.infer<typeof createTransferSchema>;

export const transactionFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  transactionType: z.enum(["INCOME", "EXPENSE", "TRANSFER", "CARD_PURCHASE", "CARD_PAYMENT", "LOAN_DISBURSEMENT", "LOAN_PAYMENT"]).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional(),
  dateFrom: isoDateSchema.optional(),
  dateTo: isoDateSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
