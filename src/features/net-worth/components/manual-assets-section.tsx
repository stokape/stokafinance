"use client";

import { ManualItemList } from "./manual-item-list";
import { deleteAssetAction } from "@/features/net-worth/actions/net-worth.actions";
import { ASSET_TYPE_LABELS, type Asset } from "@/features/net-worth/types/net-worth.types";

export function ManualAssetsSection({ assets }: { assets: Asset[] }) {
  return (
    <ManualItemList
      items={assets.map((a) => ({ id: a.id, name: a.name, amount: a.currentValue, currency: a.currency, typeLabel: ASSET_TYPE_LABELS[a.assetType] }))}
      emptyLabel="Sin activos manuales"
      onDelete={deleteAssetAction}
    />
  );
}
