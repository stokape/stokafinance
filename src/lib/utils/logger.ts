import { captureException } from "@/lib/monitoring/sentry";

/**
 * Logging estructurado mínimo. No usa librerías externas para el
 * transporte base (costo cero) y nunca debe recibir secretos (tokens,
 * contraseñas, claves) en `context`. Cada `logger.error` también se
 * reporta a Sentry vía `captureException` — que es un no-op si
 * `SENTRY_DSN` no está configurado (ver lib/monitoring/sentry.ts), así que
 * esto no cambia el comportamiento por defecto ni exige esa variable.
 */
type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  const serialized = JSON.stringify(entry);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => {
    emit("error", message, context);
    // Los call sites de este proyecto pasan el error original ya reducido a
    // string (context.error) para no filtrar objetos no serializables al
    // log — se reconstruye un Error sintético para que Sentry tenga al
    // menos el evento y el mensaje, aunque no el stack original.
    captureException(new Error(typeof context?.error === "string" ? context.error : message), { event: message, ...context });
  },
};
