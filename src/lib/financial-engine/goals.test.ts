import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { calculateGoalProgress, calculateRequiredMonthlyContribution, contributionToMonthlyPace, estimateGoalCompletionDate } from "./goals";

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

describe("contributionToMonthlyPace", () => {
  it("mensual: no cambia", () => {
    expect(contributionToMonthlyPace("100", "MONTHLY").toString()).toBe("100");
  });

  it("quincenal (junta): 26 veces al año / 12", () => {
    expect(contributionToMonthlyPace("100", "BIWEEKLY").toString()).toBe(new Decimal("100").times(26).dividedBy(12).toString());
  });

  it("semanal, trimestral, semestral y anual también convierten a base mensual", () => {
    expect(contributionToMonthlyPace("100", "WEEKLY").toNumber()).toBeCloseTo((100 * 52) / 12, 5);
    expect(contributionToMonthlyPace("300", "QUARTERLY").toString()).toBe("100");
    expect(contributionToMonthlyPace("600", "SEMIANNUAL").toString()).toBe("100");
    expect(contributionToMonthlyPace("1200", "ANNUAL").toString()).toBe("100");
  });
});

describe("estimateGoalCompletionDate", () => {
  it("proyecta la fecha sumando los meses necesarios al ritmo dado", () => {
    const date = estimateGoalCompletionDate("1000", "200", "2026-01-01");
    expect(date).toBe("2026-06-01"); // 1000/200 = 5 meses
  });

  it("redondea hacia arriba (no llega exacto a fin de mes, se ajusta al siguiente)", () => {
    const date = estimateGoalCompletionDate("1000", "300", "2026-01-01");
    expect(date).toBe("2026-05-01"); // ceil(1000/300) = 4 meses
  });

  it("meta ya cumplida: hoy mismo", () => {
    expect(estimateGoalCompletionDate("0", "200", "2026-01-01")).toBe("2026-01-01");
  });

  it("sin ritmo de ahorro (0), no se puede proyectar", () => {
    expect(estimateGoalCompletionDate("1000", "0", "2026-01-01")).toBeNull();
  });
});
