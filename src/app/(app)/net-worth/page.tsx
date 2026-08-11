import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NetWorthService } from "@/features/net-worth/services/net-worth.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BreakdownList } from "@/features/net-worth/components/breakdown-list";
import { ManualAssetsSection } from "@/features/net-worth/components/manual-assets-section";
import { ManualLiabilitiesSection } from "@/features/net-worth/components/manual-liabilities-section";
import { NewAssetDialog } from "@/features/net-worth/components/new-asset-dialog";
import { NewLiabilityDialog } from "@/features/net-worth/components/new-liability-dialog";
import { SaveSnapshotButton } from "@/features/net-worth/components/save-snapshot-button";
import { NetWorthChart } from "@/features/net-worth/components/lazy-net-worth-chart";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Patrimonio" };

export default async function NetWorthPage() {
  const supabase = await createSupabaseServerClient();
  const service = new NetWorthService(supabase);
  const [overview, snapshots] = await Promise.all([service.getOverview(), service.listSnapshots(12)]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Patrimonio</h1>
          <p className="text-sm text-muted-foreground">Activos menos pasivos: cuentas, tarjetas, préstamos y tus registros manuales.</p>
        </div>
        <SaveSnapshotButton />
      </div>

      <Card>
        <CardContent className="grid grid-cols-3 gap-4 p-5">
          <div>
            <p className="text-xs text-muted-foreground">Total activos</p>
            <p className="text-lg font-semibold">{formatMoney(overview.totalAssets)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total pasivos</p>
            <p className="text-lg font-semibold">{formatMoney(overview.totalLiabilities)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Patrimonio neto</p>
            <p className="text-lg font-semibold">{formatMoney(overview.netWorth)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patrimonio neto — últimos snapshots</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <EmptyState
              title="Sin historial todavía"
              description="Usa «Guardar snapshot de hoy» periódicamente para construir tu evolución de patrimonio (sin cron automático, ver docs/costs.md)."
            />
          ) : (
            <NetWorthChart points={snapshots} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BreakdownList items={overview.systemAssetBreakdown} />
            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">Activos manuales</p>
              <NewAssetDialog />
            </div>
            <ManualAssetsSection assets={overview.manualAssets} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pasivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BreakdownList items={overview.systemLiabilityBreakdown} />
            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">Pasivos manuales</p>
              <NewLiabilityDialog />
            </div>
            <ManualLiabilitiesSection liabilities={overview.manualLiabilities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
