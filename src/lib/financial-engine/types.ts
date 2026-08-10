import type Decimal from "decimal.js";
import type { MoneyInput } from "@/lib/utils/money";

/**
 * Tipos de entrada/salida del Financial Engine. El motor es TypeScript puro:
 * no importa Supabase, no hace `fetch`, no depende de React. Los servicios de
 * aplicación (`features/*​/services`) son responsables de traer los datos
 * desde los repositorios y pasarlos aquí ya normalizados.
 */

export type LedgerTargetType = "ACCOUNT" | "CREDIT_CARD" | "LOAN";

export interface LedgerEntryInput {
  targetType: LedgerTargetType;
  targetId: string;
  amount: MoneyInput; // signed: ver docs/architecture.md §3.1
}

export interface AccountBalanceInput {
  id: string;
  initialBalance: MoneyInput;
  currency: string;
  active: boolean;
}

export type EngineTransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER"
  | "CARD_PURCHASE"
  | "CARD_PAYMENT"
  | "LOAN_DISBURSEMENT"
  | "LOAN_PAYMENT";

export type EngineTransactionStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

/** Vista mínima de una transacción que el Financial Engine necesita para calcular. */
export interface TransactionForEngine {
  id: string;
  type: EngineTransactionType;
  amount: MoneyInput;
  /** Sólo presente en LOAN_PAYMENT cuando se conoce el desglose. */
  interestAmount?: MoneyInput | null;
  categoryId: string | null;
  /** Fecha ISO (YYYY-MM-DD). */
  date: string;
  status: EngineTransactionStatus;
  deletedAt: string | null;
}

export interface BudgetUsageResult {
  allocated: Decimal;
  spent: Decimal;
  available: Decimal;
  percentageUsed: Decimal;
  status: "NORMAL" | "ATTENTION" | "RISK" | "EXCEEDED";
}

export type UpcomingPaymentUrgency = "OVERDUE" | "DUE_TODAY" | "DUE_TOMORROW" | "DUE_THIS_WEEK" | "UPCOMING";

export interface UpcomingPaymentItem {
  id: string;
  label: string;
  amount: Decimal;
  dueDate: string;
  urgency: UpcomingPaymentUrgency;
  kind: "BILL" | "RECURRING" | "LOAN_INSTALLMENT" | "CREDIT_CARD_STATEMENT" | "SUBSCRIPTION";
}

export type SubscriptionFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

export interface SubscriptionInput {
  id: string;
  amount: MoneyInput;
  frequency: SubscriptionFrequency;
  active: boolean;
}

export interface ForecastEvent {
  id: string;
  label: string;
  date: string;
  /** Signado: positivo = entra dinero, negativo = sale dinero. */
  amount: MoneyInput;
  kind: UpcomingPaymentItem["kind"] | "RECURRING_INCOME";
}

export interface ForecastDayPoint {
  date: string;
  projectedBalance: Decimal;
  events: ForecastEvent[];
}

export interface ForecastResult {
  startingBalance: Decimal;
  endingBalance: Decimal;
  days: ForecastDayPoint[];
  lowestBalance: Decimal;
  lowestBalanceDate: string | null;
  negativeDates: string[];
}

export interface SafeToSpendInput {
  liquidBalance: MoneyInput;
  confirmedUpcomingIncome: MoneyInput;
  upcomingObligatoryPayments: MoneyInput;
  upcomingDebtPayments: MoneyInput;
  reservedBudget: MoneyInput;
  minimumSavingsGoal: MoneyInput;
}

export interface FinancialHealthInputs {
  emergencyFundMonths: number;
  savingsRatePercentage: number;
  debtToIncomePercentage: number;
  creditUtilizationPercentage: number;
  budgetCompliancePercentage: number;
  netWorthGrowthPercentage: number;
}

export interface FinancialHealthFactor {
  key: keyof FinancialHealthInputs;
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
  contribution: number; // score * weight
}

export interface FinancialHealthScoreResult {
  score: number; // 0-100
  rating: "RISK" | "ATTENTION" | "HEALTHY" | "VERY_HEALTHY";
  factors: FinancialHealthFactor[];
}
