import { describe, expect, it } from "vitest";
import { normalizeCsvRows, parseCsvAmount, parseCsvDate } from "./csv-normalize";

describe("parseCsvDate", () => {
  it("reconoce ISO (yyyy-MM-dd)", () => {
    expect(parseCsvDate("2026-08-15")).toBe("2026-08-15");
  });

  it("reconoce formato peruano dd/MM/yyyy", () => {
    expect(parseCsvDate("15/08/2026")).toBe("2026-08-15");
  });

  it("reconoce formato con guiones dd-MM-yyyy", () => {
    expect(parseCsvDate("15-08-2026")).toBe("2026-08-15");
  });

  it("devuelve null ante texto no reconocible (nunca inventa una fecha)", () => {
    expect(parseCsvDate("no es una fecha")).toBeNull();
  });

  it("devuelve null ante celda vacía", () => {
    expect(parseCsvDate("  ")).toBeNull();
  });
});

describe("parseCsvAmount", () => {
  it("parsea un monto simple", () => {
    expect(parseCsvAmount("45.00")).toEqual({ amount: "45.00", isNegative: false });
  });

  it("detecta negativo con signo menos", () => {
    expect(parseCsvAmount("-120.50")).toEqual({ amount: "120.50", isNegative: true });
  });

  it("detecta negativo en formato contable entre paréntesis", () => {
    expect(parseCsvAmount("(120.50)")).toEqual({ amount: "120.50", isNegative: true });
  });

  it("normaliza separador de miles estilo US (1,234.50)", () => {
    expect(parseCsvAmount("1,234.50")).toEqual({ amount: "1234.50", isNegative: false });
  });

  it("normaliza separador de miles estilo europeo (1.234,50)", () => {
    expect(parseCsvAmount("1.234,50")).toEqual({ amount: "1234.50", isNegative: false });
  });

  it("devuelve amount null ante texto no numérico", () => {
    expect(parseCsvAmount("abc").amount).toBeNull();
  });

  it("devuelve amount null ante monto 0 (no es un movimiento válido)", () => {
    expect(parseCsvAmount("0.00").amount).toBeNull();
  });
});

describe("normalizeCsvRows", () => {
  it("clasifica INCOME/EXPENSE con una sola columna de monto firmado", () => {
    const rows = normalizeCsvRows(
      [
        { rowIndex: 0, values: { Fecha: "15/08/2026", Descripcion: "Supermercado", Monto: "-150.00" } },
        { rowIndex: 1, values: { Fecha: "20/08/2026", Descripcion: "Sueldo", Monto: "3000.00" } },
      ],
      { dateColumn: "Fecha", descriptionColumn: "Descripcion", amountColumn: "Monto", singleAmountColumn: true },
    );

    expect(rows[0]).toMatchObject({ date: "2026-08-15", amount: "150.00", transactionType: "EXPENSE" });
    expect(rows[1]).toMatchObject({ date: "2026-08-20", amount: "3000.00", transactionType: "INCOME" });
  });

  it("clasifica INCOME/EXPENSE con columnas separadas de débito/crédito", () => {
    const rows = normalizeCsvRows(
      [
        { rowIndex: 0, values: { Fecha: "15/08/2026", Descripcion: "Compra", Debito: "50.00", Credito: "" } },
        { rowIndex: 1, values: { Fecha: "16/08/2026", Descripcion: "Depósito", Debito: "", Credito: "200.00" } },
      ],
      {
        dateColumn: "Fecha",
        descriptionColumn: "Descripcion",
        amountColumn: "",
        singleAmountColumn: false,
        debitColumn: "Debito",
        creditColumn: "Credito",
      },
    );

    expect(rows[0]).toMatchObject({ amount: "50.00", transactionType: "EXPENSE" });
    expect(rows[1]).toMatchObject({ amount: "200.00", transactionType: "INCOME" });
  });

  it("usa una descripción por defecto si la celda viene vacía", () => {
    const rows = normalizeCsvRows(
      [{ rowIndex: 0, values: { Fecha: "15/08/2026", Descripcion: "", Monto: "-10.00" } }],
      { dateColumn: "Fecha", descriptionColumn: "Descripcion", amountColumn: "Monto", singleAmountColumn: true },
    );
    expect(rows[0].description).toBe("(sin descripción)");
  });
});
