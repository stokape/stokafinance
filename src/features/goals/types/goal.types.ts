export type GoalPriority = "LOW" | "MEDIUM" | "HIGH";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type GoalContributionFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: string;
  targetDate: string | null;
  accountId: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  currency: string;
  /** Si no es null, la meta tiene aporte automático — ver GoalsService.catchUpContributions. Útil para "juntas" (quincenales/mensuales, monto fijo). */
  contributionAmount: string | null;
  contributionFrequency: GoalContributionFrequency | null;
  contributionAccountId: string | null;
  contributionCategoryId: string | null;
  nextContributionDate: string | null;
}

export interface GoalWithProgress extends Goal {
  currentAmount: string;
  percentageComplete: number;
  amountRemaining: string;
  requiredMonthlyContribution: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: string;
  contributionDate: string;
  notes: string | null;
}

export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

export const GOAL_CONTRIBUTION_FREQUENCY_LABELS: Record<GoalContributionFrequency, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};
