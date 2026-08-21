import { expect, test } from "@playwright/test";
import { login, skipUnlessCredentials } from "./support";

const PAGES = ["/", "/financeiro", "/fluxo-de-caixa", "/dre", "/comercial", "/alertas", "/administracao", "/usuarios", "/configuracoes"];

test.describe("Homologação visual (ADMIN)", () => {
  test("todas as áreas gerenciais carregam sem erro de servidor", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);
    await expect(page).toHaveURL("/");

    for (const path of PAGES) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} deveria responder 2xx`).toBeLessThan(400);
      await expect(page.getByText(/não foi possível carregar/i)).toHaveCount(0);
    }
  });
});
