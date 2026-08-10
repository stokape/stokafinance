import { describe, expect, it } from "vitest";
import { calculateAvailableToSpend } from "./safe-to-spend";

describe("calculateAvailableToSpend", () => {
  it("resta obligaciones, deuda, presupuesto reservado y ahorro mínimo del saldo + ingresos", () => {
    const result = calculateAvailableToSpend({
      liquidBalance: "5000",
      confirmedUpcomingIncome: "0",
      upcomingObligatoryPayments: "1200",
      upcomingDebtPayments: "850",
      reservedBudget: "600",
      minimumSavingsGoal: "500",
    });
    // 5000 - 1200 - 850 - 600 - 500 = 1850
    expect(result.safeToSpend.toString()).toBe("1850");
    expect(result.isDeficit).toBe(false);
  });

  it("nunca reporta un safeToSpend negativo (se trunca en 0) aunque marca el déficit", () => {
    const result = calculateAvailableToSpend({
      liquidBalance: "1000",
      confirmedUpcomingIncome: "0",
      upcomingObligatoryPayments: "2000",
      upcomingDebtPayments: "0",
      reservedBudget: "0",
      minimumSavingsGoal: "0",
    });
    expect(result.safeToSpend.toString()).toBe("0");
    expect(result.isDeficit).toBe(true);
    expect(result.rawAmount.toString()).toBe("-1000");
  });
});
