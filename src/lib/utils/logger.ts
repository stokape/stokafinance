/**
 * Logging estructurado mínimo. No usa librerías externas (costo cero) y
 * nunca debe recibir secretos (tokens, contraseñas, claves) en `context`.
 * Preparado para reemplazar el transporte por Sentry (`SENTRY_DSN`) sin
 * tocar los call sites — ver docs/costs.md.
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
  error: (message: string, context?: LogContext) => emit("error", message, context),
};
