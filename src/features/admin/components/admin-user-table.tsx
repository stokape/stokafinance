"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Trash2, UserRound, UsersRound } from "lucide-react";
import { deleteUserAsAdminAction } from "@/features/admin/actions/admin-users.actions";
import type { AdminUserRow } from "@/features/admin/types/admin-user.types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { actionSuccess } from "@/types/action-result";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeZone: "America/Lima",
});

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "Nunca";
}

function providerLabel(provider: string): string {
  if (provider === "google") return "Google";
  if (provider === "email") return "Correo";
  return provider || "—";
}

export function AdminUserTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction, pending] = useActionState(deleteUserAsAdminAction, actionSuccess(undefined));

  useActionFeedback(state, {
    successMessage: "Cuenta y datos eliminados definitivamente.",
    onSuccess: () => {
      setSelected(null);
      setConfirmation("");
      router.refresh();
    },
  });

  const visibleUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) =>
      [user.email, user.fullName ?? "", user.provider].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query, users]);

  const confirmedCount = users.filter((user) => user.emailConfirmed).length;
  const activeCount = users.filter((user) => user.lastSignInAt).length;

  const closeDialog = () => {
    if (pending) return;
    setSelected(null);
    setConfirmation("");
  };

  return (
    <>
      <div className="grid border-y border-border sm:grid-cols-3">
        <div className="flex items-center gap-3 py-4 sm:border-r sm:pr-5">
          <UsersRound className="h-5 w-5 text-primary" aria-hidden />
          <div><strong className="text-xl tabular-nums">{users.length}</strong><p className="text-xs text-muted-foreground">cuentas registradas</p></div>
        </div>
        <div className="flex items-center gap-3 border-t border-border py-4 sm:border-r sm:border-t-0 sm:px-5">
          <ShieldCheck className="h-5 w-5 text-success" aria-hidden />
          <div><strong className="text-xl tabular-nums">{confirmedCount}</strong><p className="text-xs text-muted-foreground">correos confirmados</p></div>
        </div>
        <div className="flex items-center gap-3 border-t border-border py-4 sm:border-t-0 sm:pl-5">
          <UserRound className="h-5 w-5 text-primary" aria-hidden />
          <div><strong className="text-xl tabular-nums">{activeCount}</strong><p className="text-xs text-muted-foreground">con algún ingreso</p></div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Cuentas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Busca por nombre, correo o proveedor de acceso.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Buscar cuenta"
            aria-label="Buscar cuenta"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden grid-cols-[minmax(0,1.6fr)_0.6fr_0.8fr_0.8fr_auto] gap-4 border-b border-border bg-muted/60 px-5 py-3 text-xs font-medium text-muted-foreground md:grid">
          <span>Usuario</span><span>Acceso</span><span>Creada</span><span>Último ingreso</span><span className="sr-only">Acciones</span>
        </div>

        {visibleUsers.length ? (
          <div className="divide-y divide-border">
            {visibleUsers.map((user) => (
              <article key={user.id} className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.6fr)_0.6fr_0.8fr_0.8fr_auto] md:items-center md:px-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{user.fullName || "Sin nombre"}</p>
                    {user.isCurrentAdmin ? <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">Administrador</span> : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center justify-between md:block">
                  <span className="text-xs text-muted-foreground md:hidden">Acceso</span>
                  <div><p className="text-sm">{providerLabel(user.provider)}</p><p className="text-xs text-muted-foreground">{user.emailConfirmed ? "Confirmado" : "Sin confirmar"}</p></div>
                </div>
                <div className="flex items-center justify-between md:block">
                  <span className="text-xs text-muted-foreground md:hidden">Creada</span>
                  <p className="text-sm tabular-nums">{formatDate(user.createdAt)}</p>
                </div>
                <div className="flex items-center justify-between md:block">
                  <span className="text-xs text-muted-foreground md:hidden">Último ingreso</span>
                  <p className="text-sm tabular-nums">{formatDate(user.lastSignInAt)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={user.isCurrentAdmin}
                  onClick={() => setSelected(user)}
                  className="justify-self-start text-danger hover:bg-danger-bg md:justify-self-end"
                  aria-label={`Eliminar cuenta ${user.email}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Eliminar
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium">No encontramos ninguna cuenta</p>
            <p className="mt-1 text-sm text-muted-foreground">Prueba con otro nombre o correo.</p>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(selected)}
        onClose={closeDialog}
        title="Eliminar cuenta definitivamente"
        description="Esta acción borra el acceso y todos los datos financieros. No se puede deshacer."
      >
        {selected ? (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="userId" value={selected.id} />
            <input type="hidden" name="targetEmail" value={selected.email} />
            <div className="rounded-lg bg-danger-bg p-3 text-sm text-danger">
              Vas a eliminar <strong>{selected.email}</strong>. Para falta de pago, suspende la cuenta en vez de eliminarla.
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-user-confirmation">Escribe el correo para confirmar</Label>
              <Input
                id="delete-user-confirmation"
                name="confirmation"
                type="email"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={selected.email}
                autoComplete="off"
                required
              />
            </div>
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={pending}>Cancelar</Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={pending}
                disabled={confirmation.toLowerCase() !== selected.email.toLowerCase()}
              >
                Eliminar cuenta y datos
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </>
  );
}
