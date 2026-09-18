import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";
import { QuickAddTransactionMenu } from "@/features/transactions/components/quick-add-transaction-menu";
import { AppLockGate } from "@/features/app-lock/components/app-lock-gate";
import { isAdminEmail } from "@/lib/admin/authorization";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return (
    <AppLockGate>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar
            fullName={profile?.full_name ?? null}
            email={user.email ?? ""}
            isAdmin={isAdminEmail(user.email)}
            quickAddSlot={<QuickAddTransactionMenu />}
          />
          <main className="flex-1 px-4 pb-20 pt-4 md:px-6 md:pb-6">{children}</main>
        </div>
        <MobileNav />
      </div>
    </AppLockGate>
  );
}
