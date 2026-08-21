import { expect, test } from "@playwright/test";
import { login, skipUnlessCredentials } from "./support";

test.describe("Autorização por role", () => {
  test("ADMIN acessa administração e configurações", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);
    await page.goto("/administracao");
    await expect(page.getByRole("heading", { name: "Qualidade dos dados", exact: true })).toBeVisible();
    await page.goto("/configuracoes");
    await expect(page.getByText(/parâmetros gerenciais/i)).toBeVisible();
  });

  test("FINANCEIRO acessa Financeiro/DRE/Fluxo mas não Comercial nem Administração", async ({ page }) => {
    const creds = skipUnlessCredentials("FINANCEIRO");
    await login(page, creds);
    await expect(page.locator('a[href="/financeiro"]')).toBeVisible();
    await expect(page.locator('a[href="/comercial"]')).toHaveCount(0);
    await expect(page.locator('a[href="/administracao"]')).toHaveCount(0);

    await page.goto("/comercial");
    await expect(page.getByText(/não encontrada|404/i)).toBeVisible();
  });

  test("COMERCIAL acessa Comercial mas não dados financeiros sensíveis", async ({ page }) => {
    const creds = skipUnlessCredentials("COMERCIAL");
    await login(page, creds);
    await expect(page.locator('a[href="/comercial"]')).toBeVisible();
    await expect(page.locator('a[href="/financeiro"]')).toHaveCount(0);

    await page.goto("/financeiro");
    await expect(page.getByText(/não encontrada|404/i)).toBeVisible();
  });

  test("VIEWER só vê a Visão Geral definida pela matriz atual", async ({ page }) => {
    const creds = skipUnlessCredentials("VIEWER");
    await login(page, creds);
    await expect(page.locator('a[href="/financeiro"]')).toHaveCount(0);
    await expect(page.locator('a[href="/comercial"]')).toHaveCount(0);
    await expect(page.locator('a[href="/configuracoes"]')).toHaveCount(0);

    await page.goto("/dre");
    await expect(page.getByText(/não encontrada|404/i)).toBeVisible();
  });
});
