import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import { ArrowLeftRight } from "lucide-react";
import type { TransactionListItem } from "@/features/transactions/types/transaction.types";

function amountClass(type: TransactionListItem["transactionType"]): string {
  if (type === "INCOME") return "text-success";
  if (type === "EXPENSE" || type === "CARD_PURCHASE") return "text-danger";
  return "text-foreground";
}

function amountSign(type: TransactionListItem["transactionType"]): string {
  if (type === "INCOME") return "+";
  if (type === "EXPENSE" || type === "CARD_PURCHASE") return "-";
  return "";
}

export function RecentTransactionsCard({ items }: { items: TransactionListItem[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Últimos movimientos</CardTitle>
        <Link href="/transactions" className="text-xs font-medium text-primary hover:underline">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="Sin movimientos todavía" description="Registra tu primer ingreso o gasto." />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{tx.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {format(parseISO(tx.transactionDate), "d MMM", { locale: es })}
                    {tx.categoryName ? ` · ${tx.categoryName}` : ""}
                  </p>
                </div>
                <span className={cn("shrink-0 text-sm font-medium tabular-nums", amountClass(tx.transactionType))}>
                  {amountSign(tx.transactionType)}
                  {formatMoney(tx.amount, tx.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
