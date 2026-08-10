import { features, assertFeatureEnabled } from "@/lib/config/features";
import type { WhatsAppConnector } from "../types/whatsapp.types";

/**
 * Fábrica del conector real de WhatsApp. Lanza si `WHATSAPP_ENABLED=false`
 * (el default) — así ninguna ruta de código puede intentar hablar con Meta
 * por accidente. No existe todavía una implementación productiva: activar
 * este canal requiere primero construir `Cloud Api WhatsAppConnector` y
 * seguir el checklist de docs/whatsapp.md §Activación.
 */
export function getWhatsAppConnector(): WhatsAppConnector {
  assertFeatureEnabled("whatsappEnabled");
  // Nunca se alcanza mientras el flag esté en false; placeholder explícito
  // para cuando exista una implementación productiva real.
  throw new Error("WhatsApp connector productivo aún no implementado. Ver docs/whatsapp.md.");
}

export function isWhatsAppAvailable(): boolean {
  return features.whatsappEnabled;
}
