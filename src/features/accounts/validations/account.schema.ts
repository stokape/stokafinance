import { z } from "zod";
import { currencyCodeSchema, moneyAmountSchema } from "@/lib/validations/money.schema";

const ACCOUNT_TYPES = ["CASH", "CHECKING", "SAVINGS", "DIGITAL_WALLET", "INVESTMENT", "OTHER"] as const;

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  institution: z.string().trim().max(80).optional().or(z.literal("")),
  accountType: z.enum(ACCOUNT_TYPES),
  currency: currencyCodeSchema.default("PEN"),
  initialBalance: moneyAmountSchema({ allowZero: true, allowNegative: true }),
  icon: z.string().trim().max(4).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80).optional(),
  institution: z.string().trim().max(80).optional().or(z.literal("")),
  accountType: z.enum(ACCOUNT_TYPES).optional(),
  currency: currencyCodeSchema.optional(),
  icon: z.string().trim().max(4).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  active: z.union([z.literal("true"), z.literal("false"), z.boolean()]).transform((v) => v === true || v === "true").optional(),
});
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
