import { formatMoney } from "@/lib/utils/money";
import type { NetWorthBreakdownItem } from "@/features/net-worth/types/net-worth.types";

/** Lista de sólo lectura (cuentas, tarjetas, préstamos + activos/pasivos manuales combinados). */
export function BreakdownList({ items }: { items: NetWorthBreakdownItem[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium">{formatMoney(item.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
