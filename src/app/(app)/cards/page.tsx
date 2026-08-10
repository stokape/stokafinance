import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreditCardsService } from "@/features/credit-cards/services/credit-cards.service";
import { CreditCardCard } from "@/features/credit-cards/components/credit-card-card";
import { NewCreditCardButton } from "@/features/credit-cards/components/new-credit-card-button";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatMoney, sumMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Tarjetas" };

export default async function CardsPage() {
  const supabase = await createSupabaseServerClient();
  const cards = await new CreditCardsService(supabase).listCards();

  const totalDebt = sumMoney(cards.map((c) => c.currentDebt));
  const totalLimit = sumMoney(cards.map((c) => c.creditLimit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tarjetas</h1>
          {cards.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Deuda total: <span className="font-medium text-foreground">{formatMoney(totalDebt)}</span> de{" "}
              {formatMoney(totalLimit)} en línea
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Controla tus tarjetas de crédito y su utilización.</p>
          )}
        </div>
        <NewCreditCardButton />
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Aún no tienes tarjetas"
          description="Registra tu primera tarjeta de crédito para controlar compras, cuotas y utilización de línea."
          action={<NewCreditCardButton />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CreditCardCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
