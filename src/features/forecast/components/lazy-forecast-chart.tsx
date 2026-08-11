"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/feedback/skeleton";

export const ForecastChart = dynamic(() => import("./forecast-chart").then((m) => m.ForecastChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] w-full" />,
});
