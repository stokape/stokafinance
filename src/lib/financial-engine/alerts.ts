import { formatMoney, toMoney } from "@/lib/utils/money";

/**
 * Motor de alertas (§26): reglas determinísticas, nunca generadas por IA.
 * Recibe datos ya agregados por el service layer y produce mensajes
 * accionables. Cada regla es independiente y se puede activar/desactivar
 * sin afectar a las demás.
 */

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
}

export interface CategorySpendingComparison {
  categoryName: string;
  currentMonthAmount: string | number;
  averageLastThreeMonths: string | number;
}

export interface CreditCardUtilizationInput {
  cardName: string;
  utilizationPercentage: number;
  alertThreshold: number;
}

export interface BudgetOverageInput {
  categoryName: string;
  percentageUsed: number;
}

export interface SavingsRateTargetInput {
  targetPercentage: number;
  monthlyIncome: string | number;
}

export interface GoalSubscriptionSuggestion {
  goalName: string;
  subscriptionName: string;
  monthlySavingsAmount: string | number;
  monthsSaved: number;
}

export interface AlertsInput {
  categorySpending: CategorySpendingComparison[];
  creditCardUtilizations: CreditCardUtilizationInput[];
  upcomingPaymentsNext7Days: string | number;
  forecastNegativeDate: string | null;
  budgetOverages: BudgetOverageInput[];
  currentSavingsRate: number;
  previousSavingsRate: number;
  /** Regla determinística, no IA (§26): si tu tasa de ahorro está por debajo de una meta % (ej. 20%), cuánto más ahorrarías al llegar a ella. */
  savingsRateTarget?: SavingsRateTargetInput | null;
  /** Precalculado por el caller (cruza Metas + Suscripciones, fuera del alcance de este motor de reglas puro). */
  goalSubscriptionSuggestion?: GoalSubscriptionSuggestion | null;
}

/** Umbral por defecto: un aumento de gasto se alerta desde +20% vs. el promedio de 3 meses. */
const SPENDING_INCREASE_THRESHOLD = 20;

export function generateAlerts(input: AlertsInput): Alert[] {
  const alerts: Alert[] = [];

  for (const comparison of input.categorySpending) {
    const average = toMoney(comparison.averageLastThreeMonths);
    if (average.lessThanOrEqualTo(0)) continue;

    const current = toMoney(comparison.currentMonthAmount);
    const changePercentage = current.minus(average).dividedBy(average).times(100);
    if (changePercentage.greaterThanOrEqualTo(SPENDING_INCREASE_THRESHOLD)) {
      alerts.push({
        id: `spending-${comparison.categoryName}`,
        severity: "warning",
        message: `Gastaste ${changePercentage.toDecimalPlaces(0).toString()}% más en ${comparison.categoryName} que tu promedio de los últimos 3 meses.`,
      });
    }
  }

  for (const card of input.creditCardUtilizations) {
    if (card.utilizationPercentage >= card.alertThreshold) {
      alerts.push({
        id: `utilization-${card.cardName}`,
        severity: card.utilizationPercentage >= 100 ? "critical" : "warning",
        message: `Tu tarjeta ${card.cardName} está utilizando ${card.utilizationPercentage.toFixed(0)}% de la línea.`,
      });
    }
  }

  const upcoming = toMoney(input.upcomingPaymentsNext7Days);
  if (upcoming.greaterThan(0)) {
    alerts.push({
      id: "upcoming-payments",
      severity: "info",
      message: `Tienes ${formatMoney(upcoming)} en pagos durante los próximos 7 días.`,
    });
  }

  if (input.forecastNegativeDate) {
    alerts.push({
      id: "forecast-negative",
      severity: "critical",
      message: `Tu saldo proyectado será negativo el ${input.forecastNegativeDate}.`,
    });
  }

  for (const overage of input.budgetOverages) {
    alerts.push({
      id: `budget-${overage.categoryName}`,
      severity: "warning",
      message: `Estás excediendo tu presupuesto de ${overage.categoryName} (${overage.percentageUsed.toFixed(0)}%).`,
    });
  }

  if (input.previousSavingsRate > 0 && input.currentSavingsRate < input.previousSavingsRate) {
    alerts.push({
      id: "savings-rate-drop",
      severity: "info",
      message: "Tu tasa de ahorro cayó respecto al mes anterior.",
    });
  }

  if (input.savingsRateTarget && input.currentSavingsRate < input.savingsRateTarget.targetPercentage) {
    const income = toMoney(input.savingsRateTarget.monthlyIncome);
    if (income.greaterThan(0)) {
      const gapPercentage = input.savingsRateTarget.targetPercentage - input.currentSavingsRate;
      const additionalSavings = income.times(gapPercentage).dividedBy(100);
      if (additionalSavings.greaterThan(0)) {
        alerts.push({
          id: "savings-target-gap",
          severity: "info",
          message: `Estás ahorrando ${Math.max(input.currentSavingsRate, 0).toFixed(0)}% de tus ingresos. Si llegas al ${input.savingsRateTarget.targetPercentage}%, ahorrarías ${formatMoney(additionalSavings)} más al mes.`,
        });
      }
    }
  }

  if (input.goalSubscriptionSuggestion) {
    const s = input.goalSubscriptionSuggestion;
    alerts.push({
      id: "goal-subscription-suggestion",
      severity: "info",
      message: `Si cancelas "${s.subscriptionName}" (${formatMoney(s.monthlySavingsAmount)}/mes) y lo destinas a "${s.goalName}", llegarías ${s.monthsSaved} ${s.monthsSaved === 1 ? "mes" : "meses"} antes.`,
    });
  }

  return alerts;
}
