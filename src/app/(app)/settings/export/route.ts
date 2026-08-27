import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DataExportService } from "@/features/data-export/services/data-export.service";
import { logger } from "@/lib/utils/logger";

/**
 * Descarga un JSON con TODOS los datos del usuario autenticado (derecho de
 * acceso/portabilidad — ver docs/security-audit-2026-08-12.md, P3). Es un
 * GET simple con la cookie de sesión de siempre, así que el botón en
 * Configuración es un `<a href="/settings/export">` plano — sin JS, sin
 * Server Action, sin blob en el cliente.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const exportData = await new DataExportService(supabase).exportAll(user.id, user.email);
    const filename = `stoka-finance-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error("data_export_failed", { userId: user.id, error: error instanceof Error ? error.message : String(error) });
    return new Response(JSON.stringify({ error: "No pudimos generar tu exportación. Intenta nuevamente." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
