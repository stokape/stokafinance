import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { AccountCard } from "@/features/accounts/components/account-card";
import { NewAccountButton } from "@/features/accounts/components/new-account-button";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatMoney, sumMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Cuentas" };

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient();
  const service = new AccountsService(supabase);
  const accounts = await service.listAccounts();

  // El saldo por cuenta ya lo resuelve la vista account_balances (fuente de
  // verdad, ver docs/architecture.md §3.2); aquí sólo consolidamos el total.
  const totalBalance = sumMoney(accounts.map((a) => a.currentBalance));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cuentas</h1>
          <p className="text-sm text-muted-foreground">
            Saldo consolidado: <span className="font-medium text-foreground">{formatMoney(totalBalance)}</span>
          </p>
        </div>
        <NewAccountButton />
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Aún no tienes cuentas"
          description="Crea tu primera cuenta (banco, efectivo o billetera digital) para empezar a registrar movimientos."
          action={<NewAccountButton />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
