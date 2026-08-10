import { z } from "zod";
import { currencyCodeSchema, moneyAmountSchema } from "@/lib/validations/money.schema";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre").max(120),
  currency: currencyCodeSchema,
  timezone: z.string().trim().min(1).max(80),
  monthlyIncomeEstimate: moneyAmountSchema({ allowZero: true }).optional().or(z.literal("")),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
