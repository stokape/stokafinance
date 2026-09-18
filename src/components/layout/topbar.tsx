import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils/cn";
import type { SubscriptionAccess } from "@/lib/access/subscription";

interface TopbarProps {
  fullName: string | null;
  email: string;
  isAdmin?: boolean;
  subscription?: SubscriptionAccess | null;
  quickAddSlot?: ReactNode;
}

export function Topbar({ fullName, email, isAdmin = false, subscription = null, quickAddSlot }: TopbarProps) {
  const showCounter = subscription?.daysRemaining !== null && subscription?.daysRemaining !== undefined;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-2 border-b border-border bg-card/80 px-4 backdrop-blur md:justify-end">
      <div className="flex items-center gap-2">
        {showCounter ? (
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium tabular-nums sm:flex",
              subscription.daysRemaining !== null && subscription.daysRemaining <= 7 && "bg-warning-bg text-warning",
            )}
            title={`Tu acceso vence el ${subscription.paidThrough ?? ""}`}
          >
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            {subscription.daysRemaining} {subscription.daysRemaining === 1 ? "día" : "días"}
          </span>
        ) : null}
        {quickAddSlot}
        <ThemeToggle />
        <UserMenu fullName={fullName} email={email} isAdmin={isAdmin} subscription={subscription} />
      </div>
    </header>
  );
}
