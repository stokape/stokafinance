/**
 * Hook de arranque de Next.js (server + edge runtime). Inicializa
 * monitoreo (Sentry) sólo si SENTRY_DSN está configurado — ver
 * lib/monitoring/sentry.ts. Sin esa variable, este archivo no hace nada.
 */
export async function register() {
  const { initMonitoring } = await import("@/lib/monitoring/sentry");
  initMonitoring();
}
