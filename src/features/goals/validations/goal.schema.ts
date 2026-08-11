import { z } from "zod";
import { isoDateSchema, moneyAmountSchema } from "@/lib/validations/money.schema";

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre a tu meta").max(120),
  targetAmount: moneyAmountSchema(),
  targetDate: isoDateSchema.optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const addContributionSchema = z.object({
  goalId: z.string().uuid(),
  amount: moneyAmountSchema(),
  contributionDate: isoDateSchema,
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});
export type AddContributionInput = z.infer<typeof addContributionSchema>;
