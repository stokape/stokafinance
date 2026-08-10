import type { AccountType } from "@/types/database.types";

export interface Account {
  id: string;
  userId: string;
  name: string;
  institution: string | null;
  accountType: AccountType;
  currency: string;
  initialBalance: string;
  icon: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
}

export interface AccountWithBalance extends Account {
  currentBalance: string;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Efectivo",
  CHECKING: "Cuenta corriente",
  SAVINGS: "Cuenta de ahorros",
  DIGITAL_WALLET: "Billetera digital",
  INVESTMENT: "Inversiones",
  OTHER: "Otra",
};

export type { AccountType };
