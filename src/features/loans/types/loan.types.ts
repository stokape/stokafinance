export type LoanPaymentType = "PRINCIPAL_AND_INTEREST" | "INTEREST_ONLY";

export interface Loan {
  id: string;
  userId: string;
  lender: string;
  description: string | null;
  originalAmount: string;
  interestRate: string | null;
  installmentAmount: string;
  numberOfInstallments: number;
  startDate: string;
  nextDueDate: string | null;
  estimatedEndDate: string | null;
  currency: string;
  status: "ACTIVE" | "PAID_OFF" | "DEFAULTED" | "CANCELLED";
  paymentType: LoanPaymentType;
  createdAt: string;
}

export const LOAN_PAYMENT_TYPE_LABELS: Record<LoanPaymentType, string> = {
  PRINCIPAL_AND_INTEREST: "Cuota fija (capital + interés)",
  INTEREST_ONLY: "Solo interés (capital al final)",
};

export interface LoanWithProgress extends Loan {
  currentBalance: string;
  installmentsPaid: number;
  installmentsRemaining: number;
  percentageAmortized: number;
}

export interface LoanInstallment {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  totalAmount: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paidTransactionId: string | null;
}

export const LOAN_STATUS_LABELS: Record<Loan["status"], string> = {
  ACTIVE: "Activo",
  PAID_OFF: "Pagado",
  DEFAULTED: "En mora",
  CANCELLED: "Cancelado",
};
