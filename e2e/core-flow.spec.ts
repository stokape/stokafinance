import { test, expect } from "@playwright/test";

/**
 * E2E del flujo crítico (§31, Fase 7): registro → onboarding → crear una
 * segunda cuenta → registrar un gasto → verlo en el dashboard. Corre contra
 * Supabase local real (RLS + trigger de ledger), sin mocks.
 *
 * Usa un usuario nuevo (vía /register) en vez del usuario demo: el usuario
 * demo acumuló estado inconsistente de pruebas manuales anteriores en esta
 * sesión (perfil con `onboarding_completed_at` nulo pese a tener cuentas y
 * movimientos ya creados por API), lo que hacía el flujo no determinista.
 * Registrar un usuario fresco por corrida es la forma correcta de probar
 * esto de punta a punta y además ejercita el registro + onboarding, que de
 * otro modo no tendrían cobertura.
 *
 * Un único test con `test.step` en vez de varios `test()` independientes:
 * cada paso depende de la sesión/datos del anterior.
 */
test("registro, onboarding, crear cuenta, registrar gasto y verlo en el dashboard", async ({ page }) => {
  const uniqueSuffix = Date.now();
  const email = `e2e-${uniqueSuffix}@example.com`;
  const firstAccountName = "Cuenta principal";
  const secondAccountName = `E2E Cuenta ${uniqueSuffix}`;
  const expenseDescription = `E2E gasto ${uniqueSuffix}`;

  await test.step("registrar un usuario nuevo", async () => {
    await page.goto("/register");
    await page.locator("#fullName").fill("E2E Test User");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("Passw0rd123");
    await page.locator("#confirmPassword").fill("Passw0rd123");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    // Sin confirmación de correo en local (supabase/config.toml), el registro
    // deja la sesión activa y redirige directo al wizard de onboarding.
    await expect(page).toHaveURL(/\/onboarding/);
  });

  await test.step("completar el onboarding (crea la primera cuenta)", async () => {
    await page.locator("#accountName").fill(firstAccountName);
    await page.getByRole("button", { name: "Empezar a usar STOKA Finance" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  await test.step("crear una segunda cuenta desde /accounts", async () => {
    await page.goto("/accounts");
    await page.getByRole("button", { name: "Nueva cuenta" }).click();

    const dialog = page.getByRole("dialog", { name: "Nueva cuenta" });
    await expect(dialog).toBeVisible();
    await dialog.locator("#name").fill(secondAccountName);
    await dialog.locator("#initialBalance").fill("500");
    await dialog.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText(secondAccountName)).toBeVisible();
    await expect(page.getByText(firstAccountName)).toBeVisible();
  });

  await test.step("registrar un gasto vía el menú rápido", async () => {
    await page.getByRole("button", { name: "Nuevo movimiento" }).click();
    await page.getByRole("menuitem", { name: "Gasto" }).click();

    const dialog = page.getByRole("dialog", { name: "Nuevo movimiento" });
    await expect(dialog).toBeVisible();
    await dialog.locator("#exp-amount").fill("50");
    await dialog.locator("#exp-account").selectOption({ label: secondAccountName });
    // La categoría depende de las categorías por defecto del usuario nuevo;
    // se toma la primera opción habilitada (no la placeholder deshabilitada).
    await dialog.locator("#exp-category").selectOption({ index: 1 });
    await dialog.locator("#exp-description").fill(expenseDescription);
    await dialog.getByRole("button", { name: "Registrar gasto" }).click();

    await expect(dialog).toBeHidden();
  });

  await test.step("el dashboard muestra el movimiento recién creado", async () => {
    await page.goto("/dashboard");
    await expect(page.getByText(expenseDescription)).toBeVisible();
  });
});
