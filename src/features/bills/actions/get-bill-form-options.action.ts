"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { CategoriesService } from "@/features/categories/services/categories.service";
import type { AccountOption, CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

export async function getBillFormOptionsAction(): Promise<{ accounts: AccountOption[]; categories: CategoryOption[] }> {
  const supabase = await createSupabaseServerClient();
  const [accounts, categories] = await Promise.all([
    new AccountsService(supabase).listAccounts(),
    new CategoriesService(supabase).getCategoriesWithSubcategories(),
  ]);

  return {
    accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
    categories: categories.filter((c) => c.categoryType === "EXPENSE").map((c) => ({ id: c.id, name: c.name, categoryType: c.categoryType })),
  };
}
