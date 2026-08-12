import type { TransactionListItem } from "@/features/transactions/types/transaction.types";

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  accountId?: string;
  categoryId?: string;
  transactionType?: TransactionListItem["transactionType"];
  status?: TransactionListItem["status"];
}

export interface ReportBreakdownItem {
  label: string;
  amount: string;
}

export interface ReportData {
  transactions: TransactionListItem[];
  totalIncome: string;
  totalExpenses: string;
  netCashFlow: string;
  byCategory: ReportBreakdownItem[];
  byAccount: ReportBreakdownItem[];
  truncated: boolean;
}
