import type { TransactionSource, TransactionType } from "@/types/database.types";

/**
 * Contrato normalizado de la Transaction Intake Layer (docs/architecture.md
 * §2). Todo canal — formulario web, CSV/XLSX, recurrentes, bills, tarjetas,
 * y en el futuro WhatsApp/OCR/Bank Sync — construye uno de estos objetos y
 * lo entrega a `TransactionIntakeService.intake()`. Ningún canal escribe en
 * `transactions` directamente.
 */
export interface TransactionIntakeInput {
  userId: string;
  source: TransactionSource;
  transactionType: TransactionType;
  amount: string;
  currency: string;
  accountId: string | null;
  destinationAccountId?: string | null;
  creditCardId?: string | null;
  loanId?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  description: string;
  merchant?: string | null;
  transactionDate: string; // YYYY-MM-DD
  paymentMethod?: string | null;
  notes?: string | null;
  externalReference?: string | null;
  recurringTransactionId?: string | null;
  importBatchId?: string | null;
  billId?: string | null;
  principalAmount?: string | null;
  interestAmount?: string | null;
  /**
   * 0–1. Canales deterministas (web, CSV con mapeo completo) siempre valen 1.
   * Reservado para futuros canales probabilísticos (WhatsApp sin todos los
   * datos, OCR) — ver docs/whatsapp.md. No usado por ningún canal activo hoy.
   */
  confidence?: number;
}

export interface IntakeResult {
  transactionId: string;
  wasDuplicate: boolean;
}
