import { z } from "zod";
import { isoDateSchema, moneyAmountSchema } from "@/lib/validations/money.schema";

const CONTRIBUTION_FREQUENCY_VALUES = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"] as const;

export const createGoalSchema = z
  .object({
    name: z.string().trim().min(1, "Ponle un nombre a tu meta").max(120),
    targetAmount: moneyAmountSchema(),
    targetDate: isoDateSchema.optional().or(z.literal("")),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    // Aporte automático (ej. junta quincenal/mensual con monto fijo):
    // checkbox "on"/undefined + frecuencia/monto/cuenta requeridos si está marcado.
    autoContribute: z.string().optional(),
    contributionAmount: moneyAmountSchema().optional().or(z.literal("")),
    contributionFrequency: z.enum(CONTRIBUTION_FREQUENCY_VALUES).optional(),
    contributionAccountId: z.string().uuid().optional().or(z.literal("")),
    contributionCategoryId: z.string().uuid().optional().or(z.literal("")),
    contributionStartDate: isoDateSchema.optional().or(z.literal("")),
  })
  .refine((data) => !data.autoContribute || !!data.contributionAmount, {
    message: "Indica el monto del aporte",
    path: ["contributionAmount"],
  })
  .refine((data) => !data.autoContribute || !!data.contributionFrequency, {
    message: "Selecciona la frecuencia",
    path: ["contributionFrequency"],
  })
  .refine((data) => !data.autoContribute || !!data.contributionAccountId, {
    message: "Selecciona la cuenta de origen",
    path: ["contributionAccountId"],
  });
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const addContributionSchema = z.object({
  goalId: z.string().uuid(),
  amount: moneyAmountSchema(),
  contributionDate: isoDateSchema,
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});
export type AddContributionInput = z.infer<typeof addContributionSchema>;
