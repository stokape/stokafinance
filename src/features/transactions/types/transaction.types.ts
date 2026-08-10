import type { TransactionSource, TransactionStatus, TransactionType } from "@/types/database.types";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string | null;
  destinationAccountId: string | null;
  creditCardId: string | null;
  loanId: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  transactionType: TransactionType;
  description: string;
  amount: string;
  principalAmount: string | null;
  interestAmount: string | null;
  currency: string;
  transactionDate: string;
  status: TransactionStatus;
  paymentMethod: string | null;
  merchant: string | null;
  notes: string | null;
  source: TransactionSource;
  externalReference: string | null;
  createdAt: string;
}

export interface TransactionListItem extends Transaction {
  accountName: string | null;
  destinationAccountName: string | null;
  categoryName: string | null;
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  TRANSFER: "Transferencia",
  CARD_PURCHASE: "Compra con tarjeta",
  CARD_PAYMENT: "Pago de tarjeta",
  LOAN_DISBURSEMENT: "Desembolso de préstamo",
  LOAN_PAYMENT: "Pago de préstamo",
};

export interface TransactionFilters {
  search?: string;
  accountId?: string;
  categoryId?: string;
  transactionType?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type { TransactionType, TransactionStatus, TransactionSource };
