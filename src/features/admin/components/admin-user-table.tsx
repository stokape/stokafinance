"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CircleAlert, Copy, Search, Settings2, Trash2, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import {
  deleteUserAsAdminAction,
  invitePaidUserAction,
  suspendUserSubscriptionAction,
  updateUserSubscriptionAction,
} from "@/features/admin/actions/admin-users.actions";
import type { AdminUserRow } from "@/features/admin/types/admin-user.types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { actionSuccess } from "@/types/action-result";
import { SALES_PLANS, type SalesPlan } from "@/lib/config/sales";
import type { PaymentMethod, SubscriptionStatus } from "@/lib/access/subscription";
import { cn } from "@/lib/utils/cn";

const dateFormatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "America/Lima" });
type DialogMode = "invite" | "manage" | "delete" | null;

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = value.length === 10 ? new Date(`${value}T12:00:00-05:00`) : new Date(value);
  return dateFormatter.format(date);
}

function providerLabel(provider: string): string {
  if (provider === "google") return "Google";
  if (provider === "email") return "Correo";
  return provider || "—";
}

function defaultPaidThrough(plan: SalesPlan): string {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).split("-").map(Number);
  const targetYear = plan === "annual" ? year + 1 : month === 12 ? year + 1 : year;
  const targetMonth = plan === "annual" ? month : month === 12 ? 1 : month + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function statusCopy(status: SubscriptionStatus, isAdmin: boolean) {
  if (isAdmin) return { label: "Administrador", className: "bg-accent text-accent-foreground" };
  if (status === "active") return { label: "Activo", className: "bg-success-bg text-success" };
  if (status === "legacy") return { label: "Activo anterior", className: "bg-accent text-accent-foreground" };
  if (status === "expired") return { label: "Vencido", className: "bg-danger-bg text-danger" };
  if (status === "suspended") return { label: "Suspendido", className: "bg-danger-bg text-danger" };
  return { label: "Pendiente", className: "bg-warning-bg text-warning" };
}

export function AdminUserTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [plan, setPlan] = useState<SalesPlan>("monthly");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("yape");
  const [paidThrough, setPaidThrough] = useState(defaultPaidThrough("monthly"));
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const [inviteState, inviteAction, inviting] = useActionState(invitePaidUserAction, actionSuccess({ inviteUrl: "" }));
  const [updateState, updateAction, updating] = useActionState(updateUserSubscriptionAction, actionSuccess(undefined));
  const [suspendState, suspendAction, suspending] = useActionState(suspendUserSubscriptionAction, actionSuccess(undefined));
  const [deleteState, deleteAction, deleting] = useActionState(deleteUserAsAdminAction, actionSuccess(undefined));
  const pending = inviting || updating || suspending || deleting;

  const finishAction = () => {
    setDialog(null);
    setSelected(null);
    setConfirmation("");
    router.refresh();
  };

  useActionFeedback(inviteState, {
    successMessage: "Cuenta y acceso creados.",
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl);
      router.refresh();
    },
  });
  useActionFeedback(updateState, { successMessage: "Plan y vigencia actualizados.", onSuccess: finishAction });
  useActionFeedback(suspendState, { successMessage: "Acceso suspendido sin borrar sus datos.", onSuccess: finishAction });
  useActionFeedback(deleteState, { successMessage: "Cuenta y datos eliminados definitivamente.", onSuccess: finishAction });

  const visibleUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) =>
      [user.email, user.fullName ?? "", user.provider, user.subscriptionStatus, user.plan ?? ""].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query, users]);

  const activeCount = users.filter((user) => user.isAdmin || user.subscriptionStatus === "active" || user.subscriptionStatus === "legacy").length;
  const expiringCount = users.filter((user) => user.daysRemaining !== null && user.daysRemaining <= 7).length;
  const attentionCount = users.filter((user) => ["pending", "expired", "suspended"].includes(user.subscriptionStatus)).length;

  const closeDialog = () => {
    if (pending) return;
    setDialog(null);
    setSelected(null);
    setConfirmation("");
    setInviteUrl(null);
  };

  const openInvite = () => {
    setPlan("monthly");
    setPaymentMethod("yape");
    setPaidThrough(defaultPaidThrough("monthly"));
    setInviteUrl(null);
    setDialog("invite");
  };

  const openManage = (user: AdminUserRow) => {
    const selectedPlan = user.plan ?? "monthly";
    setSelected(user);
    setPlan(selectedPlan);
    setPaymentMethod(user.paymentMethod ?? "yape");
    setPaidThrough(user.paidThrough ?? defaultPaidThrough(selectedPlan));
    setDialog("manage");
  };

  const changePlan = (value: SalesPlan, resetDate: boolean) => {
    setPlan(value);
    if (resetDate) setPaidThrough(defaultPaidThrough(value));
  };

  return (
    <>
      <div className="grid border-y border-border sm:grid-cols-3">
        <Metric icon={<UsersRound className="h-5 w-5 text-primary" />} value={activeCount} label="cuentas con acceso" className="sm:border-r sm:pr-5" />
        <Metric icon={<CalendarClock className="h-5 w-5 text-warning" />} value={expiringCount} label="vencen en 7 días" className="border-t sm:border-r sm:border-t-0 sm:px-5" />
        <Metric icon={<CircleAlert className="h-5 w-5 text-danger" />} value={attentionCount} label="requieren atención" className="border-t sm:border-t-0 sm:pl-5" />
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Clientes y vigencias</h2>
          <p className="mt-1 text-sm text-muted-foreground">Activa únicamente después de verificar el pago.</p>
        </div>
        <Button type="button" onClick={openInvite}><UserPlus className="h-4 w-4" aria-hidden /> Invitar cliente pagado</Button>
      </div>

      <div className="relative mt-4 w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar por nombre, correo o estado" aria-label="Buscar cuenta" />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_0.7fr_0.8fr_0.8fr_auto] gap-4 border-b border-border bg-muted/60 px-5 py-3 text-xs font-medium text-muted-foreground md:grid">
          <span>Cliente</span><span>Plan</span><span>Acceso</span><span>Vigencia</span><span className="sr-only">Acciones</span>
        </div>
        {visibleUsers.length ? (
          <div className="divide-y divide-border">
            {visibleUsers.map((user) => <UserRow key={user.id} user={user} onManage={openManage} />)}
          </div>
        ) : (
          <div className="px-5 py-14 text-center"><p className="text-sm font-medium">No encontramos ninguna cuenta</p><p className="mt-1 text-sm text-muted-foreground">Prueba con otro nombre, correo o estado.</p></div>
        )}
      </div>

      <Dialog open={dialog === "invite"} onClose={closeDialog} title="Invitar cliente pagado" description="Crea el acceso y genera un enlace privado para definir su contraseña.">
        {inviteUrl ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-success-bg p-3 text-sm leading-5 text-success">La cuenta ya está activa. Envía este enlace privado al cliente por WhatsApp para que defina su contraseña.</div>
            <div className="space-y-2">
              <Label htmlFor="generated-invite-url">Enlace de acceso de un solo uso</Label>
              <div className="flex gap-2">
                <Input id="generated-invite-url" value={inviteUrl} readOnly className="min-w-0" />
                <Button type="button" variant="outline" size="icon" aria-label="Copiar enlace" onClick={async () => { await navigator.clipboard.writeText(inviteUrl); toast.success("Enlace copiado."); }}><Copy className="h-4 w-4" aria-hidden /></Button>
              </div>
            </div>
            <Button type="button" className="w-full" onClick={closeDialog}>Listo</Button>
          </div>
        ) : (
        <form action={inviteAction} className="space-y-4" noValidate>
          <div className="space-y-2"><Label htmlFor="invite-name">Nombre completo</Label><Input id="invite-name" name="fullName" autoComplete="name" maxLength={100} required /></div>
          <div className="space-y-2"><Label htmlFor="invite-email">Correo del cliente</Label><Input id="invite-email" name="email" type="email" autoComplete="email" required /></div>
          <SubscriptionFields prefix="invite" plan={plan} paymentMethod={paymentMethod} paidThrough={paidThrough} onPlanChange={(value) => changePlan(value, true)} onPaymentMethodChange={setPaymentMethod} onPaidThroughChange={setPaidThrough} />
          <div className="rounded-lg bg-warning-bg p-3 text-sm leading-5 text-warning">Confirma el comprobante antes de enviar. La invitación concede acceso inmediatamente hasta la fecha indicada.</div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={closeDialog} disabled={pending}>Cancelar</Button><Button type="submit" isLoading={inviting}>Crear cuenta y enlace</Button></div>
        </form>
        )}
      </Dialog>

      <Dialog open={dialog === "manage"} onClose={closeDialog} title="Gestionar plan y acceso" description={selected?.email}>
        {selected ? (
          <div className="space-y-5">
            <form action={updateAction} className="space-y-4" noValidate>
              <input type="hidden" name="userId" value={selected.id} /><input type="hidden" name="targetEmail" value={selected.email} />
              <SubscriptionFields prefix="manage" plan={plan} paymentMethod={paymentMethod} paidThrough={paidThrough} onPlanChange={(value) => changePlan(value, false)} onPaymentMethodChange={setPaymentMethod} onPaidThroughChange={setPaidThrough} />
              <Button type="submit" className="w-full" isLoading={updating}>Activar o renovar acceso</Button>
            </form>
            <div className="grid gap-2 border-t border-border pt-5 sm:grid-cols-2">
              <form action={suspendAction}><input type="hidden" name="userId" value={selected.id} /><input type="hidden" name="targetEmail" value={selected.email} /><Button type="submit" variant="outline" className="w-full" isLoading={suspending}>Suspender acceso</Button></form>
              <Button type="button" variant="ghost" className="text-danger hover:bg-danger-bg" onClick={() => setDialog("delete")} disabled={pending}><Trash2 className="h-4 w-4" aria-hidden /> Eliminar definitivamente</Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog open={dialog === "delete"} onClose={closeDialog} title="Eliminar cuenta definitivamente" description="Borra el acceso y todos los datos financieros. No se puede deshacer.">
        {selected ? (
          <form action={deleteAction} className="space-y-4">
            <input type="hidden" name="userId" value={selected.id} /><input type="hidden" name="targetEmail" value={selected.email} />
            <div className="rounded-lg bg-danger-bg p-3 text-sm text-danger">Vas a eliminar <strong className="break-all">{selected.email}</strong>. Para falta de pago, usa Suspender acceso.</div>
            <div className="space-y-2"><Label htmlFor="delete-user-confirmation">Escribe el correo para confirmar</Label><Input id="delete-user-confirmation" name="confirmation" type="email" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={selected.email} autoComplete="off" required /></div>
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setDialog("manage")} disabled={pending}>Volver</Button><Button type="submit" variant="danger" isLoading={deleting} disabled={confirmation.toLowerCase() !== selected.email.toLowerCase()}>Eliminar cuenta y datos</Button></div>
          </form>
        ) : null}
      </Dialog>
    </>
  );
}

function Metric({ icon, value, label, className }: { icon: React.ReactNode; value: number; label: string; className?: string }) {
  return <div className={cn("flex items-center gap-3 py-4", className)}>{icon}<div><strong className="text-xl tabular-nums">{value}</strong><p className="text-xs text-muted-foreground">{label}</p></div></div>;
}

function UserRow({ user, onManage }: { user: AdminUserRow; onManage: (user: AdminUserRow) => void }) {
  const status = statusCopy(user.subscriptionStatus, user.isAdmin);
  return (
    <article className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_0.7fr_0.8fr_0.8fr_auto] md:items-center md:px-5">
      <div className="min-w-0"><p className="truncate text-sm font-medium">{user.fullName || "Sin nombre"}</p><p className="mt-1 truncate text-xs text-muted-foreground">{user.email} · {providerLabel(user.provider)}</p></div>
      <div className="flex items-center justify-between md:block"><span className="text-xs text-muted-foreground md:hidden">Plan</span><p className="text-sm">{user.isAdmin ? "—" : user.plan ? SALES_PLANS[user.plan].label : "Sin asignar"}</p></div>
      <div className="flex items-center justify-between md:block"><span className="text-xs text-muted-foreground md:hidden">Acceso</span><span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-medium", status.className)}>{status.label}</span></div>
      <div className="flex items-center justify-between md:block"><span className="text-xs text-muted-foreground md:hidden">Vigencia</span><div><p className="text-sm tabular-nums">{formatDate(user.paidThrough)}</p>{user.daysRemaining !== null ? <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{user.daysRemaining} {user.daysRemaining === 1 ? "día" : "días"}</p> : null}</div></div>
      <Button type="button" variant="outline" size="sm" disabled={user.isAdmin} onClick={() => onManage(user)} className="justify-self-start md:justify-self-end" aria-label={`Gestionar cuenta ${user.email}`}><Settings2 className="h-4 w-4" aria-hidden /> Gestionar</Button>
    </article>
  );
}

interface SubscriptionFieldsProps {
  prefix: string;
  plan: SalesPlan;
  paymentMethod: PaymentMethod;
  paidThrough: string;
  onPlanChange: (value: SalesPlan) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onPaidThroughChange: (value: string) => void;
}

function SubscriptionFields({ prefix, plan, paymentMethod, paidThrough, onPlanChange, onPaymentMethodChange, onPaidThroughChange }: SubscriptionFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor={`${prefix}-plan`}>Plan contratado</Label><Select id={`${prefix}-plan`} name="plan" value={plan} onChange={(event) => onPlanChange(event.target.value as SalesPlan)}><option value="monthly">Mensual · S/24.90</option><option value="annual">Anual · S/199</option></Select></div>
      <div className="space-y-2"><Label htmlFor={`${prefix}-payment`}>Medio de pago</Label><Select id={`${prefix}-payment`} name="paymentMethod" value={paymentMethod} onChange={(event) => onPaymentMethodChange(event.target.value as PaymentMethod)}><option value="yape">Yape</option><option value="transfer">Transferencia</option></Select></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor={`${prefix}-paid-through`}>Acceso vigente hasta</Label><Input id={`${prefix}-paid-through`} name="paidThrough" type="date" value={paidThrough} onChange={(event) => onPaidThroughChange(event.target.value)} required /><p className="text-xs leading-5 text-muted-foreground">Al terminar esta fecha, el acceso se bloquea automáticamente sin borrar datos.</p></div>
    </div>
  );
}
