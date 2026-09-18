import type { PaymentMethod, SubscriptionStatus } from "@/lib/access/subscription";
import type { SalesPlan } from "@/lib/config/sales";

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string | null;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  isCurrentAdmin: boolean;
  isAdmin: boolean;
  subscriptionStatus: SubscriptionStatus;
  plan: SalesPlan | null;
  paidThrough: string | null;
  paymentMethod: PaymentMethod | null;
  daysRemaining: number | null;
}
