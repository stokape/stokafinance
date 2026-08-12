/**
 * Opciones de cookie compartidas por los 3 clientes Supabase (server,
 * browser, proxy/middleware) — SECURITY-07.
 *
 * `@supabase/ssr` usa `httpOnly: false` por defecto (para que un SDK
 * client-side pueda leer la sesión vía `document.cookie` si la necesitara).
 * Esta app nunca lee la sesión desde JavaScript en el navegador — todas las
 * lecturas de sesión son server-side vía `cookies()` de Next, que sí puede
 * leer cookies httpOnly — así que no hay ninguna razón para dejar la cookie
 * legible por JS, y sí una razón fuerte para no hacerlo: si alguna vez
 * apareciera un XSS, una cookie httpOnly no puede exfiltrarse vía
 * `document.cookie`.
 *
 * `secure` sólo se fuerza en producción: los navegadores modernos exceptúan
 * a `localhost`/`127.0.0.1` del requisito de contexto seguro para cookies
 * `Secure`, pero forzarlo siempre añade un riesgo innecesario de romper
 * desarrollo local en configuraciones menos comunes.
 */
export const supabaseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
} as const;
