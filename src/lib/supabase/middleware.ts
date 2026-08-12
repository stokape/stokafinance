import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Refresca la sesión de Supabase en cada request y protege rutas privadas.
 * Se invoca desde `proxy.ts` en la raíz del proyecto, que ya le pasa
 * `requestHeaders` con `x-nonce`/`Content-Security-Policy` inyectados
 * (SECURITY-07) — este helper los propaga a cada `NextResponse` que
 * construye, sea `next()` o `redirect()`, para que la CSP con nonce llegue
 * al navegador sin importar qué rama del flujo de auth se tome.
 */
export async function updateSession(request: NextRequest, requestHeaders: Headers, cspHeaderValue: string) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspHeaderValue);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Sin configuración de Supabase no podemos validar sesión; dejamos pasar
    // para no romper el arranque local antes de configurar .env.local, pero
    // las rutas privadas fallarán igualmente al intentar leer datos.
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set("Content-Security-Policy", cspHeaderValue);
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.headers.set("Content-Security-Policy", cspHeaderValue);
    return redirectResponse;
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    redirectResponse.headers.set("Content-Security-Policy", cspHeaderValue);
    return redirectResponse;
  }

  return response;
}
