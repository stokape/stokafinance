import type { Metadata } from "next";
import { Repeat } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubscriptionsService } from "@/features/subscriptions/services/subscriptions.service";
import { SubscriptionRow } from "@/features/subscriptions/components/subscription-row";
import { NewSubscriptionDialog } from "@/features/subscriptions/components/new-subscription-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Suscripciones" };

export default async function SubscriptionsPage() {
  const supabase = await createSupabaseServerClient();
  const { subscriptions, cost } = await new SubscriptionsService(supabase).getOverview();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Suscripciones</h1>
          <p className="text-sm text-muted-foreground">Servicios recurrentes y cuánto te cuestan realmente al año.</p>
        </div>
        <NewSubscriptionDialog />
      </div>

      <Card>
        <CardContent className="grid grid-cols-3 gap-4 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Suscripciones activas</p>
            <p className="text-lg font-semibold">{cost.activeCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Costo mensual</p>
            <p className="text-lg font-semibold">{formatMoney(cost.monthlyCost)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Costo anual proyectado</p>
            <p className="text-lg font-semibold">{formatMoney(cost.annualCost)}</p>
          </div>
        </CardContent>
      </Card>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Sin suscripciones registradas"
          description="Registra tus servicios recurrentes (streaming, software, hosting) para ver cuánto te cuestan en total."
          action={<NewSubscriptionDialog />}
        />
      ) : (
        <div className="rounded-lg border border-border px-4">
          {subscriptions.map((subscription) => (
            <SubscriptionRow key={subscription.id} subscription={subscription} />
          ))}
        </div>
      )}
    </div>
  );
}
