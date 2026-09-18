import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Download, AlertTriangle, Bell } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { ResetDataDialog } from "@/features/settings/components/reset-data-dialog";
import { DeleteAccountDialog } from "@/features/settings/components/delete-account-dialog";
import { PushNotificationsToggle } from "@/features/push-notifications/components/push-notifications-toggle";
import { AppLockToggle } from "@/features/app-lock/components/app-lock-toggle";
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

  const hasPasswordIdentity = user.identities?.some((identity) => identity.provider === "email") ?? true;

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

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Pide Face ID, huella o Windows Hello antes de mostrar tus finanzas en este dispositivo — útil si compartes el
              teléfono o la compu. Es local a este navegador, no reemplaza tu contraseña.
            </p>
            <AppLockToggle userId={user.id} email={user.email ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notificaciones
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Avisos de facturas por vencer y suscripciones a punto de renovarse. Se activan por dispositivo/navegador.
          </p>
          <PushNotificationsToggle />
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
          <div className="border-t border-danger/20 pt-3">
            <p className="mb-3 text-sm text-muted-foreground">
              O elimina tu cuenta por completo — datos y login. Definitivo, no hay vuelta atrás.
            </p>
            <DeleteAccountDialog requiresPassword={hasPasswordIdentity} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
