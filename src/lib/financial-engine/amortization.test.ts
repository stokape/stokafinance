import { describe, expect, it } from "vitest";
import { generateAmortizationSchedule } from "./amortization";
import { sumMoney } from "@/lib/utils/money";

describe("generateAmortizationSchedule", () => {
  it("sin interés, divide el capital en partes iguales", () => {
    const schedule = generateAmortizationSchedule("1200", 0, 12, "2026-01-01");
    expect(schedule).toHaveLength(12);
    expect(schedule[0].principal.toString()).toBe("100");
    expect(schedule[0].interest.toString()).toBe("0");
    expect(schedule[0].totalPayment.toString()).toBe("100");
    expect(schedule[11].remainingBalance.toString()).toBe("0");
  });

  it("la suma de los componentes de capital de todas las cuotas es igual al monto original", () => {
    const schedule = generateAmortizationSchedule("10000", 24, 12, "2026-01-01");
    const totalPrincipal = sumMoney(schedule.map((i) => i.principal));
    expect(totalPrincipal.toString()).toBe("10000");
  });

  it("el saldo llega exactamente a 0 en la última cuota (ajuste de redondeo)", () => {
    const schedule = generateAmortizationSchedule("3333.33", 18.5, 7, "2026-01-01");
    expect(schedule[schedule.length - 1].remainingBalance.toString()).toBe("0");
  });

  it("con interés, el saldo insoluto decrece de forma monotónica", () => {
    const schedule = generateAmortizationSchedule("5000", 30, 6, "2026-01-01");
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i].remainingBalance.lessThanOrEqualTo(schedule[i - 1].remainingBalance)).toBe(true);
    }
  });

  it("el interés de la primera cuota es mayor que el de la última (saldo insoluto decrece)", () => {
    const schedule = generateAmortizationSchedule("10000", 24, 12, "2026-01-01");
    expect(schedule[0].interest.greaterThan(schedule[11].interest)).toBe(true);
  });

  it("las fechas de vencimiento avanzan un mes por cuota", () => {
    const schedule = generateAmortizationSchedule("1200", 0, 3, "2026-01-15");
    expect(schedule.map((i) => i.dueDate)).toEqual(["2026-01-15", "2026-02-15", "2026-03-15"]);
  });

  it("devuelve un arreglo vacío si el número de cuotas es 0 o negativo", () => {
    expect(generateAmortizationSchedule("1000", 10, 0, "2026-01-01")).toEqual([]);
  });
});
