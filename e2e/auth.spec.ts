import { expect, test } from "@playwright/test";
import { login, skipUnlessCredentials } from "./support";

test.describe("Autenticação", () => {
  test("rota protegida redireciona para /login quando não autenticado", async ({ page }) => {
    await page.goto("/financeiro");
    await expect(page).toHaveURL(/\/login$|\/$/);
    await expect(page.getByText(/e-mail/i)).toBeVisible();
  });

  test("credenciais inválidas mostram erro real, sem cair em dado de fixture", async ({ page }) => {
    await login(page, { email: "e2e-invalido@chapacerta.invalid", password: "senha-que-nao-existe" });
    await expect(page.locator(".form-error")).toContainText(/não foi possível entrar/i);
  });

  test("login/logout com sessão real (ADMIN)", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/pulso do negócio/i)).toBeVisible();

    await page.getByRole("button", { name: /sair/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
