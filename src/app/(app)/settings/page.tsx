import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, CloudUpload } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutAction } from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, currency, timezone, monthly_income_estimate")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            currency={profile?.currency ?? "PEN"}
            timezone={profile?.timezone ?? "America/Lima"}
            monthlyIncomeEstimate={profile?.monthly_income_estimate ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Seguridad
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Cambia tu contraseña de acceso.</p>
          <ResetPasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <CloudUpload className="h-4 w-4" /> Seguridad y datos — Backups
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            El módulo de backups cifrados a Google Drive está planificado (Fase 9 del roadmap, ver
            docs/backup.md) y no está activo todavía. Ningún dato se respalda automáticamente por ahora
            — el respaldo real de la base de datos depende de la configuración de Supabase (ver
            docs/disaster-recovery.md).
          </p>
        </CardContent>
      </Card>

      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
