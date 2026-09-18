"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/access/require-subscription";
import { CsvImportService } from "@/features/csv-import/services/csv-import.service";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { CategoriesService } from "@/features/categories/services/categories.service";
import type { ImportSummary, NormalizedCsvRow } from "@/features/csv-import/types/csv-import.types";
import type { AccountOption, CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";
import { MAX_CSV_IMPORT_ROWS } from "@/features/csv-import/constants";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  requireActiveSubscription(user);
  return { supabase, user };
}

export async function getImportFormOptionsAction(): Promise<{ accounts: AccountOption[]; categories: CategoryOption[] }> {
  const { supabase } = await requireUser();
  const [accounts, categories] = await Promise.all([
    new AccountsService(supabase).listAccounts(),
    new CategoriesService(supabase).getCategoriesWithSubcategories(),
  ]);
  return {
    accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, categoryType: c.categoryType })),
  };
}

export async function checkImportDuplicatesAction(accountId: string, rows: NormalizedCsvRow[]): Promise<ActionResult<boolean[]>> {
  if (rows.length > MAX_CSV_IMPORT_ROWS) {
    return actionError(`El archivo tiene demasiadas filas (máximo ${MAX_CSV_IMPORT_ROWS} por importación).`);
  }

  try {
    const { supabase } = await requireUser();
    const duplicates = await new CsvImportService(supabase).checkDuplicates(accountId, rows);
    return actionSuccess(duplicates);
  } catch (error) {
    logger.error("check_import_duplicates_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos revisar duplicados. Intenta nuevamente.");
  }
}

export async function confirmCsvImportAction(input: {
  accountId: string;
  defaultExpenseCategoryId: string | null;
  defaultIncomeCategoryId: string | null;
  fileName: string;
  columnMapping: Record<string, unknown>;
  rows: NormalizedCsvRow[];
}): Promise<ActionResult<ImportSummary>> {
  if (input.rows.length === 0) return actionError("No hay filas para importar.");
  if (input.rows.length > MAX_CSV_IMPORT_ROWS) {
    return actionError(`El archivo tiene demasiadas filas (máximo ${MAX_CSV_IMPORT_ROWS} por importación).`);
  }

  try {
    const { supabase, user } = await requireUser();
    const summary = await new CsvImportService(supabase).confirmImport(user.id, input);
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return actionSuccess(summary);
  } catch (error) {
    logger.error("confirm_csv_import_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos completar la importación. Intenta nuevamente.");
  }
}
