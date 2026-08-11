"use client";

import { useTransition } from "react";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/money";
import { cancelSubscriptionAction } from "@/features/subscriptions/actions/subscriptions.actions";
import { FREQUENCY_LABELS, type Subscription } from "@/features/subscriptions/types/subscription.types";

export function SubscriptionRow({ subscription }: { subscription: Subscription }) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm(`¿Cancelar la suscripción "${subscription.name}"?`)) return;
    startTransition(async () => {
      const result = await cancelSubscriptionAction(subscription.id);
      if (result.ok) toast.success("Suscripción cancelada");
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{subscription.name}</p>
        <p className="text-xs text-muted-foreground">
          {FREQUENCY_LABELS[subscription.frequency]}
          {subscription.provider ? ` · ${subscription.provider}` : ""}
          {subscription.categoryName ? ` · ${subscription.categoryName}` : ""} · próximo cobro {subscription.nextPaymentDate}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{formatMoney(subscription.amount, subscription.currency)}</span>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending} aria-label={`Cancelar ${subscription.name}`}>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
