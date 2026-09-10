import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Loan, LoanInstallment, LoanWithProgress } from "../types/loan.types";

type LoanRow = Database["public"]["Tables"]["loans"]["Row"];
type LoanInstallmentRow = Database["public"]["Tables"]["loan_installments"]["Row"];

function mapLoan(row: LoanRow): Loan {
  return {
    id: row.id,
    userId: row.user_id,
    lender: row.lender,
    description: row.description,
    originalAmount: row.original_amount,
    interestRate: row.interest_rate,
    installmentAmount: row.installment_amount,
    numberOfInstallments: row.number_of_installments,
    startDate: row.start_date,
    nextDueDate: row.next_due_date,
    estimatedEndDate: row.estimated_end_date,
    currency: row.currency,
    status: row.status,
    paymentType: row.payment_type,
    createdAt: row.created_at,
  };
}

function mapInstallment(row: LoanInstallmentRow): LoanInstallment {
  return {
    id: row.id,
    loanId: row.loan_id,
    installmentNumber: row.installment_number,
    dueDate: row.due_date,
    principalAmount: row.principal_amount,
    interestAmount: row.interest_amount,
    totalAmount: row.total_amount,
    status: row.status,
    paidTransactionId: row.paid_transaction_id,
  };
}

/** Único punto de acceso a Supabase para `loans`/`loan_installments`. RLS filtra por user_id = auth.uid(). */
export class LoansRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async balancesById(loanIds: string[]): Promise<Map<string, string>> {
    if (loanIds.length === 0) return new Map();
    const { data, error } = await this.supabase.from("loan_balances").select("loan_id, current_balance").in("loan_id", loanIds);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.loan_id, row.current_balance]));
  }

  private async installmentCountsById(loanIds: string[]): Promise<Map<string, { paid: number; total: number }>> {
    if (loanIds.length === 0) return new Map();
    const { data, error } = await this.supabase.from("loan_installments").select("loan_id, status").in("loan_id", loanIds);
    if (error) throw error;

    const counts = new Map<string, { paid: number; total: number }>();
    for (const row of data ?? []) {
      const current = counts.get(row.loan_id) ?? { paid: 0, total: 0 };
      current.total += 1;
      if (row.status === "PAID") current.paid += 1;
      counts.set(row.loan_id, current);
    }
    return counts;
  }

  async list(options: { includeInactive?: boolean } = {}): Promise<LoanWithProgress[]> {
    let query = this.supabase.from("loans").select("*").order("created_at", { ascending: true });
    if (!options.includeInactive) query = query.eq("status", "ACTIVE");

    const { data, error } = await query;
    if (error) throw error;

    const loans = data ?? [];
    const [balances, counts] = await Promise.all([
      this.balancesById(loans.map((l) => l.id)),
      this.installmentCountsById(loans.map((l) => l.id)),
    ]);

    return loans.map((row) => {
      const currentBalance = balances.get(row.id) ?? row.original_amount;
      const count = counts.get(row.id) ?? { paid: 0, total: row.number_of_installments };
      const percentageAmortized =
        Number(row.original_amount) > 0 ? ((Number(row.original_amount) - Number(currentBalance)) / Number(row.original_amount)) * 100 : 0;
      return {
        ...mapLoan(row),
        currentBalance,
        installmentsPaid: count.paid,
        installmentsRemaining: count.total - count.paid,
        percentageAmortized,
      };
    });
  }

  async findById(id: string): Promise<LoanWithProgress | null> {
    const { data, error } = await this.supabase.from("loans").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const [balances, counts] = await Promise.all([this.balancesById([data.id]), this.installmentCountsById([data.id])]);
    const currentBalance = balances.get(data.id) ?? data.original_amount;
    const count = counts.get(data.id) ?? { paid: 0, total: data.number_of_installments };
    const percentageAmortized =
      Number(data.original_amount) > 0 ? ((Number(data.original_amount) - Number(currentBalance)) / Number(data.original_amount)) * 100 : 0;

    return {
      ...mapLoan(data),
      currentBalance,
      installmentsPaid: count.paid,
      installmentsRemaining: count.total - count.paid,
      percentageAmortized,
    };
  }

  async create(userId: string, input: Omit<Database["public"]["Tables"]["loans"]["Insert"], "user_id">): Promise<Loan> {
    const { data, error } = await this.supabase
      .from("loans")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single();
    if (error) throw error;
    return mapLoan(data);
  }

  async updateStatus(id: string, status: Loan["status"]): Promise<void> {
    const { error } = await this.supabase.from("loans").update({ status }).eq("id", id);
    if (error) throw error;
  }

  async updateNextDueDate(id: string, nextDueDate: string | null): Promise<void> {
    const { error } = await this.supabase.from("loans").update({ next_due_date: nextDueDate }).eq("id", id);
    if (error) throw error;
  }

  async createInstallments(rows: Database["public"]["Tables"]["loan_installments"]["Insert"][]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.supabase.from("loan_installments").insert(rows);
    if (error) throw error;
  }

  async listInstallments(loanId: string): Promise<LoanInstallment[]> {
    const { data, error } = await this.supabase
      .from("loan_installments")
      .select("*")
      .eq("loan_id", loanId)
      .order("installment_number", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapInstallment);
  }

  async findNextPendingInstallment(loanId: string): Promise<LoanInstallment | null> {
    const { data, error } = await this.supabase
      .from("loan_installments")
      .select("*")
      .eq("loan_id", loanId)
      .eq("status", "PENDING")
      .order("installment_number", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapInstallment(data) : null;
  }

  async markInstallmentPaid(installmentId: string, transactionId: string): Promise<void> {
    const { error } = await this.supabase
      .from("loan_installments")
      .update({ status: "PAID", paid_transaction_id: transactionId })
      .eq("id", installmentId);
    if (error) throw error;
  }
}
