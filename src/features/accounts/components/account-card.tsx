"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Archive } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/money";
import { ACCOUNT_TYPE_LABELS, type AccountWithBalance } from "@/features/accounts/types/account.types";
import { archiveAccountAction } from "@/features/accounts/actions/accounts.actions";

export function AccountCard({ account }: { account: AccountWithBalance }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const balance = Number(account.currentBalance);

  function handleArchive() {
    setMenuOpen(false);
    startTransition(async () => {
      const result = await archiveAccountAction(account.id);
      if (result.ok) {
        toast.success("Cuenta archivada", {
          description: result.data.hadTransactions
            ? "Su historial de movimientos se conserva."
            : undefined,
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{account.name}</p>
          <p className="text-xs text-muted-foreground">
            {ACCOUNT_TYPE_LABELS[account.accountType]}
            {account.institution ? ` · ${account.institution}` : ""}
          </p>
          <p className={balance < 0 ? "text-lg font-semibold text-danger" : "text-lg font-semibold"}>
            {formatMoney(account.currentBalance, account.currency)}
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
                <Archive className="h-4 w-4" /> Archivar cuenta
              </button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
