import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreditCardsService } from "@/features/credit-cards/services/credit-cards.service";
import { UtilizationBar } from "@/features/credit-cards/components/utilization-bar";
import { nextPaymentDate } from "@/features/credit-cards/types/credit-card.types";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Detalle de tarjeta" };

interface CardDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const service = new CreditCardsService(supabase);

  const [card, purchases] = await Promise.all([service.getCard(id), service.listPurchases(id)]);

  if (!card) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/cards" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a tarjetas
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{card.name}</h1>
          <p className="text-sm text-muted-foreground">
            {card.bank}
            {card.lastFourDigits ? ` ···· ${card.lastFourDigits}` : ""} · Cierre día {card.closingDay} · Pago día{" "}
            {card.paymentDay}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Deuda actual</p>
              <p className="text-lg font-semibold">{formatMoney(card.currentDebt, card.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disponible</p>
              <p className="text-lg font-semibold">{formatMoney(card.availableCredit, card.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Línea total</p>
              <p className="text-lg font-semibold">{formatMoney(card.creditLimit, card.currency)}</p>
            </div>
          </div>
          <UtilizationBar percentage={card.utilizationPercentage} alertThreshold={Number(card.utilizationAlertThreshold)} />
          <p className="text-xs text-muted-foreground">Próximo pago estimado: {nextPaymentDate(card.paymentDay)}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Compras recientes</h2>
        {purchases.length === 0 ? (
          <EmptyState icon={Receipt} title="Sin compras registradas" description="Usa «Compra» desde la tarjeta para registrar la primera." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5">Descripción</th>
                  <th className="px-4 py-2.5">Categoría</th>
                  <th className="px-4 py-2.5">Cuotas</th>
                  <th className="px-4 py-2.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                      {format(parseISO(purchase.purchaseDate), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{purchase.description}</span>
                      {purchase.merchant ? <span className="text-muted-foreground"> · {purchase.merchant}</span> : null}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{purchase.categoryName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{purchase.installments > 1 ? `${purchase.installments}x` : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatMoney(purchase.amount, card.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
