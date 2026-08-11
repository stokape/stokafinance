import type { SupabaseClient } from "@supabase/supabase-js";
import { formatISO } from "date-fns";
import type { Database } from "@/types/database.types";
import { GoalsRepository } from "../repositories/goals.repository";
import { calculateGoalProgress, calculateRequiredMonthlyContribution } from "@/lib/financial-engine";
import type { AddContributionInput, CreateGoalInput } from "../validations/goal.schema";
import type { Goal, GoalContribution, GoalWithProgress } from "../types/goal.types";

function withProgress({ goal, currentAmount }: { goal: Goal; currentAmount: string }): GoalWithProgress {
  const progress = calculateGoalProgress(goal.targetAmount, currentAmount);
  const today = formatISO(new Date(), { representation: "date" });
  const requiredMonthlyContribution = calculateRequiredMonthlyContribution(progress.amountRemaining, goal.targetDate, today);

  return {
    ...goal,
    currentAmount,
    percentageComplete: progress.percentageComplete.toNumber(),
    amountRemaining: progress.amountRemaining.toString(),
    requiredMonthlyContribution: requiredMonthlyContribution.toString(),
  };
}

export class GoalsService {
  private readonly repository: GoalsRepository;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new GoalsRepository(supabase);
  }

  async listGoals(options?: { includeInactive?: boolean }): Promise<GoalWithProgress[]> {
    const rows = await this.repository.list(options);
    return rows.map(withProgress);
  }

  async getGoal(id: string): Promise<GoalWithProgress | null> {
    const row = await this.repository.findById(id);
    return row ? withProgress(row) : null;
  }

  listContributions(goalId: string): Promise<GoalContribution[]> {
    return this.repository.listContributions(goalId);
  }

  async createGoal(userId: string, input: CreateGoalInput): Promise<string> {
    const goal = await this.repository.create(userId, {
      name: input.name,
      target_amount: input.targetAmount,
      target_date: input.targetDate || null,
      priority: input.priority,
      status: "ACTIVE",
    });
    return goal.id;
  }

  /** Registra un aporte y marca la meta como cumplida si ya alcanzó el objetivo (§18). */
  async addContribution(userId: string, input: AddContributionInput): Promise<void> {
    const current = await this.repository.findById(input.goalId);
    if (!current) throw new Error("GOAL_NOT_FOUND");

    await this.repository.addContribution(userId, input.goalId, input.amount, input.contributionDate, input.notes || null);

    const updated = await this.repository.findById(input.goalId);
    if (updated) {
      const progress = calculateGoalProgress(updated.goal.targetAmount, updated.currentAmount);
      if (progress.isComplete && updated.goal.status === "ACTIVE") {
        await this.repository.updateStatus(input.goalId, "COMPLETED");
      }
    }
  }

  cancelGoal(id: string): Promise<void> {
    return this.repository.updateStatus(id, "CANCELLED");
  }
}
