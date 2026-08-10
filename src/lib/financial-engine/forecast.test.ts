import { describe, expect, it } from "vitest";
import { forecastCashFlow } from "./forecast";
import type { ForecastEvent } from "./types";

describe("forecastCashFlow", () => {
  it("proyecta el saldo aplicando eventos futuros en orden cronológico", () => {
    const events: ForecastEvent[] = [
      { id: "e1", label: "Internet", date: "2026-08-15", amount: "-120", kind: "BILL" },
      { id: "e2", label: "Tarjeta", date: "2026-08-20", amount: "-850", kind: "CREDIT_CARD_STATEMENT" },
      { id: "e3", label: "Sueldo", date: "2026-08-30", amount: "6500", kind: "RECURRING_INCOME" },
    ];

    const result = forecastCashFlow("5000", events, "2026-08-01", 30);

    expect(result.startingBalance.toString()).toBe("5000");
    expect(result.endingBalance.toString()).toBe("10530");
  });

  it("detecta automáticamente los días donde el saldo proyectado es negativo", () => {
    const events: ForecastEvent[] = [{ id: "e1", label: "Alquiler", date: "2026-08-05", amount: "-2000", kind: "BILL" }];
    const result = forecastCashFlow("1000", events, "2026-08-01", 10);

    expect(result.negativeDates).toContain("2026-08-05");
    expect(result.lowestBalance.toString()).toBe("-1000");
  });

  it("sin eventos, el saldo proyectado se mantiene constante", () => {
    const result = forecastCashFlow("1000", [], "2026-08-01", 7);
    expect(result.endingBalance.toString()).toBe("1000");
    expect(result.negativeDates).toHaveLength(0);
  });
});
