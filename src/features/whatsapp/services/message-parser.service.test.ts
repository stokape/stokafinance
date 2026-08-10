import { describe, expect, it } from "vitest";
import { parseWhatsAppMessage } from "./message-parser.service";

describe("parseWhatsAppMessage (parser determinístico, sin IA — §37/§38)", () => {
  it("extrae monto y cuenta con alta confianza cuando ambos están presentes", () => {
    const result = parseWhatsAppMessage("Almuerzo 35 Yape");
    expect(result.amount).toBe("35");
    expect(result.accountHint).toBe("yape");
    expect(result.confidence).toBe("HIGH");
    expect(result.missingFields).toHaveLength(0);
  });

  it("soporta montos con decimales", () => {
    const result = parseWhatsAppMessage("Taxi 24.50 efectivo");
    expect(result.amount).toBe("24.50");
    expect(result.accountHint).toBe("efectivo");
  });

  it("detecta la cuenta sin importar mayúsculas/minúsculas", () => {
    const result = parseWhatsAppMessage("Gasolina 150 BCP");
    expect(result.accountHint).toBe("bcp");
  });

  it("marca confianza MEDIA cuando falta la cuenta", () => {
    const result = parseWhatsAppMessage("Pagué 500");
    expect(result.confidence).toBe("MEDIUM");
    expect(result.missingFields).toContain("account");
  });

  it("marca confianza BAJA cuando no hay monto reconocible", () => {
    const result = parseWhatsAppMessage("Compré algo en la tienda");
    expect(result.confidence).toBe("LOW");
    expect(result.missingFields).toContain("amount");
  });

  it("reconoce palabras clave de ingreso (ej. sueldo, recibí)", () => {
    const result = parseWhatsAppMessage("Recibí 6500 sueldo BCP");
    expect(result.categoryHint).toBe("INCOME");
    expect(result.amount).toBe("6500");
    expect(result.accountHint).toBe("bcp");
  });

  it("nunca inventa un monto o cuenta que no está en el texto", () => {
    const result = parseWhatsAppMessage("Compré algo");
    expect(result.amount).toBeNull();
    expect(result.accountHint).toBeNull();
  });
});
