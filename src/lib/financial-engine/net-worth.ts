import Decimal from "decimal.js";
import { toMoney } from "@/lib/utils/money";

/** NET WORTH = ASSETS - LIABILITIES. */
export function calculateNetWorth(
  totalAssets: Decimal | string | number,
  totalLiabilities: Decimal | string | number,
): Decimal {
  return toMoney(totalAssets).minus(toMoney(totalLiabilities));
}

/** % de crecimiento del patrimonio respecto a un snapshot anterior. */
export function calculateNetWorthGrowth(
  currentNetWorth: Decimal | string | number,
  previousNetWorth: Decimal | string | number,
): Decimal {
  const previous = toMoney(previousNetWorth);
  if (previous.isZero()) return new Decimal(0);
  return toMoney(currentNetWorth).minus(previous).dividedBy(previous.abs()).times(100);
}
