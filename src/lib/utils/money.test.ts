import { describe, expect, it } from "vitest";
import { addMoney, formatMoney, roundMoney, subtractMoney, sumMoney } from "./money";

describe("money utils", () => {
  it("no introduce errores de punto flotante en sumas repetidas", () => {
    // 0.1 + 0.2 en JS float = 0.30000000000000004
    const result = addMoney("0.1", "0.2");
    expect(result.toString()).toBe("0.3");
  });

  it("suma una lista de montos con precisión exacta", () => {
    const values = Array.from({ length: 10 }, () => "0.1");
    expect(sumMoney(values).toString()).toBe("1");
  });

  it("resta montos correctamente", () => {
    expect(subtractMoney("100.50", "30.25").toString()).toBe("70.25");
  });

  it("redondea a 2 decimales", () => {
    expect(roundMoney("10.005").toString()).toBe("10.01");
  });

  it("formatea en soles con separador de miles", () => {
    expect(formatMoney(1250.5, "PEN", "es-PE")).toBe("S/ 1,250.50");
  });

  it("formatea montos negativos con el signo antes del símbolo", () => {
    expect(formatMoney(-45, "PEN", "es-PE")).toBe("-S/ 45.00");
  });
});
