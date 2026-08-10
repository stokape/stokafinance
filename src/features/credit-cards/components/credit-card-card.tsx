"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreVertical, Archive, Plus, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/money";
import { UtilizationBar } from "./utilization-bar";
import { CardPurchaseDialog } from "./card-purchase-dialog";
import { CardPaymentDialog } from "./card-payment-dialog";
import { getCardFormOptionsAction } from "@/features/credit-cards/actions/get-card-form-options.action";
import { archiveCreditCardAction } from "@/features/credit-cards/actions/credit-cards.actions";
import { nextPaymentDate, type CreditCardWithBalance } from "@/features/credit-cards/types/credit-card.types";
import type { AccountOption, CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

export function CreditCardCard({ card }: { card: CreditCardWithBalance }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<"purchase" | "payment" | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function openDialog(kind: "purchase" | "payment") {
    if (!loaded) {
      const options = await getCardFormOptionsAction();
      setAccounts(options.accounts);
      setCategories(options.categories);
      setLoaded(true);
    }
    setDialog(kind);
  }

  function handleArchive() {
    setMenuOpen(false);
    startTransition(async () => {
      const result = await archiveCreditCardAction(card.id);
      if (result.ok) toast.success("Tarjeta archivada");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/cards/${card.id}`} className="truncate text-sm font-medium hover:underline">
              {card.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {card.bank}
              {card.lastFourDigits ? ` ···· ${card.lastFourDigits}` : ""}
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Más opciones"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div role="menu" className="absolute right-0 top-9 z-20 w-44 rounded-md border border-border bg-card p-1 shadow-lg">
                <button
                  type="button"
                  role="menuitem"
                  disabled={isPending}
                  onClick={handleArchive}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Archive className="h-4 w-4" /> Archivar tarjeta
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-xl font-semibold">{formatMoney(card.currentDebt, card.currency)}</p>
          <p className="text-xs text-muted-foreground">
            Disponible {formatMoney(card.availableCredit, card.currency)} de {formatMoney(card.creditLimit, card.currency)}
          </p>
        </div>

        <UtilizationBar percentage={card.utilizationPercentage} alertThreshold={Number(card.utilizationAlertThreshold)} />

        <p className="text-xs text-muted-foreground">Próximo pago: {nextPaymentDate(card.paymentDay)}</p>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => openDialog("purchase")}>
            <Plus className="h-3.5 w-3.5" /> Compra
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => openDialog("payment")}>
            <Banknote className="h-3.5 w-3.5" /> Pagar
          </Button>
        </div>
      </CardContent>

      <CardPurchaseDialog open={dialog === "purchase"} onClose={() => setDialog(null)} creditCardId={card.id} categories={categories} />
      <CardPaymentDialog
        open={dialog === "payment"}
        onClose={() => setDialog(null)}
        creditCardId={card.id}
        currentDebt={card.currentDebt}
        accounts={accounts}
      />
    </Card>
  );
}
