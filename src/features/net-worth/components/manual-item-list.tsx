"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils/money";
import { EmptyState } from "@/components/feedback/empty-state";
import type { ActionResult } from "@/types/action-result";

interface ManualItem {
  id: string;
  name: string;
  amount: string;
  currency: string;
  typeLabel: string;
}

interface ManualItemListProps {
  items: ManualItem[];
  emptyLabel: string;
  onDelete: (id: string) => Promise<ActionResult>;
}

export function ManualItemList({ items, emptyLabel, onDelete }: ManualItemListProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    startTransition(async () => {
      const result = await onDelete(id);
      if (result.ok) toast.success("Eliminado");
      else toast.error(result.error);
    });
  }

  if (items.length === 0) {
    return <EmptyState title={emptyLabel} className="py-6" />;
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.typeLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatMoney(item.amount, item.currency)}</span>
            <button
              type="button"
              onClick={() => handleDelete(item.id, item.name)}
              disabled={isPending}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-danger disabled:opacity-50"
              aria-label={`Eliminar ${item.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
