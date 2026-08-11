"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const HORIZONS = [7, 15, 30, 60, 90];

export function HorizonSelector({ current }: { current: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex gap-1 rounded-md bg-muted p-1">
      {HORIZONS.map((horizon) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("days", String(horizon));
        const isActive = horizon === current;
        return (
          <Link
            key={horizon}
            href={`${pathname}?${params.toString()}`}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {horizon}d
          </Link>
        );
      })}
    </div>
  );
}
