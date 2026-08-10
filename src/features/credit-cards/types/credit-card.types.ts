export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  bank: string;
  brand: string | null;
  lastFourDigits: string | null;
  currency: string;
  creditLimit: string;
  closingDay: number;
  paymentDay: number;
  annualInterestRate: string | null;
  utilizationAlertThreshold: string;
  active: boolean;
  createdAt: string;
}

export interface CreditCardWithBalance extends CreditCard {
  currentDebt: string;
  availableCredit: string;
  utilizationPercentage: number;
}

export interface CreditCardTransaction {
  id: string;
  userId: string;
  creditCardId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  description: string;
  merchant: string | null;
  amount: string;
  purchaseDate: string;
  installments: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  notes: string | null;
  categoryName: string | null;
  createdAt: string;
}

/** Próxima fecha de pago (§13): el día `paymentDay` del mes actual si aún no pasó, si no, del mes siguiente. */
export function nextPaymentDate(paymentDay: number, referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  const candidateMonth = day <= paymentDay ? month : month + 1;
  const daysInCandidateMonth = new Date(year, candidateMonth + 1, 0).getDate();
  const candidate = new Date(year, candidateMonth, Math.min(paymentDay, daysInCandidateMonth));
  return candidate.toISOString().slice(0, 10);
}
