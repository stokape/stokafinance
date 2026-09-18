"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/access/require-subscription";
import { LoansService } from "@/features/loans/services/loans.service";
import { createLoanSchema, payLoanInstallmentSchema } from "@/features/loans/validations/loan.schema";
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
  revalidatePath("/loans");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function createLoanAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createLoanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new LoansService(supabase).createLoan(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_loan_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos crear el préstamo. Intenta nuevamente.");
  }
}

export async function payLoanInstallmentAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = payLoanInstallmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new LoansService(supabase).payNextInstallment(user.id, parsed.data.loanId, parsed.data.accountId, parsed.data.paymentDate);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("pay_loan_installment_failed", { error: message });
    if (message === "LOAN_FULLY_PAID") return actionError("Este préstamo ya está completamente pagado.");
    return actionError("No pudimos registrar el pago. Intenta nuevamente.");
  }
}

export async function cancelLoanAction(loanId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    await new LoansService(supabase).cancelLoan(loanId);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("cancel_loan_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos cancelar el préstamo. Intenta nuevamente.");
  }
}
