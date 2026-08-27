"use client";

import { useTransition } from "react";
import { RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/money";
import { cancelSubscriptionAction } from "@/features/subscriptions/actions/subscriptions.actions";
import { findCancellationInfo } from "@/features/subscriptions/lib/cancellation-guide";
import { FREQUENCY_LABELS, type Subscription } from "@/features/subscriptions/types/subscription.types";

export function SubscriptionRow({ subscription }: { subscription: Subscription }) {
  const [isPending, startTransition] = useTransition();
  const cancellationInfo = findCancellationInfo(subscription.name, subscription.provider);

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
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {subscription.name}
          {subscription.recurringTransactionId ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground"
              title="Se registra automáticamente como gasto cada ciclo"
            >
              <RefreshCw className="h-2.5 w-2.5" /> auto
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {FREQUENCY_LABELS[subscription.frequency]}
          {subscription.provider ? ` · ${subscription.provider}` : ""}
          {subscription.categoryName ? ` · ${subscription.categoryName}` : ""} · próximo cobro {subscription.nextPaymentDate}
        </p>
        {cancellationInfo ? (
          <p className="text-xs text-muted-foreground">
            {cancellationInfo.url ? (
              <a href={cancellationInfo.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Cómo cancelar {cancellationInfo.label}
              </a>
            ) : (
              <span>
                Cómo cancelar {cancellationInfo.label}: {cancellationInfo.note}
              </span>
            )}
          </p>
        ) : null}
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
