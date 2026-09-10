import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, addWeeks, addYears, formatISO } from "date-fns";
import type { Database } from "@/types/database.types";
import { GoalsRepository } from "../repositories/goals.repository";
import { TransactionIntakeService } from "@/features/transactions/services/transaction-intake.service";
import { calculateGoalProgress, calculateRequiredMonthlyContribution, contributionToMonthlyPace, estimateGoalCompletionDate } from "@/lib/financial-engine";
import type { AddContributionInput, CreateGoalInput } from "../validations/goal.schema";
import type { Goal, GoalContribution, GoalContributionFrequency, GoalWithProgress } from "../types/goal.types";

/** Límite de aportes atrasados que se generan de una sola vez (mismo criterio que recurring-transactions). */
const MAX_CATCH_UP_OCCURRENCES = 24;

function nextOccurrence(dateIso: string, frequency: GoalContributionFrequency): string {
  const date = new Date(`${dateIso}T00:00:00`);
  const next =
    frequency === "WEEKLY"
      ? addWeeks(date, 1)
      : frequency === "BIWEEKLY"
        ? addWeeks(date, 2)
        : frequency === "MONTHLY"
          ? addMonths(date, 1)
          : frequency === "QUARTERLY"
            ? addMonths(date, 3)
            : frequency === "SEMIANNUAL"
              ? addMonths(date, 6)
              : addYears(date, 1);
  return formatISO(next, { representation: "date" });
}

function withProgress({ goal, currentAmount }: { goal: Goal; currentAmount: string }): GoalWithProgress {
  const progress = calculateGoalProgress(goal.targetAmount, currentAmount);
  const today = formatISO(new Date(), { representation: "date" });
  const requiredMonthlyContribution = calculateRequiredMonthlyContribution(progress.amountRemaining, goal.targetDate, today);

  // "A tu ritmo actual, llegas el...": sólo se puede proyectar con un ritmo
  // conocido y confiable — el aporte automático configurado (contribution_
  // amount/frequency). Sin eso, no se inventa un ritmo desde el historial
  // manual (muy irregular como para proyectar con confianza) — mejor no
  // mostrar nada que mostrar una fecha poco confiable.
  const estimatedCompletionDate =
    goal.contributionAmount && goal.contributionFrequency
      ? estimateGoalCompletionDate(progress.amountRemaining, contributionToMonthlyPace(goal.contributionAmount, goal.contributionFrequency), today)
      : null;

  return {
    ...goal,
    currentAmount,
    percentageComplete: progress.percentageComplete.toNumber(),
    amountRemaining: progress.amountRemaining.toString(),
    requiredMonthlyContribution: requiredMonthlyContribution.toString(),
    estimatedCompletionDate,
  };
}

export class GoalsService {
  private readonly repository: GoalsRepository;
  private readonly intake: TransactionIntakeService;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new GoalsRepository(supabase);
    this.intake = new TransactionIntakeService(supabase);
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
    const hasAutoContribute = !!input.autoContribute && !!input.contributionAmount && !!input.contributionFrequency && !!input.contributionAccountId;

    const goal = await this.repository.create(userId, {
      name: input.name,
      target_amount: input.targetAmount,
      target_date: input.targetDate || null,
      priority: input.priority,
      status: "ACTIVE",
      contribution_amount: hasAutoContribute ? input.contributionAmount : null,
      contribution_frequency: hasAutoContribute ? input.contributionFrequency! : null,
      contribution_account_id: hasAutoContribute ? input.contributionAccountId! : null,
      contribution_category_id: hasAutoContribute ? input.contributionCategoryId || null : null,
      next_contribution_date: hasAutoContribute ? input.contributionStartDate || formatISO(new Date(), { representation: "date" }) : null,
    });
    return goal.id;
  }

  /**
   * Genera los aportes automáticos vencidos (§ "juntas"): por cada meta con
   * contribution_amount configurado y next_contribution_date <= hoy, saca
   * el monto de la cuenta elegida (gasto real, mismo mecanismo que
   * cualquier otro movimiento) Y registra el aporte en goal_contributions
   * para que la barra de progreso de la meta avance sola. Sin cron: se
   * ejecuta al abrir /goals, mismo patrón que recurring-transactions.
   */
  async catchUpContributions(userId: string): Promise<void> {
    const today = formatISO(new Date(), { representation: "date" });
    const due = await this.repository.listDueForContribution(userId, today);

    for (const goal of due) {
      if (!goal.contributionAmount || !goal.contributionFrequency || !goal.contributionAccountId || !goal.nextContributionDate) continue;

      let occurrenceDate = goal.nextContributionDate;
      let iterations = 0;

      while (occurrenceDate <= today && iterations < MAX_CATCH_UP_OCCURRENCES) {
        const result = await this.intake.intake({
          userId,
          source: "RECURRING",
          transactionType: "EXPENSE",
          amount: goal.contributionAmount,
          currency: goal.currency,
          accountId: goal.contributionAccountId,
          categoryId: goal.contributionCategoryId || undefined,
          description: `Aporte a meta "${goal.name}"`,
          transactionDate: occurrenceDate,
        });

        await this.repository.addContribution(userId, goal.id, goal.contributionAmount, occurrenceDate, `Aporte automático (${result.transactionId})`);

        occurrenceDate = nextOccurrence(occurrenceDate, goal.contributionFrequency);
        iterations += 1;
      }

      await this.repository.updateNextContributionDate(goal.id, occurrenceDate);

      const updated = await this.repository.findById(goal.id);
      if (updated) {
        const progress = calculateGoalProgress(updated.goal.targetAmount, updated.currentAmount);
        if (progress.isComplete && updated.goal.status === "ACTIVE") {
          await this.repository.updateStatus(goal.id, "COMPLETED");
        }
      }
    }
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
