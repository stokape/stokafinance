"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TransactionsService } from "@/features/transactions/services/transactions.service";
import { RecurringTransactionsService } from "@/features/recurring-transactions/services/recurring-transactions.service";
import {
  createExpenseSchema,
  createIncomeSchema,
  createTransferSchema,
} from "@/features/transactions/validations/transaction.schema";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return { supabase, user };
}

function revalidateAfterMutation() {
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function createExpenseAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createExpenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();

    if (parsed.data.isRecurring && parsed.data.frequency) {
      // Mismo mecanismo que ya usan suscripciones/facturas recurrentes:
      // crea el pago recurrente (recurring_transactions) en vez de una
      // transacción única — se registrará solo, cada ciclo, sin que el
      // usuario tenga que volver a anotarlo (ver
      // RecurringTransactionsService.listAndCatchUp).
      const recurringService = new RecurringTransactionsService(supabase);
      await recurringService.createRecurring(user.id, {
        transactionType: "EXPENSE",
        accountId: parsed.data.accountId,
        destinationAccountId: "",
        categoryId: parsed.data.categoryId,
        description: parsed.data.description,
        amount: parsed.data.amount,
        frequency: parsed.data.frequency,
        startDate: parsed.data.transactionDate,
        endDate: parsed.data.endDate || "",
        notes: parsed.data.notes || "",
      });
      // Si la fecha de pago elegida es hoy o ya pasó, el gasto ya es un
      // déficit real y debe reflejarse en el saldo de inmediato — no basta
      // con dejarlo en recurring_transactions a la espera de que alguien
      // visite /transactions (única pantalla que hoy dispara el catch-up).
      await recurringService.listAndCatchUp(user.id);
    } else {
      await new TransactionsService(supabase).createExpense(user.id, parsed.data);
    }

    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_expense_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos registrar el gasto. Intenta nuevamente.");
  }
}

export async function createIncomeAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createIncomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new TransactionsService(supabase).createIncome(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_income_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos registrar el ingreso. Intenta nuevamente.");
  }
}

export async function createTransferAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createTransferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  }
  try {
    const { supabase, user } = await requireUser();
    await new TransactionsService(supabase).createTransfer(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_transfer_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos registrar la transferencia. Intenta nuevamente.");
  }
}

export async function cancelTransactionAction(transactionId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    await new TransactionsService(supabase).cancelTransaction(transactionId);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("cancel_transaction_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos cancelar el movimiento. Intenta nuevamente.");
  }
}
