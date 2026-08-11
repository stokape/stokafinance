import * as Sentry from "@sentry/nextjs";

/**
 * Monitoreo de errores opcional (§ "preparar integración con Sentry").
 * Inerte por defecto: sin `SENTRY_DSN` configurado, `init()` no hace nada
 * y `captureException()` no envía absolutamente nada a ningún servidor —
 * mismo patrón de costo cero que WhatsApp/OCR/Bank Sync
 * (src/lib/config/features.ts, docs/costs.md). No requiere cuenta de
 * Sentry para que la app funcione; sólo se activa si en el futuro se
 * decide pegar un DSN real en las variables de entorno.
 */

let initialized = false;

function readDsn(): string | undefined {
  // NEXT_PUBLIC_SENTRY_DSN para el cliente, SENTRY_DSN para server/edge —
  // ambos opcionales; se acepta cualquiera de los dos como fuente única.
  return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined;
}

export function isMonitoringEnabled(): boolean {
  return Boolean(readDsn());
}

/** Se llama una vez por runtime (server/edge vía instrumentation.ts, cliente vía instrumentation-client.ts). */
export function initMonitoring(): void {
  const dsn = readDsn();
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Sin PII: nunca se envían cookies/headers con datos financieros o de sesión.
    sendDefaultPii: false,
  });
  initialized = true;
}

/**
 * Reporta una excepción a Sentry si está configurado; si no, es un no-op.
 * Pensado para conectarse a `logger.error()` sin tocar cada call site
 * (ver lib/utils/logger.ts). `context` nunca debe incluir secretos —
 * misma regla que el logging estructurado.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!isMonitoringEnabled()) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
