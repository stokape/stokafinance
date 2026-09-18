"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/access/require-subscription";
import { BillsService } from "@/features/bills/services/bills.service";
import { createBillSchema, markBillPaidSchema } from "@/features/bills/validations/bill.schema";
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
  revalidatePath("/bills");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function createBillAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createBillSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new BillsService(supabase).createBill(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_bill_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos registrar el pago. Intenta nuevamente.");
  }
}

export async function markBillPaidAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = markBillPaidSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new BillsService(supabase).markAsPaid(user.id, parsed.data.billId, parsed.data.accountId, parsed.data.paymentDate);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("mark_bill_paid_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos marcar el pago como pagado. Intenta nuevamente.");
  }
}

export async function cancelBillAction(billId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    await new BillsService(supabase).cancelBill(billId);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("cancel_bill_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos cancelar el pago. Intenta nuevamente.");
  }
}
