export type GoalPriority = "LOW" | "MEDIUM" | "HIGH";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

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
