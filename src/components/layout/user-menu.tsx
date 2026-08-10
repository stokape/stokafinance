"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { logoutAction } from "@/features/auth/actions/auth.actions";
import { cn } from "@/lib/utils/cn";

interface UserMenuProps {
  fullName: string | null;
  email: string;
}

function initialsOf(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function UserMenu({ fullName, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de usuario"
      >
        {initialsOf(fullName, email)}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-11 z-50 w-56 rounded-md border border-border bg-card p-1 shadow-lg",
          )}
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{fullName || "Usuario"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            href="/settings"
            role="menuitem"
            className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" /> Configuración
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" /> Mi perfil
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
