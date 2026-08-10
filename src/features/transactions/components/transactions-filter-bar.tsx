"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TRANSACTION_TYPE_LABELS } from "@/features/transactions/types/transaction.types";

export function TransactionsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        placeholder="Buscar por descripción o comercio..."
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => updateParam("search", e.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        defaultValue={searchParams.get("transactionType") ?? ""}
        onChange={(e) => updateParam("transactionType", e.target.value)}
        className="sm:max-w-[180px]"
      >
        <option value="">Todos los tipos</option>
        {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="sm:max-w-[160px]"
      >
        <option value="">Todos los estados</option>
        <option value="CONFIRMED">Confirmado</option>
        <option value="PENDING">Pendiente</option>
        <option value="CANCELLED">Cancelado</option>
      </Select>
    </div>
  );
}
