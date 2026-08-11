import { z } from "zod";
import { isoDateSchema, moneyAmountSchema } from "@/lib/validations/money.schema";
import { requiredUuidSchema } from "@/lib/validations/select.schema";

const RECURRENCE_VALUES = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"] as const;

export const createBillSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre al pago").max(120),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  amount: moneyAmountSchema(),
  dueDate: isoDateSchema,
  provider: z.string().trim().max(120).optional().or(z.literal("")),
  recurring: z.union([z.literal("true"), z.literal("false"), z.boolean()]).transform((v) => v === true || v === "true"),
  recurrence: z.enum(RECURRENCE_VALUES).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateBillInput = z.infer<typeof createBillSchema>;

export const markBillPaidSchema = z.object({
  billId: z.string().uuid(),
  accountId: requiredUuidSchema("Selecciona una cuenta"),
  paymentDate: isoDateSchema,
});
export type MarkBillPaidInput = z.infer<typeof markBillPaidSchema>;
