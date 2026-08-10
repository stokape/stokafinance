import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { CreditCard, CreditCardTransaction, CreditCardWithBalance } from "../types/credit-card.types";

type CreditCardRow = Database["public"]["Tables"]["credit_cards"]["Row"];

function mapCard(row: CreditCardRow): CreditCard {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    bank: row.bank,
    brand: row.brand,
    lastFourDigits: row.last_four_digits,
    currency: row.currency,
    creditLimit: row.credit_limit,
    closingDay: row.closing_day,
    paymentDay: row.payment_day,
    annualInterestRate: row.annual_interest_rate,
    utilizationAlertThreshold: row.utilization_alert_threshold,
    active: row.active,
    createdAt: row.created_at,
  };
}

/** Único punto de acceso a Supabase para `credit_cards`/`credit_card_transactions`. RLS filtra por user_id = auth.uid(). */
export class CreditCardsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async balancesById(cardIds: string[]): Promise<Map<string, { debt: string; available: string }>> {
    if (cardIds.length === 0) return new Map();
    const { data, error } = await this.supabase
      .from("credit_card_balances")
      .select("credit_card_id, current_debt, available_credit")
      .in("credit_card_id", cardIds);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.credit_card_id, { debt: row.current_debt, available: row.available_credit }]));
  }

  async list(options: { includeInactive?: boolean } = {}): Promise<CreditCardWithBalance[]> {
    let query = this.supabase.from("credit_cards").select("*").order("created_at", { ascending: true });
    if (!options.includeInactive) query = query.eq("active", true);

    const { data, error } = await query;
    if (error) throw error;

    const cards = data ?? [];
    const balances = await this.balancesById(cards.map((c) => c.id));

    return cards.map((row) => {
      const balance = balances.get(row.id) ?? { debt: "0", available: row.credit_limit };
      const utilizationPercentage = Number(row.credit_limit) > 0 ? (Number(balance.debt) / Number(row.credit_limit)) * 100 : 0;
      return { ...mapCard(row), currentDebt: balance.debt, availableCredit: balance.available, utilizationPercentage };
    });
  }

  async findById(id: string): Promise<CreditCardWithBalance | null> {
    const { data, error } = await this.supabase.from("credit_cards").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const balances = await this.balancesById([data.id]);
    const balance = balances.get(data.id) ?? { debt: "0", available: data.credit_limit };
    const utilizationPercentage = Number(data.credit_limit) > 0 ? (Number(balance.debt) / Number(data.credit_limit)) * 100 : 0;
    return { ...mapCard(data), currentDebt: balance.debt, availableCredit: balance.available, utilizationPercentage };
  }

  async create(userId: string, input: Omit<Database["public"]["Tables"]["credit_cards"]["Insert"], "user_id">): Promise<CreditCard> {
    const { data, error } = await this.supabase
      .from("credit_cards")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single();
    if (error) throw error;
    return mapCard(data);
  }

  async archive(id: string): Promise<void> {
    const { error } = await this.supabase.from("credit_cards").update({ active: false }).eq("id", id);
    if (error) throw error;
  }

  async createPurchase(
    row: Database["public"]["Tables"]["credit_card_transactions"]["Insert"],
  ): Promise<Database["public"]["Tables"]["credit_card_transactions"]["Row"]> {
    const { data, error } = await this.supabase.from("credit_card_transactions").insert(row).select("*").single();
    if (error) throw error;
    return data;
  }

  async createInstallmentPlans(rows: Database["public"]["Tables"]["credit_card_installment_plans"]["Insert"][]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.supabase.from("credit_card_installment_plans").insert(rows);
    if (error) throw error;
  }

  async listPurchases(creditCardId: string, limit = 20): Promise<CreditCardTransaction[]> {
    const { data, error } = await this.supabase
      .from("credit_card_transactions")
      .select("*")
      .eq("credit_card_id", creditCardId)
      .is("deleted_at", null)
      .order("purchase_date", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const rows = data ?? [];
    const categoryIds = Array.from(new Set(rows.map((r) => r.category_id).filter((id): id is string => id !== null)));
    const categoryNames = await this.categoryNamesById(categoryIds);

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      creditCardId: row.credit_card_id,
      categoryId: row.category_id,
      subcategoryId: row.subcategory_id,
      description: row.description,
      merchant: row.merchant,
      amount: row.amount,
      purchaseDate: row.purchase_date,
      installments: row.installments,
      status: row.status,
      notes: row.notes,
      categoryName: row.category_id ? (categoryNames.get(row.category_id) ?? null) : null,
      createdAt: row.created_at,
    }));
  }

  private async categoryNamesById(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const { data, error } = await this.supabase.from("categories").select("id, name").in("id", ids);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.id, row.name]));
  }
}
