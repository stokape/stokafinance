import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { TransactionsRepository } from "../repositories/transactions.repository";
import type { TransactionIntakeInput, IntakeResult } from "../types/intake.types";

/**
 * Transaction Intake Layer (docs/architecture.md §2). Punto de entrada
 * ÚNICO para escribir en `transactions`, sin importar el canal (web, CSV,
 * recurrentes, bills, tarjetas y en el futuro WhatsApp/OCR/Bank Sync).
 *
 * Pipeline: normalize → validate (estructural) → deduplicate → insert.
 * La clasificación automática (asignar categoría) queda para cuando exista
 * un canal que no la provea (ej. WhatsApp) — hoy todos los canales activos
 * siempre traen category_id explícito.
 */
export class TransactionIntakeService {
  private readonly repository: TransactionsRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new TransactionsRepository(supabase);
  }

  private normalize(input: TransactionIntakeInput): TransactionIntakeInput {
    return {
      ...input,
      currency: input.currency.trim().toUpperCase(),
      description: input.description.trim(),
      merchant: input.merchant?.trim() || null,
      notes: input.notes?.trim() || null,
    };
  }

  private assertStructurallyValid(input: TransactionIntakeInput): void {
    if (Number(input.amount) <= 0) {
      throw new Error("INTAKE_INVALID_AMOUNT");
    }
    if (input.transactionType === "TRANSFER") {
      if (!input.destinationAccountId || input.destinationAccountId === input.accountId) {
        throw new Error("INTAKE_INVALID_TRANSFER");
      }
    }
    if ((input.transactionType === "CARD_PURCHASE" || input.transactionType === "CARD_PAYMENT") && !input.creditCardId) {
      throw new Error("INTAKE_MISSING_CREDIT_CARD");
    }
    if ((input.transactionType === "LOAN_DISBURSEMENT" || input.transactionType === "LOAN_PAYMENT") && !input.loanId) {
      throw new Error("INTAKE_MISSING_LOAN");
    }
  }

  async intake(rawInput: TransactionIntakeInput): Promise<IntakeResult> {
    const input = this.normalize(rawInput);
    this.assertStructurallyValid(input);

    // La deduplicación activa (bloquear inserción) sólo aplica a canales que
    // pueden reprocesar el mismo dato (CSV/XLSX, futuro WhatsApp/Bank Sync).
    // El formulario web es una acción explícita del usuario y no se bloquea.
    let wasDuplicate = false;
    if (input.source === "CSV" || input.source === "XLSX") {
      wasDuplicate = await this.repository.findPotentialDuplicate({
        accountId: input.accountId ?? "",
        transactionDate: input.transactionDate,
        amount: input.amount,
        description: input.description,
      });
      if (wasDuplicate) {
        return { transactionId: "", wasDuplicate: true };
      }
    }

    const row = await this.repository.insert({
      user_id: input.userId,
      account_id: input.accountId,
      destination_account_id: input.destinationAccountId ?? null,
      credit_card_id: input.creditCardId ?? null,
      loan_id: input.loanId ?? null,
      category_id: input.categoryId ?? null,
      subcategory_id: input.subcategoryId ?? null,
      bill_id: input.billId ?? null,
      transaction_type: input.transactionType,
      description: input.description,
      amount: input.amount,
      principal_amount: input.principalAmount ?? null,
      interest_amount: input.interestAmount ?? null,
      currency: input.currency,
      transaction_date: input.transactionDate,
      status: "CONFIRMED",
      merchant: input.merchant ?? null,
      notes: input.notes ?? null,
      source: input.source,
      payment_method: input.paymentMethod ?? null,
      external_reference: input.externalReference ?? null,
      recurring_transaction_id: input.recurringTransactionId ?? null,
      import_batch_id: input.importBatchId ?? null,
    });

    return { transactionId: row.id, wasDuplicate: false };
  }
}
