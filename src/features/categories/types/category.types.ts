import type { CategoryType } from "@/types/database.types";

export interface Category {
  id: string;
  name: string;
  categoryType: CategoryType;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  sortOrder: number;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  isSystem: boolean;
  sortOrder: number;
}

export type { CategoryType };
