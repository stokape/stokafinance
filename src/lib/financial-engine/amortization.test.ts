import { describe, expect, it } from "vitest";
import { generateAmortizationSchedule, generateInterestOnlySchedule } from "./amortization";
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

  it("con un monto de cuota manual y sin tasa, paga la cuota fija y la última absorbe el resto", () => {
    // 1200 / 350 por cuota: 3 cuotas de 350 (=1050) + 1 cuota final de 150 (1200-1050).
    // "0" y no "" — el caller real (LoansService) ya normaliza el rate vacío a "0"
    // antes de llamar acá; la función en sí exige un Decimal parseable.
    const schedule = generateAmortizationSchedule("1200", "0", 4, "2026-01-01", "350");
    expect(schedule.map((i) => i.totalPayment.toString())).toEqual(["350", "350", "350", "150"]);
    expect(schedule.every((i) => i.interest.toString() === "0")).toBe(true);
    const totalPrincipal = sumMoney(schedule.map((i) => i.principal));
    expect(totalPrincipal.toString()).toBe("1200");
  });

  it("un monto de cuota manual con tasa sigue calculando interés sobre saldo insoluto", () => {
    const schedule = generateAmortizationSchedule("10000", 24, 12, "2026-01-01", "1000");
    expect(schedule[0].totalPayment.toString()).toBe("1000");
    expect(schedule[0].interest.greaterThan(0)).toBe(true);
    expect(schedule[schedule.length - 1].remainingBalance.toString()).toBe("0");
  });
});

describe("generateInterestOnlySchedule", () => {
  it("cada cuota es sólo interés y la última agrega el capital completo", () => {
    // 3000 al 24% anual = 2%/mes → 60/mes de interés.
    const schedule = generateInterestOnlySchedule("3000", 24, 3, "2026-01-01");
    expect(schedule.map((i) => i.interest.toString())).toEqual(["60", "60", "60"]);
    expect(schedule.map((i) => i.principal.toString())).toEqual(["0", "0", "3000"]);
    expect(schedule[2].totalPayment.toString()).toBe("3060");
    expect(schedule[2].remainingBalance.toString()).toBe("0");
  });

  it("el saldo se mantiene constante (no baja) hasta la última cuota", () => {
    const schedule = generateInterestOnlySchedule("5000", 12, 4, "2026-01-01");
    expect(schedule[0].remainingBalance.toString()).toBe("5000");
    expect(schedule[1].remainingBalance.toString()).toBe("5000");
    expect(schedule[2].remainingBalance.toString()).toBe("5000");
    expect(schedule[3].remainingBalance.toString()).toBe("0");
  });

  it("con un monto de interés manual, lo usa tal cual sin necesitar una tasa", () => {
    const schedule = generateInterestOnlySchedule("2000", "", 2, "2026-01-01", "50");
    expect(schedule.map((i) => i.interest.toString())).toEqual(["50", "50"]);
    expect(schedule[1].totalPayment.toString()).toBe("2050");
  });

  it("devuelve un arreglo vacío si el número de cuotas es 0 o negativo", () => {
    expect(generateInterestOnlySchedule("1000", 10, 0, "2026-01-01")).toEqual([]);
  });
});
