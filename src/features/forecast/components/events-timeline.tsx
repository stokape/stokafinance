import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Receipt, Landmark, Repeat } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { ForecastEvent } from "@/lib/financial-engine";

const KIND_ICON: Record<string, typeof Receipt> = {
  BILL: Receipt,
  LOAN_INSTALLMENT: Landmark,
  SUBSCRIPTION: Repeat,
};

export function EventsTimeline({ events }: { events: ForecastEvent[] }) {
  if (events.length === 0) {
    return <EmptyState title="Sin eventos en este horizonte" description="No hay pagos, cuotas ni suscripciones proyectadas en este período." />;
  }

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ul className="divide-y divide-border">
      {sorted.map((event) => {
        const Icon = KIND_ICON[event.kind] ?? Receipt;
        const amount = Number(event.amount);
        return (
          <li key={event.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{event.label}</p>
                <p className="text-xs text-muted-foreground">{format(parseISO(event.date), "d MMM yyyy", { locale: es })}</p>
              </div>
            </div>
            <span className={cn("shrink-0 text-sm font-medium tabular-nums", amount < 0 ? "text-danger" : "text-success")}>
              {amount >= 0 ? "+" : ""}
              {formatMoney(amount)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
