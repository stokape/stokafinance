import { defineConfig, devices } from "@playwright/test";

/**
 * Config de Playwright (§31, Fase 7). Corre contra el servidor de
 * desarrollo local + Supabase local (`supabase start`); no depende de
 * ningún servicio externo ni cuenta de pago — cero costo.
 *
 * Requiere el usuario demo sembrado por `supabase/seed.sql`
 * (demo@stoka.pe / Passw0rd123). Si el servidor no está corriendo,
 * Playwright lo levanta automáticamente vía `webServer`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
