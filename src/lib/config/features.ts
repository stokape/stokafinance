/**
 * Feature flags centrales de STOKA Finance.
 *
 * Regla de costo cero (ver docs/costs.md): cualquier canal/integración que
 * pueda generar cargos (WhatsApp, IA, OCR comercial, sync bancario) está
 * DESHABILITADO por defecto y sólo se activa con una variable de entorno
 * explícita. Ningún módulo CORE (web, CSV/XLSX, recurrentes, backup a
 * Google Drive) depende de estos flags.
 *
 * Los adapters de canales futuros (`src/features/*\/adapters`) deben
 * consultar estos flags antes de instanciar cualquier cliente externo.
 * Con el flag en `false`, el adapter correspondiente no debe requerir
 * ninguna credencial ni realizar ninguna llamada de red.
 */

function readBooleanFlag(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export const features = {
  /** Captura de movimientos vía WhatsApp. Ver docs/whatsapp.md. */
  whatsappEnabled: readBooleanFlag(process.env.WHATSAPP_ENABLED),
  /** Financial Copilot (LLM como explicador, nunca como calculador). */
  aiEnabled: readBooleanFlag(process.env.AI_ENABLED),
  /** Lectura de boletas/tickets por OCR. */
  ocrEnabled: readBooleanFlag(process.env.OCR_ENABLED),
  /** Sincronización directa con bancos vía API/agregador. */
  bankSyncEnabled: readBooleanFlag(process.env.BANK_SYNC_ENABLED),
} as const;

export type FeatureFlags = typeof features;

/** Lanza si se intenta usar una feature deshabilitada — falla rápido y explícito. */
export function assertFeatureEnabled(flag: keyof FeatureFlags): void {
  if (!features[flag]) {
    throw new Error(
      `Feature "${flag}" está deshabilitada (costo cero por defecto). ` +
        `Ver docs/costs.md para el proceso de activación explícita.`,
    );
  }
}
