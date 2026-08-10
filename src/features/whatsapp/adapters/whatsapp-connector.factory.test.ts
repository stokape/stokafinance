import { describe, expect, it } from "vitest";
import { getWhatsAppConnector, isWhatsAppAvailable } from "./whatsapp-connector.factory";

describe("WhatsApp feature flag (costo cero por defecto — §34/§54)", () => {
  it("isWhatsAppAvailable() es false por defecto (WHATSAPP_ENABLED no está en 'true')", () => {
    expect(isWhatsAppAvailable()).toBe(false);
  });

  it("getWhatsAppConnector() lanza en vez de intentar conectarse a Meta", () => {
    expect(() => getWhatsAppConnector()).toThrow(/deshabilitada|no implementado/i);
  });
});
