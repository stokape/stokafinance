import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { AccountsRepository } from "../repositories/accounts.repository";
import type { CreateAccountInput, UpdateAccountInput } from "../validations/account.schema";
import type { Account, AccountWithBalance } from "../types/account.types";

export class AccountsService {
  private readonly repository: AccountsRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new AccountsRepository(supabase);
  }

  listAccounts(options?: { includeInactive?: boolean }): Promise<AccountWithBalance[]> {
    return this.repository.list(options);
  }

  getAccount(id: string): Promise<AccountWithBalance | null> {
    return this.repository.findById(id);
  }

  async createAccount(userId: string, input: CreateAccountInput): Promise<Account> {
    return this.repository.create(userId, {
      name: input.name,
      institution: input.institution || null,
      account_type: input.accountType,
      currency: input.currency,
      initial_balance: input.initialBalance,
      icon: input.icon || null,
      notes: input.notes || null,
    });
  }

  async updateAccount(input: UpdateAccountInput): Promise<Account> {
    const patch: Database["public"]["Tables"]["accounts"]["Update"] = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.institution !== undefined) patch.institution = input.institution || null;
    if (input.accountType !== undefined) patch.account_type = input.accountType;
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.icon !== undefined) patch.icon = input.icon || null;
    if (input.notes !== undefined) patch.notes = input.notes || null;
    if (input.active !== undefined) patch.active = input.active;

    return this.repository.update(input.id, patch);
  }

  /** Archiva la cuenta (soft delete). El historial de movimientos permanece intacto (§33). */
  async archiveAccount(id: string): Promise<{ hadTransactions: boolean }> {
    const hadTransactions = await this.repository.hasTransactions(id);
    await this.repository.softDelete(id);
    return { hadTransactions };
  }
}
