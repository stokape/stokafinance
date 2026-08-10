import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { generateFinancialHealthScore } from "@/lib/financial-engine";

const RATING_LABELS: Record<ReturnType<typeof generateFinancialHealthScore>["rating"], string> = {
  RISK: "Riesgo",
  ATTENTION: "Atención",
  HEALTHY: "Saludable",
  VERY_HEALTHY: "Muy saludable",
};

const RATING_CLASSES: Record<ReturnType<typeof generateFinancialHealthScore>["rating"], string> = {
  RISK: "text-danger",
  ATTENTION: "text-warning",
  HEALTHY: "text-success",
  VERY_HEALTHY: "text-success",
};

/** Financial Health Score (§27). No es asesoría profesional — es un indicador orientativo determinístico. */
export function HealthScoreCard({ result }: { result: ReturnType<typeof generateFinancialHealthScore> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Puntaje de salud financiera</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">{result.score}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
          <span className={cn("ml-auto text-sm font-medium", RATING_CLASSES[result.rating])}>{RATING_LABELS[result.rating]}</span>
        </div>

        <div className="space-y-2">
          {result.factors.map((factor) => (
            <div key={factor.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{factor.label}</span>
                <span>{Math.round(factor.score)}/100</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, factor.score))}%` }} />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Este puntaje es orientativo, no es asesoría financiera profesional. Se calcula con reglas
          determinísticas — nunca con IA — a partir de tus datos reales (docs/financial-engine.md).
        </p>
      </CardContent>
    </Card>
  );
}
