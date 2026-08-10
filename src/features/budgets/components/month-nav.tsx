"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MonthNavProps {
  year: number;
  month: number;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function MonthNav({ year, month }: MonthNavProps) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const label = format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: es });

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/budgets?year=${prev.year}&month=${prev.month}`}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <span className="min-w-[140px] text-center text-sm font-medium capitalize">{label}</span>
      <Link
        href={`/budgets?year=${next.year}&month=${next.month}`}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
