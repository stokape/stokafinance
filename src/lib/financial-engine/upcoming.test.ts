import { describe, expect, it } from "vitest";
import { calculateSubscriptionCost, calculateUpcomingPayments } from "./upcoming";

describe("calculateUpcomingPayments (§17/§24)", () => {
  const today = "2026-08-10";

  it("clasifica un pago atrasado como OVERDUE", () => {
    const result = calculateUpcomingPayments(
      [{ id: "b1", label: "Alquiler", amount: "1200", dueDate: "2026-08-05", kind: "BILL" }],
      today,
      30,
    );
    expect(result[0].urgency).toBe("OVERDUE");
  });

  it("clasifica el mismo día como DUE_TODAY", () => {
    const result = calculateUpcomingPayments([{ id: "b1", label: "Luz", amount: "80", dueDate: today, kind: "BILL" }], today, 30);
    expect(result[0].urgency).toBe("DUE_TODAY");
  });

  it("clasifica el día siguiente como DUE_TOMORROW", () => {
    const result = calculateUpcomingPayments([{ id: "b1", label: "Agua", amount: "50", dueDate: "2026-08-11", kind: "BILL" }], today, 30);
    expect(result[0].urgency).toBe("DUE_TOMORROW");
  });

  it("clasifica dentro de 7 días como DUE_THIS_WEEK", () => {
    const result = calculateUpcomingPayments([{ id: "b1", label: "Internet", amount: "120", dueDate: "2026-08-15", kind: "BILL" }], today, 30);
    expect(result[0].urgency).toBe("DUE_THIS_WEEK");
  });

  it("clasifica más allá de 7 días como UPCOMING", () => {
    const result = calculateUpcomingPayments([{ id: "b1", label: "Seguro", amount: "300", dueDate: "2026-08-25", kind: "BILL" }], today, 30);
    expect(result[0].urgency).toBe("UPCOMING");
  });

  it("excluye pagos fuera del horizonte solicitado", () => {
    const result = calculateUpcomingPayments([{ id: "b1", label: "Anual", amount: "500", dueDate: "2026-12-01", kind: "BILL" }], today, 30);
    expect(result).toHaveLength(0);
  });

  it("siempre incluye los atrasados aunque el horizonte sea corto", () => {
    const result = calculateUpcomingPayments([{ id: "b1", label: "Vencido", amount: "200", dueDate: "2026-07-01", kind: "BILL" }], today, 7);
    expect(result).toHaveLength(1);
    expect(result[0].urgency).toBe("OVERDUE");
  });

  it("ordena por fecha de vencimiento ascendente", () => {
    const result = calculateUpcomingPayments(
      [
        { id: "b1", label: "Segundo", amount: "100", dueDate: "2026-08-20", kind: "BILL" },
        { id: "b2", label: "Primero", amount: "100", dueDate: "2026-08-12", kind: "BILL" },
      ],
      today,
      30,
    );
    expect(result.map((r) => r.label)).toEqual(["Primero", "Segundo"]);
  });
});

describe("calculateSubscriptionCost (§17)", () => {
  it("convierte cada frecuencia a su equivalente mensual y anualiza correctamente", () => {
    const result = calculateSubscriptionCost([
      { id: "s1", amount: "44.90", frequency: "MONTHLY", active: true },
      { id: "s2", amount: "120", frequency: "ANNUAL", active: true },
    ]);
    // 44.90 + 120/12=10 => 54.90 mensual
    expect(result.monthlyCost.toString()).toBe("54.9");
    expect(result.annualCost.toString()).toBe("658.8");
    expect(result.activeCount).toBe(2);
  });

  it("ignora suscripciones inactivas", () => {
    const result = calculateSubscriptionCost([
      { id: "s1", amount: "44.90", frequency: "MONTHLY", active: true },
      { id: "s2", amount: "999", frequency: "MONTHLY", active: false },
    ]);
    expect(result.activeCount).toBe(1);
    expect(result.monthlyCost.toString()).toBe("44.9");
  });
});
