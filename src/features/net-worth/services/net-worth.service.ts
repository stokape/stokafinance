import type { SupabaseClient } from "@supabase/supabase-js";
import { formatISO } from "date-fns";
import type { Database } from "@/types/database.types";
import { NetWorthRepository } from "../repositories/net-worth.repository";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import { CreditCardsService } from "@/features/credit-cards/services/credit-cards.service";
import { LoansService } from "@/features/loans/services/loans.service";
import { calculateNetWorth } from "@/lib/financial-engine";
import { sumMoney } from "@/lib/utils/money";
import type { CreateAssetInput, CreateLiabilityInput } from "../validations/net-worth.schema";
import type { NetWorthOverview, SnapshotPoint } from "../types/net-worth.types";

export class NetWorthService {
  private readonly repository: NetWorthRepository;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new NetWorthRepository(supabase);
  }

  /** Consolida cuentas + tarjetas + préstamos + activos/pasivos manuales (§19). */
  async getOverview(): Promise<NetWorthOverview> {
    const [accounts, creditCards, loans, manualAssets, manualLiabilities] = await Promise.all([
      new AccountsService(this.supabase).listAccounts(),
      new CreditCardsService(this.supabase).listCards(),
      new LoansService(this.supabase).listLoans(),
      this.repository.listAssets(),
      this.repository.listLiabilities(),
    ]);

    const cashTotal = sumMoney(accounts.map((a) => a.currentBalance));
    const manualAssetsTotal = sumMoney(manualAssets.map((a) => a.currentValue));
    const totalAssets = cashTotal.plus(manualAssetsTotal);

    const cardDebtTotal = sumMoney(creditCards.map((c) => c.currentDebt));
    const loanDebtTotal = sumMoney(loans.map((l) => l.currentBalance));
    const manualLiabilitiesTotal = sumMoney(manualLiabilities.map((l) => l.currentBalance));
    const totalLiabilities = cardDebtTotal.plus(loanDebtTotal).plus(manualLiabilitiesTotal);

    const netWorth = calculateNetWorth(totalAssets, totalLiabilities);

    return {
      totalAssets: totalAssets.toString(),
      totalLiabilities: totalLiabilities.toString(),
      netWorth: netWorth.toString(),
      systemAssetBreakdown: [{ label: "Cuentas", amount: cashTotal.toString() }],
      systemLiabilityBreakdown: [
        { label: "Tarjetas de crédito", amount: cardDebtTotal.toString() },
        { label: "Préstamos", amount: loanDebtTotal.toString() },
      ],
      manualAssets,
      manualLiabilities,
    };
  }

  async createAsset(userId: string, input: CreateAssetInput): Promise<void> {
    await this.repository.createAsset(userId, {
      name: input.name,
      asset_type: input.assetType,
      current_value: input.currentValue,
      currency: input.currency,
      notes: input.notes || null,
    });
  }

  deleteAsset(id: string): Promise<void> {
    return this.repository.deleteAsset(id);
  }

  async createLiability(userId: string, input: CreateLiabilityInput): Promise<void> {
    await this.repository.createLiability(userId, {
      name: input.name,
      liability_type: input.liabilityType,
      current_balance: input.currentBalance,
      currency: input.currency,
      notes: input.notes || null,
    });
  }

  deleteLiability(id: string): Promise<void> {
    return this.repository.deleteLiability(id);
  }

  /** Guarda manualmente el snapshot de hoy (§19) — sin cron, botón explícito. */
  async saveTodaySnapshot(userId: string): Promise<void> {
    const overview = await this.getOverview();
    const accounts = await new AccountsService(this.supabase).listAccounts();
    const cash = sumMoney(accounts.map((a) => a.currentBalance));
    const investments = sumMoney(
      overview.manualAssets.filter((a) => a.assetType === "INVESTMENT").map((a) => a.currentValue),
    );

    await this.repository.upsertSnapshot(userId, {
      snapshotDate: formatISO(new Date(), { representation: "date" }),
      totalAssets: overview.totalAssets,
      totalLiabilities: overview.totalLiabilities,
      netWorth: overview.netWorth,
      cash: cash.toString(),
      debt: overview.totalLiabilities,
      investments: investments.toString(),
    });
  }

  listSnapshots(limit?: number): Promise<SnapshotPoint[]> {
    return this.repository.listSnapshots(limit);
  }
}
