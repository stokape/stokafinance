import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, LogOut, MessageCircle, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSubscriptionAccess } from "@/lib/access/subscription";
import { isAdminEmail } from "@/lib/admin/authorization";
import { buildSalesWhatsAppUrl, SALES_EMAIL, SALES_PLANS } from "@/lib/config/sales";
import { logoutAction } from "@/features/auth/actions/auth.actions";
import { LogoPhoto } from "@/components/brand/logo-photo";
import { WordmarkPhoto } from "@/components/brand/wordmark-photo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Estado de tu cuenta",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "long",
  timeZone: "America/Lima",
});

function formatPaidThrough(value: string | null): string | null {
  return value ? dateFormatter.format(new Date(`${value}T12:00:00-05:00`)) : null;
}

export default async function AccountStatusPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const access = resolveSubscriptionAccess({
    appMetadata: user.app_metadata,
    createdAt: user.created_at,
    isAdmin: isAdminEmail(user.email),
  });
  if (access.allowed) redirect("/dashboard");

  const copy =
    access.status === "expired"
      ? {
          title: "Tu plan necesita renovación",
          description: `Tu acceso venció${access.paidThrough ? ` el ${formatPaidThrough(access.paidThrough)}` : ""}. Confirma tu nuevo pago para reactivarlo.`,
        }
      : access.status === "suspended"
        ? {
            title: "Tu cuenta está pausada",
            description: "Escríbenos para revisar el estado del pago y recuperar el acceso.",
          }
        : {
            title: "Estamos esperando la activación",
            description: "Tu cuenta ya existe, pero todavía no tiene un pago confirmado. Envíanos el comprobante para activarla.",
          };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 flex flex-col items-center gap-2" aria-label="STOKA Finance, inicio">
          <LogoPhoto size={56} />
          <WordmarkPhoto width={200} />
        </Link>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="bg-accent px-6 py-5 text-accent-foreground sm:px-8">
            <ShieldCheck className="h-6 w-6" aria-hidden />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">{copy.title}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 opacity-80">{copy.description}</p>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Cuenta</dt>
                <dd className="mt-1 break-all font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="mt-1 font-medium">
                  {access.plan ? SALES_PLANS[access.plan].label : "Pendiente de confirmar"}
                </dd>
              </div>
              {access.paidThrough ? (
                <div className="sm:col-span-2">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" aria-hidden /> Vigencia registrada
                  </dt>
                  <dd className="mt-1 font-medium">Hasta el {formatPaidThrough(access.paidThrough)}</dd>
                </div>
              ) : null}
            </dl>

            <div className="rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
              Los pagos se coordinan por WhatsApp mediante <strong className="text-foreground">Yape o transferencia bancaria</strong>. La activación se realiza después de validar el comprobante.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={buildSalesWhatsAppUrl(access.plan ?? undefined)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" aria-hidden /> Contactar por WhatsApp
              </a>
              <a
                href={`mailto:${SALES_EMAIL}`}
                className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium hover:bg-muted"
              >
                {SALES_EMAIL}
              </a>
            </div>

            <form action={logoutAction} className="border-t border-border pt-5 text-center">
              <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
