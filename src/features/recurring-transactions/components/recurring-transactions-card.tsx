import type { SupabaseClient } from "@supabase/supabase-js";
import { Repeat } from "lucide-react";
import type { Database } from "@/types/database.types";
import { RecurringTransactionsService } from "@/features/recurring-transactions/services/recurring-transactions.service";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { CategoriesService } from "@/features/categories/services/categories.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { NewRecurringDialog } from "./new-recurring-dialog";
import { RecurringTransactionRow } from "./recurring-transaction-row";

export async function RecurringTransactionsCard({ supabase, userId }: { supabase: SupabaseClient<Database>; userId: string }) {
  const [recurring, accounts, categories] = await Promise.all([
    new RecurringTransactionsService(supabase).listAndCatchUp(userId),
    new AccountsService(supabase).listAccounts(),
    new CategoriesService(supabase).getCategoriesWithSubcategories(),
  ]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Movimientos recurrentes</CardTitle>
        <NewRecurringDialog
          accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
          categories={categories.map((c) => ({ id: c.id, name: c.name, categoryType: c.categoryType }))}
        />
      </CardHeader>
      <CardContent>
        {recurring.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="Sin movimientos recurrentes"
            description="Registra un ingreso o gasto que se repita (sueldo, ahorro automático) para que se genere solo."
          />
        ) : (
          <div>
            {recurring.map((r) => (
              <RecurringTransactionRow key={r.id} recurring={r} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
