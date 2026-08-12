import { describe, it, expect } from "vitest";
import { neutralizeCsvFormula, escapeCsvField, buildCsv } from "./csv-export";

describe("neutralizeCsvFormula", () => {
  it("neutraliza un campo que empieza con =", () => {
    expect(neutralizeCsvFormula("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
  });

  it("neutraliza +, -, @, tab y retorno de carro", () => {
    expect(neutralizeCsvFormula("+1234")).toBe("'+1234");
    expect(neutralizeCsvFormula("-1234")).toBe("'-1234");
    expect(neutralizeCsvFormula("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(neutralizeCsvFormula("\tmalicious")).toBe("'\tmalicious");
    expect(neutralizeCsvFormula("\rmalicious")).toBe("'\rmalicious");
  });

  it("no toca texto normal", () => {
    expect(neutralizeCsvFormula("Supermercado")).toBe("Supermercado");
    expect(neutralizeCsvFormula("")).toBe("");
  });

  it("no toca un número negativo típico de un monto (se maneja como string ya formateado, no como fórmula)", () => {
    // Nota: montos negativos SÍ empiezan con "-" y por diseño también se
    // neutralizan (quedan como texto con comilla líder) — es el trade-off
    // correcto: un lector de CSV/Excel los sigue mostrando legibles, y no
    // hay forma de distinguir "-50.00" de una fórmula maliciosa sin contexto.
    expect(neutralizeCsvFormula("-50.00")).toBe("'-50.00");
  });
});

describe("escapeCsvField", () => {
  it("neutraliza fórmula y además escapa comillas/comas/saltos de línea", () => {
    expect(escapeCsvField('=HYPERLINK("http://evil.com","click")')).toBe(
      `"'=HYPERLINK(""http://evil.com"",""click"")"`,
    );
  });

  it("escapa un campo con coma sin fórmula", () => {
    expect(escapeCsvField("Lima, Perú")).toBe('"Lima, Perú"');
  });
});

describe("buildCsv", () => {
  it("arma un CSV con header y filas neutralizadas", () => {
    const csv = buildCsv(["Descripción", "Monto"], [["=cmd", "100"], ["Normal", "50"]]);
    expect(csv).toBe('Descripción,Monto\n\'=cmd,100\nNormal,50');
  });
});
