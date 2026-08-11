"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/feedback/skeleton";

// Recharts se carga en el cliente de forma perezosa (§43), igual que en el Dashboard.
export const NetWorthChart = dynamic(() => import("./net-worth-chart").then((m) => m.NetWorthChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full" />,
});
