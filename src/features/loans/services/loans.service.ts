import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { LoansRepository } from "../repositories/loans.repository";
import { TransactionIntakeService } from "@/features/transactions/services/transaction-intake.service";
import { generateAmortizationSchedule, generateInterestOnlySchedule } from "@/lib/financial-engine";
import type { CreateLoanInput } from "../validations/loan.schema";
import type { LoanInstallment, LoanWithProgress } from "../types/loan.types";

export class LoansService {
  private readonly repository: LoansRepository;
  private readonly intake: TransactionIntakeService;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new LoansRepository(supabase);
    this.intake = new TransactionIntakeService(supabase);
  }

  listLoans(options?: { includeInactive?: boolean }): Promise<LoanWithProgress[]> {
    return this.repository.list(options);
  }

  getLoan(id: string): Promise<LoanWithProgress | null> {
    return this.repository.findById(id);
  }

  listInstallments(loanId: string): Promise<LoanInstallment[]> {
    return this.repository.listInstallments(loanId);
  }

  getNextPendingInstallment(loanId: string): Promise<LoanInstallment | null> {
    return this.repository.findNextPendingInstallment(loanId);
  }

  /**
   * Crea un préstamo y proyecta su calendario de amortización completo
   * (§15/§58: cada cuota ya distingue capital e interés desde el inicio).
   * No registra un desembolso en el ledger — se asume que el préstamo ya
   * existía o que el dinero se registra aparte; sólo modela la deuda y su
   * plan de pago. Documentado en docs/architecture.md como supuesto.
   */
  async createLoan(userId: string, input: CreateLoanInput): Promise<string> {
    const interestRate = input.interestRate || "0";
    const manualAmount = input.installmentAmount || undefined;
    const schedule =
      input.paymentType === "INTEREST_ONLY"
        ? generateInterestOnlySchedule(input.originalAmount, interestRate, input.numberOfInstallments, input.startDate, manualAmount)
        : generateAmortizationSchedule(input.originalAmount, interestRate, input.numberOfInstallments, input.startDate, manualAmount);

    if (schedule.length === 0) throw new Error("LOAN_INVALID_SCHEDULE");

    const loan = await this.repository.create(userId, {
      lender: input.lender,
      description: input.description || null,
      original_amount: input.originalAmount,
      interest_rate: input.interestRate || null,
      installment_amount: schedule[0].totalPayment.toString(),
      number_of_installments: input.numberOfInstallments,
      start_date: input.startDate,
      next_due_date: schedule[0].dueDate,
      estimated_end_date: schedule[schedule.length - 1].dueDate,
      currency: input.currency,
      status: "ACTIVE",
      payment_type: input.paymentType,
    });

    await this.repository.createInstallments(
      schedule.map((installment) => ({
        user_id: userId,
        loan_id: loan.id,
        installment_number: installment.installmentNumber,
        due_date: installment.dueDate,
        principal_amount: installment.principal.toString(),
        interest_amount: installment.interest.toString(),
        total_amount: installment.totalPayment.toString(),
      })),
    );

    return loan.id;
  }

  /**
   * Paga la próxima cuota pendiente (§58): separa capital/interés según el
   * calendario proyectado, saca el total de la cuenta elegida y reduce el
   * pasivo únicamente por el componente de capital.
   */
  async payNextInstallment(userId: string, loanId: string, accountId: string, paymentDate: string): Promise<string> {
    const loan = await this.repository.findById(loanId);
    if (!loan) throw new Error("LOAN_NOT_FOUND");

    const installment = await this.repository.findNextPendingInstallment(loanId);
    if (!installment) throw new Error("LOAN_FULLY_PAID");

    const result = await this.intake.intake({
      userId,
      source: "WEB",
      transactionType: "LOAN_PAYMENT",
      amount: installment.totalAmount,
      principalAmount: installment.principalAmount,
      interestAmount: installment.interestAmount,
      currency: loan.currency,
      accountId,
      loanId,
      description: `Cuota ${installment.installmentNumber}/${loan.numberOfInstallments} — ${loan.lender}`,
      transactionDate: paymentDate,
    });

    await this.repository.markInstallmentPaid(installment.id, result.transactionId);

    const next = await this.repository.findNextPendingInstallment(loanId);
    if (next) {
      await this.repository.updateNextDueDate(loanId, next.dueDate);
    } else {
      await this.repository.updateNextDueDate(loanId, null);
      await this.repository.updateStatus(loanId, "PAID_OFF");
    }

    return result.transactionId;
  }

  cancelLoan(id: string): Promise<void> {
    return this.repository.updateStatus(id, "CANCELLED");
  }
}
