import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { buildCspHeader } from "@/lib/config/csp";

// Renombrado de middleware.ts → proxy.ts (Next.js 16 deprecó `middleware`
// en favor de `proxy` — ver node_modules/next/dist/docs/.../middleware.md).
// La lógica de sesión/rutas no cambió; lo nuevo aquí es la CSP con nonce
// por request (SECURITY-07).
export async function proxy(request: NextRequest) {
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
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
