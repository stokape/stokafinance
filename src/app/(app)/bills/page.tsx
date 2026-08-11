import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BillsService } from "@/features/bills/services/bills.service";
import { BillRow } from "@/features/bills/components/bill-row";
import { NewBillDialog } from "@/features/bills/components/new-bill-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatMoney, sumMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Pagos" };

export default async function BillsPage() {
  const supabase = await createSupabaseServerClient();
  const bills = await new BillsService(supabase).listUpcoming(90);

  const dueThisWeek = bills.filter((b) => b.urgency === "OVERDUE" || b.urgency === "DUE_TODAY" || b.urgency === "DUE_TOMORROW" || b.urgency === "DUE_THIS_WEEK");
  const totalDueThisWeek = sumMoney(dueThisWeek.map((b) => b.amount));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pagos</h1>
          {bills.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta semana: <span className="font-medium text-foreground">{formatMoney(totalDueThisWeek)}</span> en {dueThisWeek.length}{" "}
              pago{dueThisWeek.length === 1 ? "" : "s"}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Controla tus obligaciones futuras y no te atrases.</p>
          )}
        </div>
        <NewBillDialog />
      </div>

      {bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No tienes pagos pendientes"
          description="Registra un pago (alquiler, servicios, seguros...) para verlo aquí antes de que venza."
          action={<NewBillDialog />}
        />
      ) : (
        <div className="rounded-lg border border-border px-4">
          {bills.map((bill) => (
            <BillRow key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  );
}
