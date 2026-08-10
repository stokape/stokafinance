import { describe, expect, it } from "vitest";
import { MockWhatsAppConnector } from "./mock-whatsapp-connector";

describe("MockWhatsAppConnector (sólo para tests — nunca en producción)", () => {
  it("convierte un mensaje entrante en un TransactionIntakeInput válido para EXPENSE", async () => {
    const connector = new MockWhatsAppConnector();
    const message = await connector.receiveMessage({
      phoneNumberHash: "hash-123",
      text: "Almuerzo 35 Yape",
      receivedAt: "2026-08-09T12:00:00.000Z",
    });

    const parsed = await connector.parseMessage(message);
    expect(parsed.confidence).toBe("HIGH");

    const intakeInput = connector.toIntakeInput("user-1", parsed, message);
    expect(intakeInput.source).toBe("WHATSAPP");
    expect(intakeInput.transactionType).toBe("EXPENSE");
    expect(intakeInput.amount).toBe("35");
    expect(intakeInput.transactionDate).toBe("2026-08-09");
  });

  it("clasifica como INCOME cuando el mensaje usa palabras clave de ingreso", async () => {
    const connector = new MockWhatsAppConnector();
    const message = await connector.receiveMessage({
      phoneNumberHash: "hash-123",
      text: "Recibí 6500 sueldo BCP",
      receivedAt: "2026-08-09T12:00:00.000Z",
    });
    const parsed = await connector.parseMessage(message);
    const intakeInput = connector.toIntakeInput("user-1", parsed, message);
    expect(intakeInput.transactionType).toBe("INCOME");
  });

  it("rechaza construir un intake sin monto reconocido (nunca inventa datos)", async () => {
    const connector = new MockWhatsAppConnector();
    const message = await connector.receiveMessage({
      phoneNumberHash: "hash-123",
      text: "Compré algo",
      receivedAt: "2026-08-09T12:00:00.000Z",
    });
    const parsed = await connector.parseMessage(message);
    expect(() => connector.toIntakeInput("user-1", parsed, message)).toThrow();
  });
});
