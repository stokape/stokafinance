import type { TransactionIntakeInput } from "@/features/transactions/types/intake.types";

/**
 * Contratos de la Fase Futura A (WhatsApp) — ver docs/whatsapp.md. Nada de
 * esto se instancia mientras `features.whatsappEnabled` sea `false`
 * (src/lib/config/features.ts). Sólo tipos + interfaces + parser
 * determinístico, sin conexión real a Meta.
 */

export type WhatsAppConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface ParsedWhatsAppMessage {
  /** Campos que el parser determinístico logró extraer del texto. */
  amount: string | null;
  accountHint: string | null;
  categoryHint: string | null;
  description: string;
  confidence: WhatsAppConfidence;
  /** Campos que faltaron y requerirían confirmación del usuario (§38). */
  missingFields: string[];
}

export interface WhatsAppInboundMessage {
  phoneNumberHash: string;
  text: string;
  receivedAt: string;
}

/**
 * Interfaz del futuro conector de WhatsApp Business Cloud API. Ninguna
 * implementación productiva existe hoy — sólo el contrato, para que el
 * Transaction Intake ya sepa qué forma de datos recibirá cuando se active.
 */
export interface WhatsAppConnector {
  receiveMessage(raw: unknown): Promise<WhatsAppInboundMessage>;
  parseMessage(message: WhatsAppInboundMessage): Promise<ParsedWhatsAppMessage>;
  /** Construye el intake a partir de un mensaje ya parseado y confirmado por el usuario vinculado. */
  toIntakeInput(userId: string, parsed: ParsedWhatsAppMessage, message: WhatsAppInboundMessage): TransactionIntakeInput;
  requestConfirmation(userId: string, parsed: ParsedWhatsAppMessage): Promise<void>;
  confirmTransaction(userId: string, confirmationId: string): Promise<void>;
  sendConfirmation(userId: string, message: string): Promise<void>;
  linkPhoneNumber(userId: string, phoneNumberHash: string): Promise<void>;
  unlinkPhoneNumber(userId: string, phoneNumberHash: string): Promise<void>;
}
