import { AlertTriangle, Info, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { Alert } from "@/lib/financial-engine";

const SEVERITY_STYLES: Record<Alert["severity"], { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-muted-foreground bg-muted" },
  warning: { icon: TriangleAlert, className: "text-warning bg-warning-bg" },
  critical: { icon: AlertTriangle, className: "text-danger bg-danger-bg" },
};

/** Alertas financieras (§26) — generadas por reglas determinísticas, nunca por IA. */
export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => {
          const { icon: Icon, className } = SEVERITY_STYLES[alert.severity];
          return (
            <div key={alert.id} className={cn("flex items-start gap-2.5 rounded-md p-3 text-sm", className)}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{alert.message}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
