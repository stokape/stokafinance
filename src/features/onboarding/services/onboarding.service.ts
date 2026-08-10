import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { AccountsService } from "@/features/accounts/services/accounts.service";
import type { OnboardingInput } from "../validations/onboarding.schema";

export class OnboardingService {
  private readonly accountsService: AccountsService;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.accountsService = new AccountsService(supabase);
  }

  async completeOnboarding(userId: string, input: OnboardingInput): Promise<void> {
    await this.accountsService.createAccount(userId, {
      name: input.accountName,
      accountType: input.accountType,
      currency: input.currency,
      initialBalance: input.initialBalance,
    });

    const { error } = await this.supabase
      .from("profiles")
      .update({
        full_name: input.fullName,
        currency: input.currency,
        monthly_income_estimate: input.monthlyIncomeEstimate || null,
        primary_goal: input.primaryGoal || null,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
  }
}
