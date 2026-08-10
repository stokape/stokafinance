import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Category, Subcategory } from "../types/category.types";

/**
 * Único punto de acceso a Supabase para categorías. RLS ya filtra a
 * "propias + sistema" (user_id = auth.uid() OR user_id IS NULL) — este
 * repositorio no repite ese filtro, confía en la base de datos (§34: nunca
 * confiar sólo en el frontend, pero tampoco duplicar la regla en dos capas).
 */
export class CategoriesRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("id, name, category_type, icon, color, is_system, sort_order")
      .order("category_type", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      categoryType: row.category_type,
      icon: row.icon,
      color: row.color,
      isSystem: row.is_system,
      sortOrder: row.sort_order,
    }));
  }

  async listSubcategories(): Promise<Subcategory[]> {
    const { data, error } = await this.supabase
      .from("subcategories")
      .select("id, category_id, name, is_system, sort_order")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      isSystem: row.is_system,
      sortOrder: row.sort_order,
    }));
  }

  async createCategory(userId: string, input: { name: string; categoryType: "INCOME" | "EXPENSE" }): Promise<Category> {
    const { data, error } = await this.supabase
      .from("categories")
      .insert({ user_id: userId, name: input.name, category_type: input.categoryType, is_system: false })
      .select("id, name, category_type, icon, color, is_system, sort_order")
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      categoryType: data.category_type,
      icon: data.icon,
      color: data.color,
      isSystem: data.is_system,
      sortOrder: data.sort_order,
    };
  }
}
