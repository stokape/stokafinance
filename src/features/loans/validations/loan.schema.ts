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
});
export type CreateLoanInput = z.infer<typeof createLoanSchema>;

export const payLoanInstallmentSchema = z.object({
  loanId: requiredUuidSchema("Selecciona un préstamo"),
  accountId: requiredUuidSchema("Selecciona la cuenta de origen"),
  paymentDate: isoDateSchema,
});
export type PayLoanInstallmentInput = z.infer<typeof payLoanInstallmentSchema>;
