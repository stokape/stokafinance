import { z } from "zod";
import { currencyCodeSchema, moneyAmountSchema } from "@/lib/validations/money.schema";

const ACCOUNT_TYPES = ["CASH", "CHECKING", "SAVINGS", "DIGITAL_WALLET", "INVESTMENT", "OTHER"] as const;

/**
 * Flujo de alta simplificado a un solo paso (§46 del prompt original pedía un
 * wizard de 6 pasos; se colapsa a un formulario para llegar antes a un MVP
 * funcional — supuesto documentado, se puede separar en pasos más adelante
 * sin cambiar el contrato del server action).
 */
export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre").max(120),
  currency: currencyCodeSchema.default("PEN"),
  accountName: z.string().trim().min(1, "Dale un nombre a tu primera cuenta").max(80),
  accountType: z.enum(ACCOUNT_TYPES),
  initialBalance: moneyAmountSchema({ allowZero: true, allowNegative: true }),
  monthlyIncomeEstimate: moneyAmountSchema({ allowZero: true }).optional().or(z.literal("")),
  primaryGoal: z.string().trim().max(120).optional().or(z.literal("")),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
