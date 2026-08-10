import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import { TRANSACTION_TYPE_LABELS, type TransactionListItem } from "@/features/transactions/types/transaction.types";
import { TransactionRowActions } from "./transaction-row-actions";

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

const STATUS_LABELS: Record<TransactionListItem["status"], string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
};

export function TransactionTable({ items }: { items: TransactionListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted text-left text-xs font-medium text-muted-foreground">
            <th className="px-4 py-2.5">Fecha</th>
            <th className="px-4 py-2.5">Descripción</th>
            <th className="px-4 py-2.5">Categoría</th>
            <th className="px-4 py-2.5">Cuenta</th>
            <th className="px-4 py-2.5">Tipo</th>
            <th className="px-4 py-2.5">Estado</th>
            <th className="px-4 py-2.5 text-right">Monto</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {items.map((tx) => (
            <tr key={tx.id} className={cn("border-b border-border last:border-0", tx.status === "CANCELLED" && "opacity-50")}>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                {format(parseISO(tx.transactionDate), "d MMM yyyy", { locale: es })}
              </td>
              <td className="px-4 py-2.5">
                <span className="font-medium">{tx.description}</span>
                {tx.merchant ? <span className="text-muted-foreground"> · {tx.merchant}</span> : null}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{tx.categoryName ?? "—"}</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {tx.transactionType === "TRANSFER"
                  ? `${tx.accountName ?? "—"} → ${tx.destinationAccountName ?? "—"}`
                  : (tx.accountName ?? "—")}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{TRANSACTION_TYPE_LABELS[tx.transactionType]}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{STATUS_LABELS[tx.status]}</td>
              <td className={cn("px-4 py-2.5 whitespace-nowrap text-right font-medium", amountClass(tx.transactionType))}>
                {amountSign(tx.transactionType)}
                {formatMoney(tx.amount, tx.currency)}
              </td>
              <td className="px-4 py-2.5 text-right">
                <TransactionRowActions transactionId={tx.id} status={tx.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
