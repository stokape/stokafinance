import Decimal from "decimal.js";
import { toMoney } from "@/lib/utils/money";
import type { BudgetUsageResult } from "./types";

/**
 * Estados de consumo del presupuesto (§16): se evita depender sólo del
 * color — cada estado tiene texto/ícono asociado en la UI.
 *   0–70%   → NORMAL
 *   70–90%  → ATTENTION
 *   90–100% → RISK
 *   >100%   → EXCEEDED
 */
export function calculateBudgetUsage(
  allocated: Decimal | string | number,
  spent: Decimal | string | number,
): BudgetUsageResult {
  const allocatedAmount = toMoney(allocated);
  const spentAmount = toMoney(spent);
  const available = allocatedAmount.minus(spentAmount);
  const noBudgetAllocated = allocatedAmount.lessThanOrEqualTo(0);
  const percentageUsed = noBudgetAllocated
    ? new Decimal(spentAmount.greaterThan(0) ? 100 : 0)
    : spentAmount.dividedBy(allocatedAmount).times(100);

  let status: BudgetUsageResult["status"];
  if ((noBudgetAllocated && spentAmount.greaterThan(0)) || percentageUsed.greaterThan(100)) status = "EXCEEDED";
  else if (percentageUsed.greaterThanOrEqualTo(90)) status = "RISK";
  else if (percentageUsed.greaterThanOrEqualTo(70)) status = "ATTENTION";
  else status = "NORMAL";

  return { allocated: allocatedAmount, spent: spentAmount, available, percentageUsed, status };
}
