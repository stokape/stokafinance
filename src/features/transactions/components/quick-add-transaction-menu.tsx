"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { getQuickAddOptionsAction } from "@/features/transactions/actions/get-quick-add-options.action";

export interface AccountOption {
  id: string;
  name: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  categoryType: "INCOME" | "EXPENSE";
}

type TransactionMode = "EXPENSE" | "INCOME" | "TRANSFER";

const OPTIONS: { mode: TransactionMode; label: string; icon: typeof ArrowDownCircle }[] = [
  { mode: "EXPENSE", label: "Gasto", icon: ArrowDownCircle },
  { mode: "INCOME", label: "Ingreso", icon: ArrowUpCircle },
  { mode: "TRANSFER", label: "Transferencia", icon: ArrowLeftRight },
];

/**
 * Botón global "+ Nuevo movimiento" (§47). Carga cuentas/categorías en el
 * cliente sólo cuando se abre por primera vez, para no penalizar cada
 * navegación con una consulta que casi nunca se usa.
 */
export function QuickAddTransactionMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<TransactionMode | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function ensureOptionsLoaded() {
    if (loaded) return;
    const { accounts: accountOptions, categories: categoryOptions } = await getQuickAddOptionsAction();
    setAccounts(accountOptions);
    setCategories(categoryOptions);
    setLoaded(true);
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        size="sm"
        onClick={async () => {
          await ensureOptionsLoaded();
          setMenuOpen((v) => !v);
        }}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Nuevo movimiento</span>
      </Button>

      {menuOpen ? (
        <div role="menu" className="absolute right-0 top-11 z-40 w-52 rounded-md border border-border bg-card p-1 shadow-lg">
          {OPTIONS.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setDialogMode(mode);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      ) : null}

      {dialogMode ? (
        <TransactionFormDialog
          open={dialogMode !== null}
          onClose={() => setDialogMode(null)}
          initialMode={dialogMode}
          accounts={accounts}
          categories={categories}
        />
      ) : null}
    </div>
  );
}
