import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { BillUrgencyBadge } from "@/features/bills/components/bill-urgency-badge";
import { formatMoney } from "@/lib/utils/money";
import type { BillWithUrgency } from "@/features/bills/types/bill.types";

export function UpcomingBillsCard({ bills }: { bills: BillWithUrgency[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Próximos pagos</CardTitle>
        <Link href="/bills" className="text-xs font-medium text-primary hover:underline">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <EmptyState icon={Receipt} title="Sin pagos pendientes" description="No tienes obligaciones registradas en los próximos 30 días." />
        ) : (
          <ul className="divide-y divide-border">
            {bills.map((bill) => (
              <li key={bill.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{bill.name}</p>
                  <BillUrgencyBadge urgency={bill.urgency} />
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">{formatMoney(bill.amount, bill.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
