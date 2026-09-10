import { z } from "zod";
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema } from "@/lib/validations/money.schema";
import { requiredUuidSchema } from "@/lib/validations/select.schema";

export const createLoanSchema = z.object({
  lender: z.string().trim().min(1, "Indica el acreedor").max(120),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  originalAmount: moneyAmountSchema(),
  interestRate: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .optional()
    .or(z.literal("")),
  numberOfInstallments: z.coerce.number().int().min(1).max(360),
  startDate: isoDateSchema,
  currency: currencyCodeSchema.default("PEN"),
  // PRINCIPAL_AND_INTEREST (default, sistema francés) o INTEREST_ONLY
  // (cada cuota es sólo interés, capital completo al final — típico de
  // préstamos informales/familiares).
  paymentType: z.enum(["PRINCIPAL_AND_INTEREST", "INTEREST_ONLY"]).default("PRINCIPAL_AND_INTEREST"),
  // Si el usuario ya sabe cuánto paga cada cuota (monto fijo acordado, sin
  // necesidad de declarar una tasa formal), lo escribe acá y se usa tal
  // cual en vez de calcularlo desde interestRate.
  installmentAmount: moneyAmountSchema().optional().or(z.literal("")),
});
export type CreateLoanInput = z.infer<typeof createLoanSchema>;

export const payLoanInstallmentSchema = z.object({
  loanId: requiredUuidSchema("Selecciona un préstamo"),
  accountId: requiredUuidSchema("Selecciona la cuenta de origen"),
  paymentDate: isoDateSchema,
});
export type PayLoanInstallmentInput = z.infer<typeof payLoanInstallmentSchema>;
