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
  manualInstallmentAmount?: string | number | Decimal,
): AmortizationInstallment[] {
  if (numberOfInstallments <= 0) return [];

  const originalPrincipal = toMoney(principal);
  const monthlyRate = toMoney(annualInterestRatePercentage).dividedBy(100).dividedBy(12);

  // Cuota fija (sistema francés): P * r / (1 - (1+r)^-n). Sin interés: división simple.
  // Si el usuario ya sabe cuánto paga cada mes (manualInstallmentAmount, típico de
  // préstamos informales sin una tasa "oficial"), se usa tal cual en vez de
  // derivarla de la tasa — el interés de cada cuota sigue calculándose sobre el
  // saldo insoluto si hay tasa, o queda en 0 (100% capital) si no la hay.
  const fixedPayment =
    manualInstallmentAmount !== undefined && manualInstallmentAmount !== ""
      ? toMoney(manualInstallmentAmount)
      : monthlyRate.isZero()
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

/**
 * Calendario "solo interés" (bullet/interest-only): el capital NO baja
 * período a período — se paga el mismo interés cada cuota (sobre el
 * capital original completo) y recién en la última cuota se agrega el
 * capital entero de una sola vez. Típico de préstamos informales o entre
 * familiares, donde se acuerda "pago S/X de interés cada mes y el capital
 * lo devuelvo al final", a diferencia del sistema francés (cuota fija que
 * ya va amortizando capital desde la primera cuota).
 *
 * Si `manualInstallmentAmount` viene informado, se usa tal cual como el
 * interés de cada cuota (el usuario ya sabe cuánto paga, sin necesidad de
 * declarar una tasa) — si no, se calcula desde `annualInterestRatePercentage`.
 * Debe venir al menos uno de los dos, o todas las cuotas quedarían en 0.
 */
export function generateInterestOnlySchedule(
  principal: string | number | Decimal,
  annualInterestRatePercentage: string | number | Decimal,
  numberOfInstallments: number,
  startDate: string,
  manualInstallmentAmount?: string | number | Decimal,
): AmortizationInstallment[] {
  if (numberOfInstallments <= 0) return [];

  const originalPrincipal = toMoney(principal);
  const monthlyRate = toMoney(annualInterestRatePercentage || 0).dividedBy(100).dividedBy(12);
  const interestPerInstallment =
    manualInstallmentAmount !== undefined && manualInstallmentAmount !== ""
      ? toMoney(manualInstallmentAmount)
      : roundMoney(originalPrincipal.times(monthlyRate));

  const schedule: AmortizationInstallment[] = [];

  for (let i = 1; i <= numberOfInstallments; i += 1) {
    const isLastInstallment = i === numberOfInstallments;
    const principalComponent = isLastInstallment ? originalPrincipal : new Decimal(0);
    const totalPayment = roundMoney(principalComponent.plus(interestPerInstallment));

    schedule.push({
      installmentNumber: i,
      dueDate: formatISO(addMonths(new Date(`${startDate}T00:00:00`), i - 1), { representation: "date" }),
      principal: principalComponent,
      interest: interestPerInstallment,
      totalPayment,
      remainingBalance: isLastInstallment ? new Decimal(0) : originalPrincipal,
    });
  }

  return schedule;
}
