import { AlertTriangle, CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface UtilizationBarProps {
  percentage: number;
  alertThreshold: number;
}

/** Barra de utilización de línea de tarjeta — nunca depende sólo del color (§16/§42): icono + texto siempre acompañan. */
export function UtilizationBar({ percentage, alertThreshold }: UtilizationBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const isOverLimit = percentage > 100;
  const isAtRisk = percentage >= alertThreshold;

  const barColor = isOverLimit ? "bg-danger" : isAtRisk ? "bg-warning" : "bg-success";
  const textColor = isOverLimit ? "text-danger" : isAtRisk ? "text-warning" : "text-success";
  const Icon = isOverLimit ? AlertTriangle : isAtRisk ? TriangleAlert : CheckCircle2;
  const label = isOverLimit ? "Línea excedida" : isAtRisk ? "Utilización alta" : "Utilización saludable";

  return (
    <div className="space-y-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${clamped}%` }} />
      </div>
      <p className={cn("flex items-center gap-1 text-xs font-medium", textColor)}>
        <Icon className="h-3 w-3" /> {percentage.toFixed(0)}% · {label}
      </p>
    </div>
  );
}
