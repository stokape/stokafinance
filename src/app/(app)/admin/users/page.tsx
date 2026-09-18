import type { Metadata } from "next";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin/authorization";
import { AdminUserTable } from "@/features/admin/components/admin-user-table";
import type { AdminUserRow } from "@/features/admin/types/admin-user.types";

export const metadata: Metadata = { title: "Administrar usuarios", robots: { index: false, follow: false } };

async function listAllUsers(): Promise<User[]> {
  const admin = createSupabaseAdminClient();
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error("No se pudo consultar la lista de usuarios.");
    users.push(...data.users);
    if (data.users.length < 100) break;
    page += 1;
  }

  return users;
}

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: administrator },
  } = await supabase.auth.getUser();

  if (!administrator || !isAdminEmail(administrator.email)) redirect("/dashboard");

  const authUsers = await listAllUsers();
  const admin = createSupabaseAdminClient();
  const ids = authUsers.map((user) => user.id);
  const { data: profiles } = ids.length
    ? await admin.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  const users: AdminUserRow[] = authUsers
    .filter((user): user is typeof user & { email: string } => Boolean(user.email))
    .map((user) => ({
      id: user.id,
      email: user.email,
      fullName: names.get(user.id) ?? null,
      provider: String(user.app_metadata?.provider ?? "email"),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      emailConfirmed: Boolean(user.email_confirmed_at),
      isCurrentAdmin: user.id === administrator.id,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 py-4 md:py-8">
      <div className="flex items-start gap-4">
        <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Control de acceso</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Revisa las cuentas registradas y elimina definitivamente aquellas que correspondan. La eliminación limpia primero los datos financieros para evitar registros incompletos.
          </p>
        </div>
      </div>

      <AdminUserTable users={users} />
    </div>
  );
}
