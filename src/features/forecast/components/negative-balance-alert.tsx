import { AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/utils/money";

export function NegativeBalanceAlert({ negativeDates, lowestBalance }: { negativeDates: string[]; lowestBalance: number }) {
  if (negativeDates.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger/40 bg-danger-bg p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
      <div>
        <p className="text-sm font-medium text-danger">Tu saldo proyectado será negativo</p>
        <p className="text-sm text-muted-foreground">
          A partir del {negativeDates[0]}, llegando a un mínimo de {formatMoney(lowestBalance)}. Revisa tus próximos pagos antes de esa fecha.
        </p>
      </div>
    </div>
  );
}
