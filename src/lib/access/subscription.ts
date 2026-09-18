import type { SalesPlan } from "@/lib/config/sales";

export type SubscriptionStatus = "active" | "pending" | "suspended" | "expired" | "legacy";
export type PaymentMethod = "yape" | "transfer";

export interface SubscriptionMetadata {
  status: "active" | "pending" | "suspended";
  plan: SalesPlan | null;
  paidThrough: string | null;
  paymentMethod: PaymentMethod | null;
  activatedAt: string | null;
  updatedAt: string | null;
}

export interface SubscriptionAccess {
  allowed: boolean;
  status: SubscriptionStatus;
  plan: SalesPlan | null;
  paidThrough: string | null;
  paymentMethod: PaymentMethod | null;
  daysRemaining: number | null;
}

// Las cuentas creadas antes de habilitar el cobro conservan su acceso.
export const SUBSCRIPTION_ENFORCEMENT_FROM = "2026-09-18T03:35:00.000Z";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asDate(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function todayInLima(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function calendarDaysRemaining(paidThrough: string, today = todayInLima()): number {
  const end = Date.parse(`${paidThrough}T00:00:00.000Z`);
  const start = Date.parse(`${today}T00:00:00.000Z`);
  if (!Number.isFinite(end) || !Number.isFinite(start)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000) + 1);
}

export function readSubscriptionMetadata(appMetadata: unknown): SubscriptionMetadata | null {
  if (!isRecord(appMetadata) || !isRecord(appMetadata.subscription)) return null;
  const raw = appMetadata.subscription;
  const status = raw.status;
  if (status !== "active" && status !== "pending" && status !== "suspended") return null;

  return {
    status,
    plan: raw.plan === "monthly" || raw.plan === "annual" ? raw.plan : null,
    paidThrough: asDate(raw.paid_through),
    paymentMethod: raw.payment_method === "yape" || raw.payment_method === "transfer" ? raw.payment_method : null,
    activatedAt: typeof raw.activated_at === "string" ? raw.activated_at : null,
    updatedAt: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

interface ResolveSubscriptionAccessInput {
  appMetadata: unknown;
  createdAt: string;
  isAdmin?: boolean;
  now?: Date;
}

export function resolveSubscriptionAccess({
  appMetadata,
  createdAt,
  isAdmin = false,
  now = new Date(),
}: ResolveSubscriptionAccessInput): SubscriptionAccess {
  if (isAdmin) {
    return { allowed: true, status: "active", plan: null, paidThrough: null, paymentMethod: null, daysRemaining: null };
  }

  const subscription = readSubscriptionMetadata(appMetadata);
  if (!subscription) {
    const isLegacy = Date.parse(createdAt) < Date.parse(SUBSCRIPTION_ENFORCEMENT_FROM);
    return {
      allowed: isLegacy,
      status: isLegacy ? "legacy" : "pending",
      plan: null,
      paidThrough: null,
      paymentMethod: null,
      daysRemaining: null,
    };
  }

  const common = {
    plan: subscription.plan,
    paidThrough: subscription.paidThrough,
    paymentMethod: subscription.paymentMethod,
  };

  if (subscription.status === "suspended") {
    return { allowed: false, status: "suspended", daysRemaining: 0, ...common };
  }
  if (subscription.status === "pending" || !subscription.paidThrough) {
    return { allowed: false, status: "pending", daysRemaining: null, ...common };
  }

  const today = todayInLima(now);
  if (subscription.paidThrough < today) {
    return { allowed: false, status: "expired", daysRemaining: 0, ...common };
  }

  return {
    allowed: true,
    status: "active",
    daysRemaining: calendarDaysRemaining(subscription.paidThrough, today),
    ...common,
  };
}

export function subscriptionMetadataForUpdate(input: {
  plan: SalesPlan;
  paidThrough: string;
  paymentMethod: PaymentMethod;
  previous?: SubscriptionMetadata | null;
  now?: Date;
}) {
  const now = (input.now ?? new Date()).toISOString();
  return {
    status: "active" as const,
    plan: input.plan,
    paid_through: input.paidThrough,
    payment_method: input.paymentMethod,
    activated_at: input.previous?.activatedAt ?? now,
    updated_at: now,
  };
}
