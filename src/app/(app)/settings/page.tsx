import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, CloudUpload, Download, AlertTriangle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { ResetDataDialog } from "@/features/settings/components/reset-data-dialog";
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

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Tus datos
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Descarga una copia completa de todo lo que tienes registrado en STOKA Finance (cuentas, transacciones, tarjetas,
            préstamos, metas, suscripciones, auditoría) en un solo archivo JSON.
          </p>
          <a
            href="/settings/export"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-transparent px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> Descargar mis datos (JSON)
          </a>
        </CardContent>
      </Card>

      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Cerrar sesión
        </Button>
      </form>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-4 w-4" /> Zona de peligro
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Borra todos tus datos financieros y empieza de cero, sin perder tu cuenta ni tener que registrarte de nuevo.
          </p>
          <ResetDataDialog />
        </CardContent>
      </Card>
    </div>
  );
}
