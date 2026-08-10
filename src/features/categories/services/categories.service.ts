import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { CategoriesRepository } from "../repositories/categories.repository";
import type { Category, Subcategory } from "../types/category.types";

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

export class CategoriesService {
  private readonly repository: CategoriesRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new CategoriesRepository(supabase);
  }

  /** Categorías (sistema + propias) agrupadas con sus subcategorías, listas para selects de formulario. */
  async getCategoriesWithSubcategories(): Promise<CategoryWithSubcategories[]> {
    const [categories, subcategories] = await Promise.all([
      this.repository.listCategories(),
      this.repository.listSubcategories(),
    ]);

    return categories.map((category) => ({
      ...category,
      subcategories: subcategories.filter((sub) => sub.categoryId === category.id),
    }));
  }
}
