import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  caption?: string;
  /** % de cambio vs período anterior. Positivo = subió, negativo = bajó. */
  changePercentage?: number | null;
  /** Si true, un aumento se muestra como negativo (ej. gastos: subir es malo). */
  invertChangeSemantics?: boolean;
}

export function KpiCard({ label, value, icon: Icon, caption, changePercentage, invertChangeSemantics }: KpiCardProps) {
  const hasChange = changePercentage !== null && changePercentage !== undefined && Number.isFinite(changePercentage);
  const isIncrease = hasChange && changePercentage! > 0;
  const isGood = hasChange && (invertChangeSemantics ? changePercentage! < 0 : changePercentage! > 0);

  return (
    <Card>
      <CardContent className="space-y-1.5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
        </div>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        {hasChange ? (
          <p className={cn("flex items-center gap-1 text-xs font-medium", isGood ? "text-success" : "text-danger")}>
            {isIncrease ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(changePercentage!).toFixed(1)}% vs mes anterior
          </p>
        ) : caption ? (
          <p className="text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
