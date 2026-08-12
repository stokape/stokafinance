"use server";

import { getAuthenticatedSupabase } from "@/lib/supabase/require-user";
import { CategoriesService } from "@/features/categories/services/categories.service";
import type { CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

export async function getSubscriptionCategoriesAction(): Promise<CategoryOption[]> {
  const { supabase, user } = await getAuthenticatedSupabase();
  if (!user) return [];

  const categories = await new CategoriesService(supabase).getCategoriesWithSubcategories();
  return categories.filter((c) => c.categoryType === "EXPENSE").map((c) => ({ id: c.id, name: c.name, categoryType: c.categoryType }));
}
