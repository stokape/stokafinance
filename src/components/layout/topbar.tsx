import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

interface TopbarProps {
  fullName: string | null;
  email: string;
  isAdmin?: boolean;
  quickAddSlot?: ReactNode;
}

export function Topbar({ fullName, email, isAdmin = false, quickAddSlot }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-2 border-b border-border bg-card/80 px-4 backdrop-blur md:justify-end">
      <div className="flex items-center gap-2">
        {quickAddSlot}
        <ThemeToggle />
        <UserMenu fullName={fullName} email={email} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
