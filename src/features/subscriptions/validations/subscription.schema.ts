import { z } from "zod";
import { isoDateSchema, moneyAmountSchema } from "@/lib/validations/money.schema";

const FREQUENCY_VALUES = ["WEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"] as const;

export const createSubscriptionSchema = z
  .object({
    name: z.string().trim().min(1, "Ponle un nombre a la suscripción").max(120),
    provider: z.string().trim().max(120).optional().or(z.literal("")),
    categoryId: z.string().uuid().optional().or(z.literal("")),
    amount: moneyAmountSchema(),
    frequency: z.enum(FREQUENCY_VALUES),
    nextPaymentDate: isoDateSchema,
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    // Checkbox: "on" cuando está marcado, ausente (undefined) si no.
    autoTrackAsExpense: z.string().optional(),
    accountId: z.string().uuid().optional().or(z.literal("")),
  })
  .refine((data) => !data.autoTrackAsExpense || !!data.accountId, {
    message: "Selecciona una cuenta para registrar el gasto automático",
    path: ["accountId"],
  })
  .refine((data) => !data.autoTrackAsExpense || !!data.categoryId, {
    message: "Selecciona una categoría para registrar el gasto automático",
    path: ["categoryId"],
  });
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
