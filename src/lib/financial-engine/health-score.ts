import type { FinancialHealthFactor, FinancialHealthInputs, FinancialHealthScoreResult } from "./types";

/**
 * Metodología del Financial Health Score (§27) — NO es asesoría financiera
 * profesional, es un indicador orientativo determinístico (nunca calculado
 * por un LLM). Cada factor se normaliza a 0-100 y se pondera:
 *
 *  factor                    peso   0 pts cuando...      100 pts cuando...
 *  ─────────────────────────────────────────────────────────────────────
 *  Fondo de emergencia        20%   0 meses               ≥ 6 meses
 *  Tasa de ahorro              20%   ≤ 0%                  ≥ 20%
 *  Deuda / Ingreso             20%   ≥ 40%                 0%
 *  Utilización de tarjetas     15%   ≥ 50%                 0%
 *  Cumplimiento de presupuesto 15%   0% cumplido            100% cumplido
 *  Crecimiento de patrimonio   10%   ≤ -10%                 ≥ 10%
 *
 * score = Σ (factor_score * peso). Rating: 0-39 RISK · 40-59 ATTENTION ·
 * 60-79 HEALTHY · 80-100 VERY_HEALTHY.
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Interpola linealmente `value` entre [from, to] hacia un puntaje [0,100]. */
function linearScore(value: number, from: number, to: number): number {
  if (from === to) return 0;
  const t = (value - from) / (to - from);
  return clamp(t, 0, 1) * 100;
}

const WEIGHTS: Record<keyof FinancialHealthInputs, number> = {
  emergencyFundMonths: 0.2,
  savingsRatePercentage: 0.2,
  debtToIncomePercentage: 0.2,
  creditUtilizationPercentage: 0.15,
  budgetCompliancePercentage: 0.15,
  netWorthGrowthPercentage: 0.1,
};

const LABELS: Record<keyof FinancialHealthInputs, string> = {
  emergencyFundMonths: "Fondo de emergencia",
  savingsRatePercentage: "Tasa de ahorro",
  debtToIncomePercentage: "Deuda / Ingreso",
  creditUtilizationPercentage: "Utilización de tarjetas",
  budgetCompliancePercentage: "Cumplimiento de presupuesto",
  netWorthGrowthPercentage: "Crecimiento de patrimonio",
};

function scoreFactor(key: keyof FinancialHealthInputs, inputs: FinancialHealthInputs): number {
  switch (key) {
    case "emergencyFundMonths":
      return linearScore(inputs.emergencyFundMonths, 0, 6);
    case "savingsRatePercentage":
      return linearScore(inputs.savingsRatePercentage, 0, 20);
    case "debtToIncomePercentage":
      return linearScore(inputs.debtToIncomePercentage, 40, 0); // invertido: menos deuda, más puntos
    case "creditUtilizationPercentage":
      return linearScore(inputs.creditUtilizationPercentage, 50, 0); // invertido
    case "budgetCompliancePercentage":
      return linearScore(inputs.budgetCompliancePercentage, 0, 100);
    case "netWorthGrowthPercentage":
      return linearScore(inputs.netWorthGrowthPercentage, -10, 10);
  }
}

function ratingFor(score: number): FinancialHealthScoreResult["rating"] {
  if (score < 40) return "RISK";
  if (score < 60) return "ATTENTION";
  if (score < 80) return "HEALTHY";
  return "VERY_HEALTHY";
}

export function generateFinancialHealthScore(inputs: FinancialHealthInputs): FinancialHealthScoreResult {
  const factors: FinancialHealthFactor[] = (Object.keys(WEIGHTS) as (keyof FinancialHealthInputs)[]).map((key) => {
    const score = scoreFactor(key, inputs);
    const weight = WEIGHTS[key];
    return { key, label: LABELS[key], score, weight, contribution: score * weight };
  });

  const totalScore = factors.reduce((acc, f) => acc + f.contribution, 0);
  const score = Math.round(clamp(totalScore, 0, 100));

  return { score, rating: ratingFor(score), factors };
}
