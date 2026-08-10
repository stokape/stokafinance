import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Configura tu cuenta" };

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="text-lg font-semibold">Configuremos tu cuenta</h1>
          <p className="text-sm text-muted-foreground">Esto toma menos de un minuto.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <OnboardingForm defaultFullName={profile?.full_name ?? ""} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
