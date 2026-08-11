import { AlertTriangle, CalendarClock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BILL_URGENCY_LABELS } from "@/features/bills/types/bill.types";
import type { UpcomingPaymentUrgency } from "@/lib/financial-engine";

const STYLES: Record<UpcomingPaymentUrgency, { className: string; icon: typeof AlertTriangle }> = {
  OVERDUE: { className: "text-danger bg-danger-bg", icon: AlertTriangle },
  DUE_TODAY: { className: "text-danger bg-danger-bg", icon: CalendarClock },
  DUE_TOMORROW: { className: "text-warning bg-warning-bg", icon: CalendarClock },
  DUE_THIS_WEEK: { className: "text-warning bg-warning-bg", icon: CalendarDays },
  UPCOMING: { className: "text-muted-foreground bg-muted", icon: CalendarDays },
};

export function BillUrgencyBadge({ urgency }: { urgency: UpcomingPaymentUrgency }) {
  const { className, icon: Icon } = STYLES[urgency];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      <Icon className="h-3 w-3" /> {BILL_URGENCY_LABELS[urgency]}
    </span>
  );
}
