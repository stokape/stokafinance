import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Goal, GoalContribution } from "../types/goal.types";

type GoalRow = Database["public"]["Tables"]["financial_goals"]["Row"];
type ContributionRow = Database["public"]["Tables"]["goal_contributions"]["Row"];

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    targetAmount: row.target_amount,
    targetDate: row.target_date,
    accountId: row.account_id,
    priority: row.priority,
    status: row.status,
    currency: row.currency,
    contributionAmount: row.contribution_amount,
    contributionFrequency: row.contribution_frequency,
    contributionAccountId: row.contribution_account_id,
    contributionCategoryId: row.contribution_category_id,
    nextContributionDate: row.next_contribution_date,
  };
}

function mapContribution(row: ContributionRow): GoalContribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    amount: row.amount,
    contributionDate: row.contribution_date,
    notes: row.notes,
  };
}

/** Único punto de acceso a Supabase para `financial_goals`/`goal_contributions`. RLS filtra por user_id = auth.uid(). */
export class GoalsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async progressById(goalIds: string[]): Promise<Map<string, string>> {
    if (goalIds.length === 0) return new Map();
    const { data, error } = await this.supabase.from("goal_progress").select("goal_id, current_amount").in("goal_id", goalIds);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.goal_id, row.current_amount]));
  }

  async list(options: { includeInactive?: boolean } = {}): Promise<{ goal: Goal; currentAmount: string }[]> {
    let query = this.supabase.from("financial_goals").select("*").order("created_at", { ascending: true });
    if (!options.includeInactive) query = query.eq("status", "ACTIVE");

    const { data, error } = await query;
    if (error) throw error;

    const goals = data ?? [];
    const progress = await this.progressById(goals.map((g) => g.id));
    return goals.map((row) => ({ goal: mapGoal(row), currentAmount: progress.get(row.id) ?? "0" }));
  }

  async findById(id: string): Promise<{ goal: Goal; currentAmount: string } | null> {
    const { data, error } = await this.supabase.from("financial_goals").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const progress = await this.progressById([data.id]);
    return { goal: mapGoal(data), currentAmount: progress.get(data.id) ?? "0" };
  }

  async create(userId: string, input: Omit<Database["public"]["Tables"]["financial_goals"]["Insert"], "user_id">): Promise<Goal> {
    const { data, error } = await this.supabase
      .from("financial_goals")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single();
    if (error) throw error;
    return mapGoal(data);
  }

  async updateStatus(id: string, status: Goal["status"]): Promise<void> {
    const { error } = await this.supabase.from("financial_goals").update({ status }).eq("id", id);
    if (error) throw error;
  }

  /** Metas activas con aporte automático configurado y vencido (para el catch-up). */
  async listDueForContribution(userId: string, todayIso: string): Promise<Goal[]> {
    const { data, error } = await this.supabase
      .from("financial_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .not("contribution_amount", "is", null)
      .lte("next_contribution_date", todayIso);
    if (error) throw error;
    return (data ?? []).map(mapGoal);
  }

  async updateNextContributionDate(id: string, nextContributionDate: string): Promise<void> {
    const { error } = await this.supabase.from("financial_goals").update({ next_contribution_date: nextContributionDate }).eq("id", id);
    if (error) throw error;
  }

  async addContribution(userId: string, goalId: string, amount: string, contributionDate: string, notes: string | null): Promise<void> {
    const { error } = await this.supabase
      .from("goal_contributions")
      .insert({ user_id: userId, goal_id: goalId, amount, contribution_date: contributionDate, notes });
    if (error) throw error;
  }

  async listContributions(goalId: string): Promise<GoalContribution[]> {
    const { data, error } = await this.supabase
      .from("goal_contributions")
      .select("*")
      .eq("goal_id", goalId)
      .order("contribution_date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapContribution);
  }
}
