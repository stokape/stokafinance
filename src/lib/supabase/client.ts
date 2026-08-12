"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { supabaseBrowserCookieOptions } from "@/lib/supabase/cookie-options";

/**
 * Cliente Supabase para Client Components. Usa la anon key — la seguridad
 * real la da RLS en Postgres, nunca este cliente.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa .env.local (ver .env.example).",
    );
  }

  return createBrowserClient<Database>(url, anonKey, { cookieOptions: supabaseBrowserCookieOptions });
}
