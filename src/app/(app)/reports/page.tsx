import type { Metadata } from "next";
import { formatISO, startOfMonth, endOfMonth } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReportsService } from "@/features/reports/services/reports.service";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { CategoriesService } from "@/features/categories/services/categories.service";
import { ReportsFilterBar } from "@/features/reports/components/reports-filter-bar";
import { BreakdownTable } from "@/features/reports/components/breakdown-table";
import { ExportCsvButton } from "@/features/reports/components/export-csv-button";
import { TransactionTable } from "@/features/transactions/components/transaction-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatMoney } from "@/lib/utils/money";
import type { TransactionType, TransactionStatus } from "@/features/transactions/types/transaction.types";

export const metadata: Metadata = { title: "Reportes" };

interface ReportsPageProps {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; accountId?: string; categoryId?: string; transactionType?: string; status?: string }>;
}

function dateOnly(date: Date): string {
  return formatISO(date, { representation: "date" });
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const now = new Date();
  const dateFrom = params.dateFrom || dateOnly(startOfMonth(now));
  const dateTo = params.dateTo || dateOnly(endOfMonth(now));

  const supabase = await createSupabaseServerClient();
  const [report, accounts, categories] = await Promise.all([
    new ReportsService(supabase).getReport({
      dateFrom,
      dateTo,
      accountId: params.accountId || undefined,
      categoryId: params.categoryId || undefined,
      transactionType: (params.transactionType as TransactionType) || undefined,
      status: (params.status as TransactionStatus) || undefined,
    }),
    new AccountsService(supabase).listAccounts(),
    new CategoriesService(supabase).getCategoriesWithSubcategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Movimientos filtrados por fecha, cuenta, categoría y tipo. Deudas, tarjetas, suscripciones y patrimonio tienen su
            propio reporte en vivo en sus respectivas secciones.
          </p>
        </div>
        <ExportCsvButton transactions={report.transactions} />
      </div>

      <ReportsFilterBar
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name, categoryType: c.categoryType }))}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      {report.truncated ? (
        <p className="text-xs text-warning">
          El período seleccionado tiene más movimientos de los que se pueden mostrar de una vez (límite 3000). Acota el rango de
          fechas para un reporte completo.
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-lg font-semibold">{formatMoney(report.totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-lg font-semibold">{formatMoney(report.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Flujo neto</p>
            <p className="text-lg font-semibold">{formatMoney(report.netCashFlow)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownTable items={report.byCategory} emptyLabel="Sin gastos en este período" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownTable items={report.byAccount} emptyLabel="Sin gastos en este período" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Movimientos ({report.transactions.length})</h2>
        {report.transactions.length === 0 ? (
          <EmptyState title="Sin movimientos" description="No hay movimientos que coincidan con estos filtros." />
        ) : (
          <TransactionTable items={report.transactions} />
        )}
      </div>
    </div>
  );
}
