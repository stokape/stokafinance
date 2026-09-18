import "server-only";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin/authorization";
import { resolveSubscriptionAccess } from "@/lib/access/subscription";

export function requireActiveSubscription(user: User): void {
  const access = resolveSubscriptionAccess({
    appMetadata: user.app_metadata,
    createdAt: user.created_at,
    isAdmin: isAdminEmail(user.email),
  });
  if (!access.allowed) throw new Error("SUBSCRIPTION_REQUIRED");
}
