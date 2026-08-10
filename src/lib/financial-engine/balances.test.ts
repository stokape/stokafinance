import { describe, expect, it } from "vitest";
import {
  calculateAccountBalance,
  calculateCreditCardDebt,
  calculateCreditUtilization,
  calculateLoanBalance,
  calculateTotalBalance,
} from "./balances";
import type { LedgerEntryInput } from "./types";

describe("calculateAccountBalance", () => {
  it("suma el saldo inicial + entries del ledger de esa cuenta", () => {
    const entries: LedgerEntryInput[] = [
      { targetType: "ACCOUNT", targetId: "acc-1", amount: "500" }, // ingreso
      { targetType: "ACCOUNT", targetId: "acc-1", amount: "-100" }, // gasto
      { targetType: "ACCOUNT", targetId: "acc-2", amount: "9999" }, // otra cuenta, no debe sumar
    ];

    const balance = calculateAccountBalance({ id: "acc-1", initialBalance: "1000" }, entries);
    expect(balance.toString()).toBe("1400");
  });

  it("una transferencia entre cuentas propias mueve el saldo de origen a destino sin crear/perder dinero", () => {
    // Transferencia BCP -> BBVA de 500: BCP -500, BBVA +500 (regla crítica §58)
    const entries: LedgerEntryInput[] = [
      { targetType: "ACCOUNT", targetId: "bcp", amount: "-500" },
      { targetType: "ACCOUNT", targetId: "bbva", amount: "500" },
    ];

    const bcpBalance = calculateAccountBalance({ id: "bcp", initialBalance: "1000" }, entries);
    const bbvaBalance = calculateAccountBalance({ id: "bbva", initialBalance: "1000" }, entries);
    const total = calculateTotalBalance(
      [
        { id: "bcp", initialBalance: "1000", currency: "PEN", active: true },
        { id: "bbva", initialBalance: "1000", currency: "PEN", active: true },
      ],
      entries,
    );

    expect(bcpBalance.toString()).toBe("500");
    expect(bbvaBalance.toString()).toBe("1500");
    // El total consolidado no cambia: la transferencia no crea ni destruye dinero.
    expect(total.toString()).toBe("2000");
  });
});

describe("calculateTotalBalance", () => {
  it("excluye cuentas inactivas por defecto", () => {
    const entries: LedgerEntryInput[] = [];
    const total = calculateTotalBalance(
      [
        { id: "a", initialBalance: "100", currency: "PEN", active: true },
        { id: "b", initialBalance: "5000", currency: "PEN", active: false },
      ],
      entries,
    );
    expect(total.toString()).toBe("100");
  });
});

describe("compra y pago de tarjeta de crédito", () => {
  it("la compra sube la deuda de la tarjeta sin tocar ninguna cuenta bancaria", () => {
    const entries: LedgerEntryInput[] = [{ targetType: "CREDIT_CARD", targetId: "visa", amount: "200" }];
    expect(calculateCreditCardDebt("visa", entries).toString()).toBe("200");
  });

  it("el pago de tarjeta reduce la deuda y saca dinero de la cuenta, sin duplicar el gasto original", () => {
    const entries: LedgerEntryInput[] = [
      { targetType: "CREDIT_CARD", targetId: "visa", amount: "200" }, // compra
      { targetType: "ACCOUNT", targetId: "bcp", amount: "-200" }, // pago: sale de la cuenta
      { targetType: "CREDIT_CARD", targetId: "visa", amount: "-200" }, // pago: baja la deuda
    ];
    expect(calculateCreditCardDebt("visa", entries).toString()).toBe("0");
    expect(calculateAccountBalance({ id: "bcp", initialBalance: "1000" }, entries).toString()).toBe("800");
  });
});

describe("calculateCreditUtilization", () => {
  it("calcula el % de línea usada", () => {
    expect(calculateCreditUtilization("780", "1000").toString()).toBe("78");
  });

  it("devuelve 0 si el límite es 0 o inválido (evita división por cero)", () => {
    expect(calculateCreditUtilization("100", "0").toString()).toBe("0");
  });
});

describe("préstamos: desembolso y pago separando capital", () => {
  it("el desembolso sube el saldo del préstamo", () => {
    const entries: LedgerEntryInput[] = [{ targetType: "LOAN", targetId: "loan-1", amount: "5000" }];
    expect(calculateLoanBalance("loan-1", entries).toString()).toBe("5000");
  });

  it("el pago sólo reduce el préstamo por el capital, no por el interés", () => {
    // Cuota de 500: 420 capital + 80 interés. El ledger de LOAN sólo baja 420.
    const entries: LedgerEntryInput[] = [
      { targetType: "LOAN", targetId: "loan-1", amount: "5000" },
      { targetType: "LOAN", targetId: "loan-1", amount: "-420" },
    ];
    expect(calculateLoanBalance("loan-1", entries).toString()).toBe("4580");
  });
});
