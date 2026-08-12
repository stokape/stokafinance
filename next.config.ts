import type { NextConfig } from "next";

/**
 * Content-Security-Policy: NO vive aquí (SECURITY-07) — se genera dinámica,
 * con nonce por request, en `proxy.ts` (`src/lib/config/csp.ts`). Antes
 * había una CSP estática acá con `script-src 'unsafe-inline'`, que anulaba
 * la protección real de CSP contra XSS. Ponerla también aquí duplicaría el
 * header (dos `Content-Security-Policy` se combinan por intersección según
 * el spec, lo cual puede romper la política sin avisar) — un solo punto de
 * verdad, en proxy.ts.
 *
 * El resto de headers de seguridad sí son estáticos (no dependen de un
 * nonce por request) y se quedan acá.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // El caché HMR de Server Components (activo por defecto en dev) cachea
  // TODAS las respuestas fetch entre refrescos de HMR, incluso con
  // `cache: 'no-store'` — incluye potencialmente las llamadas que el SDK de
  // Supabase hace a PostgREST desde Server Components/Actions. Se desactiva
  // para que las pruebas manuales y E2E en dev siempre vean datos frescos.
  // Ver node_modules/next/dist/docs/.../serverComponentsHmrCache.md.
  experimental: {
    serverComponentsHmrCache: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
