export type RecurringFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";
export type RecurringTransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface RecurringTransaction {
  id: string;
  userId: string;
  accountId: string | null;
  accountName: string | null;
  destinationAccountId: string | null;
  destinationAccountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  transactionType: RecurringTransactionType;
  description: string;
  amount: string;
  currency: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  nextOccurrenceDate: string;
  active: boolean;
  notes: string | null;
}

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};

export const RECURRING_TYPE_LABELS: Record<RecurringTransactionType, string> = {
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  TRANSFER: "Transferencia",
};
