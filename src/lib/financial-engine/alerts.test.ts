import { describe, expect, it } from "vitest";
import { generateAlerts, type AlertsInput } from "./alerts";

function baseInput(overrides: Partial<AlertsInput> = {}): AlertsInput {
  return {
    categorySpending: [],
    creditCardUtilizations: [],
    upcomingPaymentsNext7Days: "0",
    forecastNegativeDate: null,
    budgetOverages: [],
    currentSavingsRate: 10,
    previousSavingsRate: 10,
    ...overrides,
  };
}

describe("generateAlerts (§26 — reglas determinísticas)", () => {
  it("alerta cuando el gasto de una categoría sube 20% o más vs. el promedio de 3 meses", () => {
    const alerts = generateAlerts(
      baseInput({ categorySpending: [{ categoryName: "Restaurantes", currentMonthAmount: "132", averageLastThreeMonths: "100" }] }),
    );
    expect(alerts.some((a) => a.id === "spending-Restaurantes")).toBe(true);
    expect(alerts[0].message).toContain("32%");
  });

  it("no alerta si el aumento es menor al umbral", () => {
    const alerts = generateAlerts(
      baseInput({ categorySpending: [{ categoryName: "Restaurantes", currentMonthAmount: "110", averageLastThreeMonths: "100" }] }),
    );
    expect(alerts).toHaveLength(0);
  });

  it("ignora categorías sin historial (promedio 0) para evitar división por cero", () => {
    const alerts = generateAlerts(
      baseInput({ categorySpending: [{ categoryName: "Nueva", currentMonthAmount: "500", averageLastThreeMonths: "0" }] }),
    );
    expect(alerts).toHaveLength(0);
  });

  it("alerta utilización de tarjeta al superar el umbral configurado", () => {
    const alerts = generateAlerts(baseInput({ creditCardUtilizations: [{ cardName: "BCP", utilizationPercentage: 78, alertThreshold: 80 }] }));
    expect(alerts).toHaveLength(0);

    const alerts2 = generateAlerts(baseInput({ creditCardUtilizations: [{ cardName: "BCP", utilizationPercentage: 85, alertThreshold: 80 }] }));
    expect(alerts2[0].message).toContain("BCP");
    expect(alerts2[0].severity).toBe("warning");
  });

  it("marca la utilización como crítica al llegar o superar el 100%", () => {
    const alerts = generateAlerts(baseInput({ creditCardUtilizations: [{ cardName: "BCP", utilizationPercentage: 100, alertThreshold: 80 }] }));
    expect(alerts[0].severity).toBe("critical");
  });

  it("alerta pagos próximos en 7 días sólo si el monto es mayor a 0", () => {
    expect(generateAlerts(baseInput({ upcomingPaymentsNext7Days: "0" }))).toHaveLength(0);
    const alerts = generateAlerts(baseInput({ upcomingPaymentsNext7Days: "1430" }));
    expect(alerts[0].message).toContain("1,430");
  });

  it("alerta crítica cuando el forecast detecta saldo negativo futuro", () => {
    const alerts = generateAlerts(baseInput({ forecastNegativeDate: "2026-08-24" }));
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("2026-08-24");
  });

  it("alerta presupuesto excedido por categoría", () => {
    const alerts = generateAlerts(baseInput({ budgetOverages: [{ categoryName: "Alimentación", percentageUsed: 112 }] }));
    expect(alerts[0].message).toContain("Alimentación");
  });

  it("alerta cuando la tasa de ahorro cae respecto al mes anterior", () => {
    const alerts = generateAlerts(baseInput({ currentSavingsRate: 5, previousSavingsRate: 15 }));
    expect(alerts.some((a) => a.id === "savings-rate-drop")).toBe(true);
  });

  it("no alerta caída de ahorro si subió o se mantuvo", () => {
    const alerts = generateAlerts(baseInput({ currentSavingsRate: 20, previousSavingsRate: 15 }));
    expect(alerts.some((a) => a.id === "savings-rate-drop")).toBe(false);
  });

  it("sin nada que alertar, devuelve un arreglo vacío", () => {
    expect(generateAlerts(baseInput())).toEqual([]);
  });
});
