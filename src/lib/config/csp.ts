/**
 * Content-Security-Policy dinámica con nonce por request (SECURITY-07).
 *
 * Antes vivía como string estático en `next.config.ts` con
 * `script-src 'self' 'unsafe-inline'` — 'unsafe-inline' anula la protección
 * de CSP contra XSS en scripts (cualquier <script> inline inyectado se
 * ejecutaría igual). Con nonce, sólo los scripts que Next.js marca con el
 * nonce exacto de ESTE request pueden ejecutarse — un script inyectado por
 * un atacante no puede adivinar un nonce nuevo por request.
 *
 * `style-src` SÍ mantiene 'unsafe-inline' deliberadamente: varios
 * componentes usan `style={{...}}` (barras de progreso, colores de
 * gráficos) que compilan a atributos `style="..."` — el nonce de CSP NO
 * cubre atributos de estilo inline (sólo elementos <style>/<link>), así que
 * quitarlo rompería esos componentes sin ganar protección real (el vector
 * de XSS peligroso es script, no estilo). Trade-off documentado, no
 * descuido.
 */
export function buildCspHeader(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseOrigin = (() => {
    try {
      return supabaseUrl ? new URL(supabaseUrl).origin : "";
    } catch {
      return "";
    }
  })();
  const isDev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:" + (supabaseOrigin ? ` ${supabaseOrigin}` : ""),
    "font-src 'self' data:",
    "connect-src 'self'" + (supabaseOrigin ? ` ${supabaseOrigin}` : ""),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
