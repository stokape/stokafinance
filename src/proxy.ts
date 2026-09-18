import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { buildCspHeader } from "@/lib/config/csp";
import { isMaintenanceModeEnabled, renderMaintenanceHtml } from "@/lib/config/maintenance";

const MAINTENANCE_BYPASS_COOKIE = "stoka_bypass";
const MAINTENANCE_BYPASS_QUERY_PARAM = "stoka_bypass";

/**
 * `true` si este request debe saltarse el modo mantenimiento — vía cookie ya
 * puesta en un visit anterior, o vía `?stoka_bypass=<MAINTENANCE_BYPASS_TOKEN>`
 * en la URL actual (dueño del proyecto probando la app mientras el resto ve
 * la pantalla de mantenimiento).
 */
function hasMaintenanceBypass(request: NextRequest): boolean {
  const bypassToken = process.env.MAINTENANCE_BYPASS_TOKEN;
  if (!bypassToken) return false;

  if (request.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value === bypassToken) return true;

  const queryToken = request.nextUrl.searchParams.get(MAINTENANCE_BYPASS_QUERY_PARAM);
  return queryToken === bypassToken;
}

// Renombrado de middleware.ts → proxy.ts (Next.js 16 deprecó `middleware`
// en favor de `proxy` — ver node_modules/next/dist/docs/.../middleware.md).
// La lógica de sesión/rutas no cambió; lo nuevo aquí es la CSP con nonce
// por request (SECURITY-07) y el modo mantenimiento.
export async function proxy(request: NextRequest) {
  if (isMaintenanceModeEnabled()) {
    const bypassed = hasMaintenanceBypass(request);
    if (!bypassed) {
      return new NextResponse(renderMaintenanceHtml(), {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Retry-After": "3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Si vino con el token por query param, lo persiste en cookie (1 día)
    // para no tener que repetirlo en cada URL mientras dura el mantenimiento.
    const queryToken = request.nextUrl.searchParams.get(MAINTENANCE_BYPASS_QUERY_PARAM);
    if (queryToken && queryToken === process.env.MAINTENANCE_BYPASS_TOKEN) {
      const response = NextResponse.next();
      response.cookies.set(MAINTENANCE_BYPASS_COOKIE, queryToken, {
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      return response;
    }
    // Bypass ya venía por cookie: sigue el flujo normal (sesión/CSP) abajo.
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeaderValue = buildCspHeader(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeaderValue);

  return updateSession(request, requestHeaders, cspHeaderValue);
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto assets estáticos y archivos internos
     * de Next.js, para no interferir con el cacheo de estáticos.
     *
     * `icon`/`apple-icon` (bug encontrado al aplicar el logo nuevo, ya
     * existía antes de esta sesión): son rutas de convención de Next
     * (favicon/apple-touch-icon) — sin excluirlas, un visitante sin sesión
     * quedaba redirigido a /login al pedirlas, y el navegador nunca
     * recibía la imagen real.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|media/|icon|apple-icon|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)",
  ],
};
