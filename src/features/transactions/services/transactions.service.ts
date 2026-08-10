import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { TransactionsRepository } from "../repositories/transactions.repository";
import { TransactionIntakeService } from "./transaction-intake.service";
import type { CreateExpenseInput, CreateIncomeInput, CreateTransferInput } from "../validations/transaction.schema";
import type { TransactionFilters, TransactionListItem, PaginatedResult } from "../types/transaction.types";

export class TransactionsService {
  private readonly repository: TransactionsRepository;
  private readonly intake: TransactionIntakeService;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new TransactionsRepository(supabase);
    this.intake = new TransactionIntakeService(supabase);
  }

  async createExpense(userId: string, input: CreateExpenseInput): Promise<string> {
    const result = await this.intake.intake({
      userId,
      source: "WEB",
      transactionType: "EXPENSE",
      amount: input.amount,
      currency: input.currency,
      accountId: input.accountId,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId || null,
      description: input.description,
      merchant: input.merchant || null,
      transactionDate: input.transactionDate,
      notes: input.notes || null,
    });
    return result.transactionId;
  }

  async createIncome(userId: string, input: CreateIncomeInput): Promise<string> {
    const result = await this.intake.intake({
      userId,
      source: "WEB",
      transactionType: "INCOME",
      amount: input.amount,
      currency: input.currency,
      accountId: input.accountId,
      categoryId: input.categoryId,
      description: input.description,
      transactionDate: input.transactionDate,
      notes: input.notes || null,
    });
    return result.transactionId;
  }

  async createTransfer(userId: string, input: CreateTransferInput): Promise<string> {
    const result = await this.intake.intake({
      userId,
      source: "WEB",
      transactionType: "TRANSFER",
      amount: input.amount,
      currency: input.currency,
      accountId: input.accountId,
      destinationAccountId: input.destinationAccountId,
      description: input.description?.trim() || "Transferencia entre cuentas",
      transactionDate: input.transactionDate,
      notes: input.notes || null,
    });
    return result.transactionId;
  }

  listTransactions(filters: TransactionFilters): Promise<PaginatedResult<TransactionListItem>> {
    return this.repository.list(filters);
  }

  /** Transacciones en un rango, en el formato mínimo que consume el Financial Engine. */
  listForEngine(dateFrom: string, dateTo: string) {
    return this.repository.listForEngine(dateFrom, dateTo);
  }

  /** Cancela un movimiento (§13/§58): no se elimina, y el ledger revierte su efecto automáticamente. */
  cancelTransaction(id: string): Promise<void> {
    return this.repository.cancel(id);
  }
}
