import { describe, expect, it } from "vitest";
import { calendarDaysRemaining, resolveSubscriptionAccess } from "./subscription";

const NOW = new Date("2026-09-18T12:00:00.000Z");

describe("subscription access", () => {
  it("conserva activas las cuentas anteriores al cobro", () => {
    expect(resolveSubscriptionAccess({ appMetadata: {}, createdAt: "2026-09-01T00:00:00Z", now: NOW })).toMatchObject({
      allowed: true,
      status: "legacy",
    });
  });

  it("deja pendientes las cuentas nuevas sin pago", () => {
    expect(resolveSubscriptionAccess({ appMetadata: {}, createdAt: "2026-09-19T00:00:00Z", now: NOW })).toMatchObject({
      allowed: false,
      status: "pending",
    });
  });

  it("vence automáticamente al superar paid_through", () => {
    const access = resolveSubscriptionAccess({
      createdAt: "2026-09-19T00:00:00Z",
      now: NOW,
      appMetadata: { subscription: { status: "active", plan: "monthly", paid_through: "2026-09-17" } },
    });
    expect(access).toMatchObject({ allowed: false, status: "expired", daysRemaining: 0 });
  });

  it("cuenta el día de vencimiento como un día disponible", () => {
    expect(calendarDaysRemaining("2026-09-18", "2026-09-18")).toBe(1);
    expect(calendarDaysRemaining("2026-09-20", "2026-09-18")).toBe(3);
  });

  it("no permite que una suspensión conserve acceso", () => {
    const access = resolveSubscriptionAccess({
      createdAt: "2026-09-19T00:00:00Z",
      now: NOW,
      appMetadata: { subscription: { status: "suspended", plan: "annual", paid_through: "2027-09-18" } },
    });
    expect(access).toMatchObject({ allowed: false, status: "suspended" });
  });
});
