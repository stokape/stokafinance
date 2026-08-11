"use client";

import { ManualItemList } from "./manual-item-list";
import { deleteLiabilityAction } from "@/features/net-worth/actions/net-worth.actions";
import { LIABILITY_TYPE_LABELS, type Liability } from "@/features/net-worth/types/net-worth.types";

export function ManualLiabilitiesSection({ liabilities }: { liabilities: Liability[] }) {
  return (
    <ManualItemList
      items={liabilities.map((l) => ({
        id: l.id,
        name: l.name,
        amount: l.currentBalance,
        currency: l.currency,
        typeLabel: LIABILITY_TYPE_LABELS[l.liabilityType],
      }))}
      emptyLabel="Sin pasivos manuales"
      onDelete={deleteLiabilityAction}
    />
  );
}
