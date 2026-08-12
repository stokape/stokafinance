"use server";

import { getAuthenticatedSupabase } from "@/lib/supabase/require-user";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { CategoriesService } from "@/features/categories/services/categories.service";
import type { AccountOption, CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

/**
 * Opciones para el formulario rápido de movimientos. Pasa por los services
 * de Accounts/Categories igual que cualquier otra pantalla — el quick-add no
 * es una excepción a "nunca leer Supabase directo desde un componente" (§50).
 */
export async function getQuickAddOptionsAction(): Promise<{ accounts: AccountOption[]; categories: CategoryOption[] }> {
  const { supabase, user } = await getAuthenticatedSupabase();
  if (!user) return { accounts: [], categories: [] };

  const [accounts, categories] = await Promise.all([
    new AccountsService(supabase).listAccounts(),
    new CategoriesService(supabase).getCategoriesWithSubcategories(),
  ]);

  return {
    accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, categoryType: c.categoryType })),
  };
}
