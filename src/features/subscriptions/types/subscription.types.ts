export type SubscriptionFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  provider: string | null;
  categoryId: string | null;
  categoryName: string | null;
  amount: string;
  currency: string;
  frequency: SubscriptionFrequency;
  nextPaymentDate: string;
  accountId: string | null;
  active: boolean;
  startDate: string;
  cancellationDate: string | null;
  notes: string | null;
}

export const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};
