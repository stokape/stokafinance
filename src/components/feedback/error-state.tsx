import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/**
 * Estado de error genérico. Nunca muestra detalles internos del backend
 * (stack traces, mensajes de Postgres) — sólo un mensaje seguro para el
 * usuario final (§34).
 */
export function ErrorState({ title = "Algo salió mal", description = "No pudimos cargar esta información. Intenta nuevamente.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-danger/40 bg-danger-bg p-10 text-center">
      <AlertTriangle className="h-6 w-6 text-danger" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
