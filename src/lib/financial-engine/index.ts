/**
 * Financial Engine — cálculos financieros puros de STOKA Finance.
 *
 * Reglas: sin I/O, sin Supabase, sin React. Toda función recibe datos ya
 * cargados y devuelve `Decimal` (nunca `number` para montos) o estructuras
 * tipadas. Ver docs/financial-engine.md para la referencia completa y las
 * reglas críticas cubiertas por tests.
 */
export * from "./types";
export * from "./balances";
export * from "./cashflow";
export * from "./savings";
export * from "./ratios";
export * from "./net-worth";
export * from "./budget";
export * from "./upcoming";
export * from "./forecast";
export * from "./safe-to-spend";
export * from "./health-score";
export * from "./amortization";
