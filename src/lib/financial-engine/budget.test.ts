import { describe, expect, it } from "vitest";
import { calculateBudgetUsage } from "./budget";

describe("calculateBudgetUsage", () => {
  it.each([
    ["NORMAL", "500", "1000"],
    ["ATTENTION", "750", "1000"],
    ["RISK", "950", "1000"],
    ["EXCEEDED", "1200", "1000"],
  ] as const)("clasifica %s cuando gastado=%s de %s", (expectedStatus, spent, allocated) => {
    const result = calculateBudgetUsage(allocated, spent);
    expect(result.status).toBe(expectedStatus);
  });

  it("calcula el disponible como allocated - spent (puede ser negativo si se excede)", () => {
    const result = calculateBudgetUsage("1000", "1200");
    expect(result.available.toString()).toBe("-200");
  });

  it("no divide por cero cuando allocated es 0", () => {
    const result = calculateBudgetUsage("0", "50");
    expect(result.status).toBe("EXCEEDED");
    expect(result.percentageUsed.toString()).toBe("100");
  });
});
