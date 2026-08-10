import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase con la SERVICE ROLE KEY. Ignora RLS por completo.
 *
 * Uso permitido ÚNICAMENTE en:
 *  - tareas administrativas server-side sin contexto de usuario (backups,
 *    jobs de mantenimiento, generación de snapshots agregados).
 *
 * PROHIBIDO:
 *  - usarlo para servir datos a un usuario (usar siempre
 *    `createSupabaseServerClient()` para que RLS aplique con `auth.uid()`).
 *  - importarlo desde código que se ejecute en el cliente (el import
 *    "server-only" hace fallar el build si esto ocurre).
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY para el cliente admin.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
