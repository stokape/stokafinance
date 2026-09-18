"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/access/require-subscription";
import { CreditCardsService } from "@/features/credit-cards/services/credit-cards.service";
import {
  createCardPurchaseSchema,
  createCreditCardSchema,
  payCreditCardSchema,
} from "@/features/credit-cards/validations/credit-card.schema";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  requireActiveSubscription(user);
  return { supabase, user };
}

function revalidateAfterMutation() {
  revalidatePath("/cards");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function createCreditCardAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createCreditCardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new CreditCardsService(supabase).createCard(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_credit_card_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos crear la tarjeta. Intenta nuevamente.");
  }
}

export async function archiveCreditCardAction(cardId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    await new CreditCardsService(supabase).archiveCard(cardId);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("archive_credit_card_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos archivar la tarjeta. Intenta nuevamente.");
  }
}

export async function createCardPurchaseAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createCardPurchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new CreditCardsService(supabase).recordPurchase(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_card_purchase_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos registrar la compra. Intenta nuevamente.");
  }
}

export async function payCreditCardAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = payCreditCardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new CreditCardsService(supabase).payCard(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("pay_credit_card_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos registrar el pago. Intenta nuevamente.");
  }
}
