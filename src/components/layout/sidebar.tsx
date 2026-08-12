"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Construction } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { LogoPhoto } from "@/components/brand/logo-photo";
import { cn } from "@/lib/utils/cn";

/** Sidebar colapsable de escritorio (§5). Oculta en móvil — ver mobile-nav.tsx. */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <LogoPhoto size={28} />
        {!collapsed ? (
          <span className="truncate text-sm font-semibold tracking-tight">
            <span className="text-foreground">STOKA</span> <span style={{ color: "#00C8A3" }}>FINANCE</span>
          </span>
        ) : null}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed ? (
                <span className="flex flex-1 items-center justify-between truncate">
                  {item.label}
                  {item.status === "planned" ? <Construction className="h-3 w-3 text-muted-foreground/60" aria-label="Próximamente" /> : null}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex h-12 items-center justify-center border-t border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
