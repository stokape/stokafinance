import { describe, expect, it } from "vitest";
import { calculateMonthlyExpenses, calculateMonthlyIncome, groupExpensesByCategory } from "./cashflow";
import type { TransactionForEngine } from "./types";

function tx(overrides: Partial<TransactionForEngine>): TransactionForEngine {
  return {
    id: "tx-1",
    type: "EXPENSE",
    amount: "100",
    categoryId: "cat-1",
    date: "2026-08-05",
    status: "CONFIRMED",
    deletedAt: null,
    ...overrides,
  };
}

describe("calculateMonthlyIncome", () => {
  it("una transferencia entre cuentas propias NO cuenta como ingreso", () => {
    const transactions = [
      tx({ id: "t1", type: "INCOME", amount: "6500" }),
      tx({ id: "t2", type: "TRANSFER", amount: "500" }),
    ];
    expect(calculateMonthlyIncome(transactions, 2026, 8).toString()).toBe("6500");
  });

  it("ignora transacciones PENDING, CANCELLED o soft-deleted", () => {
    const transactions = [
      tx({ id: "t1", type: "INCOME", amount: "100", status: "PENDING" }),
      tx({ id: "t2", type: "INCOME", amount: "200", status: "CANCELLED" }),
      tx({ id: "t3", type: "INCOME", amount: "300", deletedAt: "2026-08-06T00:00:00Z" }),
      tx({ id: "t4", type: "INCOME", amount: "400", status: "CONFIRMED" }),
    ];
    expect(calculateMonthlyIncome(transactions, 2026, 8).toString()).toBe("400");
  });

  it("filtra por mes/año", () => {
    const transactions = [
      tx({ id: "t1", type: "INCOME", amount: "100", date: "2026-07-31" }),
      tx({ id: "t2", type: "INCOME", amount: "200", date: "2026-08-01" }),
    ];
    expect(calculateMonthlyIncome(transactions, 2026, 8).toString()).toBe("200");
  });
});

describe("calculateMonthlyExpenses", () => {
  it("una transferencia entre cuentas propias NO cuenta como gasto", () => {
    const transactions = [
      tx({ id: "t1", type: "EXPENSE", amount: "100" }),
      tx({ id: "t2", type: "TRANSFER", amount: "5000" }),
    ];
    expect(calculateMonthlyExpenses(transactions, 2026, 8).toString()).toBe("100");
  });

  it("una compra con tarjeta SÍ cuenta como gasto en la fecha de compra", () => {
    const transactions = [tx({ id: "t1", type: "CARD_PURCHASE", amount: "300" })];
    expect(calculateMonthlyExpenses(transactions, 2026, 8).toString()).toBe("300");
  });

  it("el pago de la tarjeta NO se cuenta de nuevo como gasto (evita duplicar)", () => {
    const transactions = [
      tx({ id: "t1", type: "CARD_PURCHASE", amount: "300" }),
      tx({ id: "t2", type: "CARD_PAYMENT", amount: "300" }),
    ];
    expect(calculateMonthlyExpenses(transactions, 2026, 8).toString()).toBe("300");
  });

  it("en el pago de préstamo sólo el interés es gasto; el capital es amortización", () => {
    const transactions = [
      tx({ id: "t1", type: "LOAN_PAYMENT", amount: "500", interestAmount: "80" }),
    ];
    expect(calculateMonthlyExpenses(transactions, 2026, 8).toString()).toBe("80");
  });
});

describe("groupExpensesByCategory", () => {
  it("agrupa sólo EXPENSE y CARD_PURCHASE dentro del rango", () => {
    const transactions = [
      tx({ id: "t1", type: "EXPENSE", amount: "50", categoryId: "food", date: "2026-08-01" }),
      tx({ id: "t2", type: "EXPENSE", amount: "30", categoryId: "food", date: "2026-08-15" }),
      tx({ id: "t3", type: "CARD_PURCHASE", amount: "20", categoryId: "food", date: "2026-08-20" }),
      tx({ id: "t4", type: "TRANSFER", amount: "1000", categoryId: "food", date: "2026-08-10" }),
    ];
    const grouped = groupExpensesByCategory(transactions, "2026-08-01", "2026-08-31");
    expect(grouped.get("food")?.toString()).toBe("100");
  });
});
