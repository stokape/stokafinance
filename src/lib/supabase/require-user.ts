import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/access/require-subscription";

/**
 * Defensa en profundidad (auditoría de seguridad, V-13): confirma sesión
 * antes de tocar la base de datos en Server Actions de sólo lectura. RLS ya
 * garantiza que un cliente sin sesión no vería datos ajenos (las policies
 * son `user_id = auth.uid()`, que no matchea con `auth.uid() IS NULL`), pero
 * sin este check el request igual dispara queries a Postgres para un
 * resultado vacío — invocable por cualquiera sin sesión. Este helper deja el
 * corte explícito y evita ese trabajo innecesario.
 */
export async function getAuthenticatedSupabase() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) requireActiveSubscription(user);
  return { supabase, user };
}
