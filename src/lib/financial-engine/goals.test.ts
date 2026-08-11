import { describe, expect, it } from "vitest";
import { calculateGoalProgress, calculateRequiredMonthlyContribution } from "./goals";

describe("calculateGoalProgress", () => {
  it("calcula % alcanzado y monto faltante", () => {
    const result = calculateGoalProgress("10000", "4000");
    expect(result.percentageComplete.toString()).toBe("40");
    expect(result.amountRemaining.toString()).toBe("6000");
    expect(result.isComplete).toBe(false);
  });

  it("nunca reporta más de 100% aunque se haya aportado de más", () => {
    const result = calculateGoalProgress("1000", "1500");
    expect(result.percentageComplete.toString()).toBe("100");
    expect(result.amountRemaining.toString()).toBe("0");
    expect(result.isComplete).toBe(true);
  });

  it("protege contra meta de monto 0", () => {
    const result = calculateGoalProgress("0", "0");
    expect(result.percentageComplete.toString()).toBe("0");
  });
});

describe("calculateRequiredMonthlyContribution", () => {
  it("reparte el faltante entre los meses hasta la fecha objetivo", () => {
    const result = calculateRequiredMonthlyContribution("6000", "2027-02-10", "2026-08-10");
    expect(result.toString()).toBe("1000");
  });

  it("sin fecha objetivo, devuelve el monto faltante completo", () => {
    const result = calculateRequiredMonthlyContribution("6000", null, "2026-08-10");
    expect(result.toString()).toBe("6000");
  });

  it("con la fecha objetivo ya vencida, devuelve el monto faltante completo", () => {
    const result = calculateRequiredMonthlyContribution("6000", "2026-01-01", "2026-08-10");
    expect(result.toString()).toBe("6000");
  });

  it("meta ya cumplida: no requiere ahorro adicional", () => {
    const result = calculateRequiredMonthlyContribution("0", "2027-02-10", "2026-08-10");
    expect(result.toString()).toBe("0");
  });
});
