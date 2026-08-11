"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CategoriesService } from "@/features/categories/services/categories.service";
import type { CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

export async function getSubscriptionCategoriesAction(): Promise<CategoryOption[]> {
  const supabase = await createSupabaseServerClient();
  const categories = await new CategoriesService(supabase).getCategoriesWithSubcategories();
  return categories.filter((c) => c.categoryType === "EXPENSE").map((c) => ({ id: c.id, name: c.name, categoryType: c.categoryType }));
}
