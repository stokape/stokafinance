"use server";

import { getAuthenticatedSupabase } from "@/lib/supabase/require-user";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import type { AccountOption } from "@/features/transactions/components/quick-add-transaction-menu";

export async function getLoanAccountsAction(): Promise<AccountOption[]> {
  const { supabase, user } = await getAuthenticatedSupabase();
  if (!user) return [];

  const accounts = await new AccountsService(supabase).listAccounts();
  return accounts.map((a) => ({ id: a.id, name: a.name }));
}
