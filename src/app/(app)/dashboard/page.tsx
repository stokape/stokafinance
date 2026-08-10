import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, TrendingUp, CreditCard, PiggyBank, ArrowRightLeft, Sparkles } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardService } from "@/features/dashboard/services/dashboard.service";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { HealthScoreCard } from "@/features/dashboard/components/health-score-card";
import { RecentTransactionsCard } from "@/features/dashboard/components/recent-transactions-card";
import { CashflowChart, CategoryBreakdownChart } from "@/features/dashboard/components/lazy-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const service = new DashboardService(supabase);
  const data = await service.getDashboardData();

  if (!data.hasAccounts) {
    return (
      <EmptyState
        icon={Wallet}
        title="Bienvenido a STOKA Finance"
        description="Crea tu primera cuenta para empezar a ver tu dashboard con datos reales."
        action={
          <Link
            href="/accounts"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Crear mi primera cuenta
          </Link>
        }
        className="min-h-[60vh]"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de tu situación financiera este mes.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Saldo disponible" value={formatMoney(data.totalBalance)} icon={Wallet} caption="Suma de todas tus cuentas activas" />
        <KpiCard label="Patrimonio neto" value={formatMoney(data.netWorth)} icon={TrendingUp} caption="Activos − pasivos registrados" />
        <KpiCard label="Deuda total" value={formatMoney(data.totalDebt)} icon={CreditCard} caption="Tarjetas de crédito; préstamos: próximamente" />
        <KpiCard
          label="Ahorro del mes"
          value={formatMoney(data.monthlySavings)}
          icon={PiggyBank}
          caption={`Tasa de ahorro: ${data.savingsRatePercentage.toFixed(1)}%`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Ingresos del mes" value={formatMoney(data.monthlyIncome)} />
        <KpiCard
          label="Gastos del mes"
          value={formatMoney(data.monthlyExpenses)}
          changePercentage={data.expenseChangePercentage}
          invertChangeSemantics
        />
        <KpiCard label="Flujo de caja neto" value={formatMoney(data.monthlyCashFlow)} icon={ArrowRightLeft} />
        <KpiCard
          label="Dinero disponible para gastar"
          value={formatMoney(data.safeToSpend)}
          icon={Sparkles}
          caption="Sin considerar pagos/presupuesto aún (próximamente)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos vs gastos — últimos 12 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowChart data={data.monthlyEvolution} />
          </CardContent>
        </Card>

        <HealthScoreCard result={data.healthScore} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gastos por categoría este mes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <EmptyState title="Sin gastos este mes" description="Aún no registras gastos en este período." />
            ) : (
              <CategoryBreakdownChart items={data.categoryBreakdown} />
            )}
          </CardContent>
        </Card>

        <RecentTransactionsCard items={data.recentTransactions} />
      </div>
    </div>
  );
}
