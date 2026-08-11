import { z } from "zod";
import { isoDateSchema, moneyAmountSchema } from "@/lib/validations/money.schema";
import { requiredUuidSchema } from "@/lib/validations/select.schema";

const FREQUENCY_VALUES = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"] as const;

export const createRecurringTransactionSchema = z
  .object({
    transactionType: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    accountId: requiredUuidSchema("Selecciona una cuenta"),
    destinationAccountId: z.string().uuid().optional().or(z.literal("")),
    categoryId: z.string().uuid().optional().or(z.literal("")),
    description: z.string().trim().min(1, "Describe el movimiento").max(200),
    amount: moneyAmountSchema(),
    frequency: z.enum(FREQUENCY_VALUES),
    startDate: isoDateSchema,
    endDate: isoDateSchema.optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => data.transactionType !== "TRANSFER" || (!!data.destinationAccountId && data.destinationAccountId !== data.accountId), {
    message: "Selecciona una cuenta de destino distinta",
    path: ["destinationAccountId"],
  })
  .refine((data) => data.transactionType === "TRANSFER" || !!data.categoryId, {
    message: "Selecciona una categoría",
    path: ["categoryId"],
  });
export type CreateRecurringTransactionInput = z.infer<typeof createRecurringTransactionSchema>;
