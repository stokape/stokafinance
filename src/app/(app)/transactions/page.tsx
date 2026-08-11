import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, Upload } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TransactionsService } from "@/features/transactions/services/transactions.service";
import { transactionFiltersSchema } from "@/features/transactions/validations/transaction.schema";
import { TransactionTable } from "@/features/transactions/components/transaction-table";
import { TransactionsFilterBar } from "@/features/transactions/components/transactions-filter-bar";
import { RecurringTransactionsCard } from "@/features/recurring-transactions/components/recurring-transactions-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Movimientos" };

interface TransactionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const rawParams = await searchParams;
  const parsedFilters = transactionFiltersSchema.parse({
    search: rawParams.search,
    accountId: rawParams.accountId,
    categoryId: rawParams.categoryId,
    transactionType: rawParams.transactionType || undefined,
    status: rawParams.status || undefined,
    dateFrom: rawParams.dateFrom,
    dateTo: rawParams.dateTo,
    page: rawParams.page,
    pageSize: rawParams.pageSize,
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const service = new TransactionsService(supabase);
  const result = await service.listTransactions(parsedFilters);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Movimientos</h1>
          <p className="text-sm text-muted-foreground">Todos tus ingresos, gastos y transferencias.</p>
        </div>
        <Link
          href="/transactions/import"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
        >
          <Upload className="h-4 w-4" /> Importar CSV
        </Link>
      </div>

      {user ? <RecurringTransactionsCard supabase={supabase} userId={user.id} /> : null}

      <TransactionsFilterBar />

      {result.items.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No hay movimientos"
          description="Usa el botón «Nuevo movimiento» para registrar tu primer ingreso, gasto o transferencia."
        />
      ) : (
        <div className="space-y-3">
          <TransactionTable items={result.items} />
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} />
        </div>
      )}
    </div>
  );
}
