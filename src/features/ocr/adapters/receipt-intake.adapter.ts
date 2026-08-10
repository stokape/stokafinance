import { assertFeatureEnabled } from "@/lib/config/features";
import type { TransactionIntakeInput } from "@/features/transactions/types/intake.types";

/**
 * Contrato futuro para lectura de boletas/tickets por OCR (Fase Futura B).
 * Sin implementación productiva — ningún servicio OCR comercial está
 * integrado. Activar requiere `OCR_ENABLED=true` y una decisión explícita
 * de proveedor (ver docs/costs.md).
 */
export interface ReceiptIntakeAdapter {
  extractFromImage(userId: string, imageBuffer: Uint8Array): Promise<Partial<TransactionIntakeInput>>;
}

export function getReceiptIntakeAdapter(): ReceiptIntakeAdapter {
  assertFeatureEnabled("ocrEnabled");
  throw new Error("OCR aún no implementado. Ver docs/costs.md.");
}
