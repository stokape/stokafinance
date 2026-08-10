import { describe, expect, it } from "vitest";
import { generateFinancialHealthScore } from "./health-score";

describe("generateFinancialHealthScore", () => {
  it("una situación financiera ideal puntúa cerca de 100 y VERY_HEALTHY", () => {
    const result = generateFinancialHealthScore({
      emergencyFundMonths: 6,
      savingsRatePercentage: 20,
      debtToIncomePercentage: 0,
      creditUtilizationPercentage: 0,
      budgetCompliancePercentage: 100,
      netWorthGrowthPercentage: 10,
    });
    expect(result.score).toBe(100);
    expect(result.rating).toBe("VERY_HEALTHY");
  });

  it("una situación financiera crítica puntúa cerca de 0 y RISK", () => {
    const result = generateFinancialHealthScore({
      emergencyFundMonths: 0,
      savingsRatePercentage: 0,
      debtToIncomePercentage: 40,
      creditUtilizationPercentage: 50,
      budgetCompliancePercentage: 0,
      netWorthGrowthPercentage: -10,
    });
    expect(result.score).toBe(0);
    expect(result.rating).toBe("RISK");
  });

  it("el score nunca sale del rango [0, 100] con valores fuera de escala", () => {
    const result = generateFinancialHealthScore({
      emergencyFundMonths: 999,
      savingsRatePercentage: 999,
      debtToIncomePercentage: -999,
      creditUtilizationPercentage: -999,
      budgetCompliancePercentage: 999,
      netWorthGrowthPercentage: 999,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("los pesos de los factores suman 1 (100%)", () => {
    const result = generateFinancialHealthScore({
      emergencyFundMonths: 3,
      savingsRatePercentage: 10,
      debtToIncomePercentage: 20,
      creditUtilizationPercentage: 25,
      budgetCompliancePercentage: 50,
      netWorthGrowthPercentage: 0,
    });
    const totalWeight = result.factors.reduce((acc, f) => acc + f.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);
  });
});
