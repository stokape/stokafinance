"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TRANSACTION_TYPE_LABELS } from "@/features/transactions/types/transaction.types";
import type { AccountOption, CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";

interface ReportsFilterBarProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
  dateFrom: string;
  dateTo: string;
}

export function ReportsFilterBar({ accounts, categories, dateFrom, dateTo }: ReportsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div className="space-y-1">
        <Label htmlFor="rep-from" className="text-xs">
          Desde
        </Label>
        <Input id="rep-from" type="date" defaultValue={dateFrom} onChange={(e) => updateParam("dateFrom", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="rep-to" className="text-xs">
          Hasta
        </Label>
        <Input id="rep-to" type="date" defaultValue={dateTo} onChange={(e) => updateParam("dateTo", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="rep-account" className="text-xs">
          Cuenta
        </Label>
        <Select id="rep-account" defaultValue={searchParams.get("accountId") ?? ""} onChange={(e) => updateParam("accountId", e.target.value)}>
          <option value="">Todas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="rep-category" className="text-xs">
          Categoría
        </Label>
        <Select id="rep-category" defaultValue={searchParams.get("categoryId") ?? ""} onChange={(e) => updateParam("categoryId", e.target.value)}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="rep-type" className="text-xs">
          Tipo
        </Label>
        <Select
          id="rep-type"
          defaultValue={searchParams.get("transactionType") ?? ""}
          onChange={(e) => updateParam("transactionType", e.target.value)}
        >
          <option value="">Todos</option>
          {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
