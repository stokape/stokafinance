import type { UpcomingPaymentUrgency } from "@/lib/financial-engine";

export type BillStatus = "PENDING" | "SCHEDULED" | "PAID" | "OVERDUE" | "CANCELLED";
export type BillRecurrence = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

export interface Bill {
  id: string;
  userId: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  amount: string;
  currency: string;
  dueDate: string;
  expectedPaymentDate: string | null;
  accountId: string | null;
  status: BillStatus;
  recurrence: BillRecurrence | null;
  recurring: boolean;
  provider: string | null;
  notes: string | null;
  paidTransactionId: string | null;
}

export interface BillWithUrgency extends Bill {
  /** Calculada en vivo (calculateUpcomingPayments), nunca persistida — evita depender de un cron. */
  urgency: UpcomingPaymentUrgency;
}

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  PENDING: "Pendiente",
  SCHEDULED: "Programado",
  PAID: "Pagado",
  OVERDUE: "Atrasado",
  CANCELLED: "Cancelado",
};

export const BILL_URGENCY_LABELS: Record<UpcomingPaymentUrgency, string> = {
  OVERDUE: "Atrasado",
  DUE_TODAY: "Vence hoy",
  DUE_TOMORROW: "Vence mañana",
  DUE_THIS_WEEK: "Vence esta semana",
  UPCOMING: "Próximo",
};
