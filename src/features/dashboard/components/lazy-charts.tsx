"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/feedback/skeleton";

// Gráficos con Recharts se cargan en el cliente de forma perezosa (§43).
// `ssr: false` sólo se permite en Client Components — de ahí este wrapper.
export const CashflowChart = dynamic(() => import("./cashflow-chart").then((m) => m.CashflowChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] w-full" />,
});

export const CategoryBreakdownChart = dynamic(
  () => import("./category-breakdown-chart").then((m) => m.CategoryBreakdownChart),
  { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> },
);
