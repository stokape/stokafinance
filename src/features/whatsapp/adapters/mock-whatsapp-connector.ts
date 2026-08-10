import { parseWhatsAppMessage } from "../services/message-parser.service";
import type { ParsedWhatsAppMessage, WhatsAppConnector, WhatsAppInboundMessage } from "../types/whatsapp.types";
import type { TransactionIntakeInput } from "@/features/transactions/types/intake.types";

/**
 * Implementación de prueba (test double) de `WhatsAppConnector`. NO hace
 * ninguna llamada de red — existe únicamente para que los tests puedan
 * ejercitar el pipeline "mensaje → Transaction Intake" sin depender de Meta.
 * Nunca se usa en runtime de producción (ver docs/whatsapp.md).
 */
export class MockWhatsAppConnector implements WhatsAppConnector {
  public sentConfirmations: { userId: string; message: string }[] = [];

  async receiveMessage(raw: unknown): Promise<WhatsAppInboundMessage> {
    if (typeof raw !== "object" || raw === null) throw new Error("INVALID_PAYLOAD");
    return raw as WhatsAppInboundMessage;
  }

  async parseMessage(message: WhatsAppInboundMessage): Promise<ParsedWhatsAppMessage> {
    return parseWhatsAppMessage(message.text);
  }

  toIntakeInput(userId: string, parsed: ParsedWhatsAppMessage, message: WhatsAppInboundMessage): TransactionIntakeInput {
    if (!parsed.amount) throw new Error("INTAKE_INVALID_AMOUNT");
    return {
      userId,
      source: "WHATSAPP",
      transactionType: parsed.categoryHint === "INCOME" ? "INCOME" : "EXPENSE",
      amount: parsed.amount,
      currency: "PEN",
      accountId: null, // se resuelve por accountHint contra whatsapp_connections/accounts del usuario
      description: parsed.description,
      transactionDate: message.receivedAt.slice(0, 10),
      confidence: parsed.confidence === "HIGH" ? 1 : parsed.confidence === "MEDIUM" ? 0.6 : 0.3,
    };
  }

  async requestConfirmation(): Promise<void> {
    /* no-op en el mock */
  }

  async confirmTransaction(): Promise<void> {
    /* no-op en el mock */
  }

  async sendConfirmation(userId: string, message: string): Promise<void> {
    this.sentConfirmations.push({ userId, message });
  }

  async linkPhoneNumber(): Promise<void> {
    /* no-op en el mock */
  }

  async unlinkPhoneNumber(): Promise<void> {
    /* no-op en el mock */
  }
}
