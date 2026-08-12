/**
 * Opciones de cookie compartidas por los clientes Supabase — SECURITY-07.
 *
 * `@supabase/ssr` usa `httpOnly: false` por defecto (para que un SDK
 * client-side pueda leer la sesión vía `document.cookie` si la necesitara).
 * Esta app nunca LEE la sesión desde JavaScript en el navegador — todas las
 * lecturas de sesión son server-side vía `cookies()` de Next, que sí puede
 * leer cookies httpOnly — así que las cookies que terminan escribiéndose
 * server-side (login, refresh de sesión, exchangeCodeForSession) sí van
 * httpOnly: si alguna vez apareciera un XSS, no se pueden exfiltrar vía
 * `document.cookie`.
 *
 * PERO: el cliente de NAVEGADOR (`createSupabaseBrowserClient`) sí necesita
 * escribir cookies él mismo vía `document.cookie` — es el mecanismo que usa
 * para guardar el "code verifier" de PKCE antes de redirigir a un proveedor
 * OAuth (ver oauth-buttons.tsx). Un navegador NUNCA puede crear una cookie
 * httpOnly desde JS (por diseño: si pudiera, httpOnly no protegería nada) —
 * y no la ignora en silencio: Chromium (confirmado con Playwright) RECHAZA
 * por completo el `document.cookie = "...; HttpOnly"`, la cookie ni
 * siquiera se crea. Eso rompía el login con Google: sin code_verifier
 * guardado, `exchangeCodeForSession` fallaba con "PKCE code verifier not
 * found in storage" — bug real encontrado en producción, no hipotético.
 *
 * Por eso hay dos variantes: `httpOnly: true` para los clientes
 * server-side (server.ts, middleware.ts — sesión real, vía Set-Cookie de
 * verdad, donde httpOnly SÍ se respeta), y sin `httpOnly` para el cliente
 * de navegador (client.ts) — que de todas formas nunca podría lograrlo.
 *
 * `secure` sólo se fuerza en producción en ambos casos: los navegadores
 * modernos exceptúan a `localhost`/`127.0.0.1` del requisito de contexto
 * seguro para cookies `Secure`, pero forzarlo siempre añade un riesgo
 * innecesario de romper desarrollo local en configuraciones menos comunes.
 */
export const supabaseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
} as const;

/** Para createSupabaseBrowserClient — ver por qué arriba. */
export const supabaseBrowserCookieOptions = {
  secure: process.env.NODE_ENV === "production",
} as const;
