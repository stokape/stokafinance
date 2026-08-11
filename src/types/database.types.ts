/**
 * Tipos generados manualmente a partir de `supabase/migrations/0001_init.sql`.
 *
 * En un proyecto Supabase real, este archivo se regenera con:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 *
 * Mientras no exista un proyecto Supabase vinculado, se mantiene a mano y
 * debe ampliarse en el mismo commit que agregue una tabla nueva a la
 * migración. Cubre las tablas usadas por el código actual (Fases 1-4:
 * profiles, accounts, categories, subcategories, transactions,
 * ledger_entries). Las tablas de fases posteriores (bills, credit_cards,
 * loans, budgets, subscriptions, goals, assets, liabilities, snapshots,
 * audit_logs, whatsapp_connections) ya existen en SQL pero se tipan aquí
 * cuando su feature se implemente, para no arrastrar tipos sin uso.
 *
 * NOTA: cada tabla/vista incluye `Relationships: []` y el schema incluye
 * `Functions: {}` porque @supabase/postgrest-js exige esa forma exacta
 * (`GenericTable`/`GenericView`/`GenericSchema`) — sin ellos, TypeScript
 * degrada el schema entero a `never` y cada query se vuelve intipable.
 */

export type AccountType = "CASH" | "CHECKING" | "SAVINGS" | "DIGITAL_WALLET" | "INVESTMENT" | "OTHER";
export type CategoryType = "INCOME" | "EXPENSE";
export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER"
  | "CARD_PURCHASE"
  | "CARD_PAYMENT"
  | "LOAN_DISBURSEMENT"
  | "LOAN_PAYMENT";
export type TransactionStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type TransactionSource = "WEB" | "CSV" | "XLSX" | "RECURRING" | "BILL" | "CREDIT_CARD" | "WHATSAPP" | "BANK_API" | "OCR" | "API";
export type LedgerTargetType = "ACCOUNT" | "CREDIT_CARD" | "LOAN";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          currency: string;
          timezone: string;
          locale: string;
          avatar_url: string | null;
          monthly_income_estimate: string | null;
          primary_goal: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["profiles"]["Row"], "id">> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          institution: string | null;
          account_type: AccountType;
          currency: string;
          initial_balance: string;
          icon: string | null;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["accounts"]["Row"]> & {
          user_id: string;
          name: string;
          account_type: AccountType;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          category_type: CategoryType;
          icon: string | null;
          color: string | null;
          is_system: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          name: string;
          category_type: CategoryType;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      subcategories: {
        Row: {
          id: string;
          user_id: string | null;
          category_id: string;
          name: string;
          is_system: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subcategories"]["Row"]> & {
          category_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["subcategories"]["Row"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          destination_account_id: string | null;
          credit_card_id: string | null;
          credit_card_transaction_id: string | null;
          loan_id: string | null;
          loan_installment_id: string | null;
          bill_id: string | null;
          category_id: string | null;
          subcategory_id: string | null;
          transaction_type: TransactionType;
          description: string;
          amount: string;
          principal_amount: string | null;
          interest_amount: string | null;
          currency: string;
          transaction_date: string;
          status: TransactionStatus;
          payment_method: string | null;
          merchant: string | null;
          notes: string | null;
          source: TransactionSource;
          external_reference: string | null;
          recurring_transaction_id: string | null;
          import_batch_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & {
          user_id: string;
          transaction_type: TransactionType;
          description: string;
          amount: string | number;
          transaction_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
        Relationships: [];
      };
      ledger_entries: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string;
          target_type: LedgerTargetType;
          target_id: string;
          amount: string;
          currency: string;
          entry_date: string;
          created_at: string;
        };
        Insert: never; // sólo lo escribe el trigger fn_sync_ledger_entries
        Update: never;
        Relationships: [];
      };
      credit_cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          bank: string;
          brand: string | null;
          last_four_digits: string | null;
          currency: string;
          credit_limit: string;
          closing_day: number;
          payment_day: number;
          annual_interest_rate: string | null;
          utilization_alert_threshold: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["credit_cards"]["Row"]> & {
          user_id: string;
          name: string;
          bank: string;
          credit_limit: string | number;
          closing_day: number;
          payment_day: number;
        };
        Update: Partial<Database["public"]["Tables"]["credit_cards"]["Row"]>;
        Relationships: [];
      };
      credit_card_transactions: {
        Row: {
          id: string;
          user_id: string;
          credit_card_id: string;
          category_id: string | null;
          subcategory_id: string | null;
          description: string;
          merchant: string | null;
          amount: string;
          purchase_date: string;
          installments: number;
          status: "PENDING" | "CONFIRMED" | "CANCELLED";
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["credit_card_transactions"]["Row"]> & {
          user_id: string;
          credit_card_id: string;
          description: string;
          amount: string | number;
          purchase_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["credit_card_transactions"]["Row"]>;
        Relationships: [];
      };
      credit_card_installment_plans: {
        Row: {
          id: string;
          user_id: string;
          credit_card_transaction_id: string;
          installment_number: number;
          amount: string;
          statement_period: string;
          status: "PENDING" | "BILLED" | "PAID";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["credit_card_installment_plans"]["Row"]> & {
          user_id: string;
          credit_card_transaction_id: string;
          installment_number: number;
          amount: string | number;
          statement_period: string;
        };
        Update: Partial<Database["public"]["Tables"]["credit_card_installment_plans"]["Row"]>;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          month: number;
          expected_income: string;
          savings_target: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["budgets"]["Row"]> & { user_id: string; year: number; month: number };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Row"]>;
        Relationships: [];
      };
      budget_categories: {
        Row: {
          id: string;
          user_id: string;
          budget_id: string;
          category_id: string;
          allocated_amount: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["budget_categories"]["Row"]> & {
          user_id: string;
          budget_id: string;
          category_id: string;
          allocated_amount: string | number;
        };
        Update: Partial<Database["public"]["Tables"]["budget_categories"]["Row"]>;
        Relationships: [];
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          lender: string;
          description: string | null;
          original_amount: string;
          interest_rate: string | null;
          installment_amount: string;
          number_of_installments: number;
          start_date: string;
          next_due_date: string | null;
          estimated_end_date: string | null;
          currency: string;
          disbursement_account_id: string | null;
          status: "ACTIVE" | "PAID_OFF" | "DEFAULTED" | "CANCELLED";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["loans"]["Row"]> & {
          user_id: string;
          lender: string;
          original_amount: string | number;
          installment_amount: string | number;
          number_of_installments: number;
          start_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["loans"]["Row"]>;
        Relationships: [];
      };
      loan_installments: {
        Row: {
          id: string;
          user_id: string;
          loan_id: string;
          installment_number: number;
          due_date: string;
          principal_amount: string;
          interest_amount: string;
          total_amount: string;
          status: "PENDING" | "PAID" | "OVERDUE";
          paid_transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["loan_installments"]["Row"]> & {
          user_id: string;
          loan_id: string;
          installment_number: number;
          due_date: string;
          principal_amount: string | number;
          total_amount: string | number;
        };
        Update: Partial<Database["public"]["Tables"]["loan_installments"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      account_balances: {
        Row: {
          account_id: string;
          user_id: string;
          current_balance: string;
        };
        Relationships: [];
      };
      credit_card_balances: {
        Row: {
          credit_card_id: string;
          user_id: string;
          credit_limit: string;
          current_debt: string;
          available_credit: string;
        };
        Relationships: [];
      };
      loan_balances: {
        Row: {
          loan_id: string;
          user_id: string;
          original_amount: string;
          current_balance: string;
        };
        Relationships: [];
      };
      goal_progress: {
        Row: {
          goal_id: string;
          user_id: string;
          target_amount: string;
          current_amount: string;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}
