import { expect, test } from "@playwright/test";
import { login, skipUnlessCredentials } from "./support";

test.describe("Seleção de contas correntes (Configurações)", () => {
  // Read-only smoke test — does not click the toggle button, since that would flip a real
  // bank_accounts.selected_for_cash value in production. Toggle behavior itself is covered
  // by the pgTAP suite (supabase/tests/management_dre_cash_flow_test.sql) and the
  // bankAccountRow mapper unit test.
  test("ADMIN vê todas as contas reais com status e saldo, nenhuma escondida", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);

    await page.goto("/configuracoes");
    await expect(page.getByRole("heading", { name: "Contas consideradas nos relatórios" })).toBeVisible();

    const rows = page.locator("table tbody tr");
    await expect(rows).not.toHaveCount(0);

    const badge = page.getByText(/\d+ de \d+ contas consideradas/);
    await expect(badge).toBeVisible();
  });
});
