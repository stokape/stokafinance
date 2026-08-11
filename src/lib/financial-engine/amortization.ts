import Decimal from "decimal.js";
import { addMonths, formatISO } from "date-fns";
import { roundMoney, toMoney } from "@/lib/utils/money";

/**
 * Generador de tabla de amortización — sistema francés (cuota fija, interés
 * sobre saldo insoluto). Usado al crear un préstamo (§15) para proyectar
 * capital/interés de cada cuota desde el inicio, tal como exige la regla
 * crítica "préstamos deben distinguir capital e intereses cuando exista
 * información" (§58).
 */

export interface AmortizationInstallment {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  principal: Decimal;
  interest: Decimal;
  totalPayment: Decimal;
  remainingBalance: Decimal;
}

/**
 * @param principal Monto original del préstamo.
 * @param annualInterestRatePercentage Tasa de interés anual en porcentaje (ej. 24 = 24%/año). 0 = sin interés.
 * @param numberOfInstallments Número total de cuotas.
 * @param startDate Fecha de la primera cuota (YYYY-MM-DD).
 */
export function generateAmortizationSchedule(
  principal: string | number | Decimal,
  annualInterestRatePercentage: string | number | Decimal,
  numberOfInstallments: number,
  startDate: string,
): AmortizationInstallment[] {
  if (numberOfInstallments <= 0) return [];

  const originalPrincipal = toMoney(principal);
  const monthlyRate = toMoney(annualInterestRatePercentage).dividedBy(100).dividedBy(12);

  // Cuota fija (sistema francés): P * r / (1 - (1+r)^-n). Sin interés: división simple.
  const fixedPayment = monthlyRate.isZero()
    ? originalPrincipal.dividedBy(numberOfInstallments)
    : originalPrincipal
        .times(monthlyRate)
        .dividedBy(new Decimal(1).minus(new Decimal(1).plus(monthlyRate).pow(-numberOfInstallments)));

  const schedule: AmortizationInstallment[] = [];
  let remainingBalance = originalPrincipal;

  for (let i = 1; i <= numberOfInstallments; i += 1) {
    const interest = monthlyRate.isZero() ? new Decimal(0) : roundMoney(remainingBalance.times(monthlyRate));
    const isLastInstallment = i === numberOfInstallments;
    // La última cuota ajusta el capital para que el saldo cierre exactamente en 0
    // (evita arrastrar centavos de redondeo acumulados).
    const principalComponent = isLastInstallment ? remainingBalance : roundMoney(fixedPayment.minus(interest));
    const totalPayment = roundMoney(principalComponent.plus(interest));
    remainingBalance = roundMoney(remainingBalance.minus(principalComponent));

    schedule.push({
      installmentNumber: i,
      dueDate: formatISO(addMonths(new Date(`${startDate}T00:00:00`), i - 1), { representation: "date" }),
      principal: principalComponent,
      interest,
      totalPayment,
      remainingBalance: Decimal.max(remainingBalance, 0),
    });
  }

  return schedule;
}
