import { z } from "zod";
import { currencyCodeSchema, moneyAmountSchema } from "@/lib/validations/money.schema";

const ASSET_TYPES = ["CASH", "ACCOUNT", "INVESTMENT", "PROPERTY", "VEHICLE", "OTHER"] as const;
const LIABILITY_TYPES = ["CREDIT_CARD", "LOAN", "MORTGAGE", "OTHER"] as const;

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre").max(120),
  assetType: z.enum(ASSET_TYPES),
  currentValue: moneyAmountSchema({ allowZero: true }),
  currency: currencyCodeSchema.default("PEN"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const createLiabilitySchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre").max(120),
  liabilityType: z.enum(LIABILITY_TYPES),
  currentBalance: moneyAmountSchema({ allowZero: true }),
  currency: currencyCodeSchema.default("PEN"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>;
