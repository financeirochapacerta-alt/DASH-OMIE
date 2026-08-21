import { expect, test } from "@playwright/test";
import { login, skipUnlessCredentials } from "./support";

test.describe("Filtro de período (real, não decorativo)", () => {
  test("Comercial: 'Este mês' e 'Mês anterior' produzem números diferentes e a URL reflete a seleção", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);

    await page.goto("/comercial");
    await expect(page).toHaveURL(/\/comercial$/);
    const thisMonthSales = await page.locator(".metric-card").first().locator("strong").textContent();

    await page.locator('select[name="period"]').selectOption("previous");
    await page.getByRole("button", { name: /aplicar filtros/i }).click();
    await expect(page).toHaveURL(/period=previous/);
    const previousMonthSales = await page.locator(".metric-card").first().locator("strong").textContent();

    expect(thisMonthSales).not.toBeNull();
    expect(previousMonthSales).not.toBeNull();
    expect(previousMonthSales).not.toBe(thisMonthSales);
  });

  test("Comercial: recarregar a página preserva o filtro selecionado (searchParams, não estado local)", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);

    await page.goto("/comercial?period=previous");
    const beforeReload = await page.locator(".metric-card").first().locator("strong").textContent();

    await page.reload();
    await expect(page.locator('select[name="period"]')).toHaveValue("previous");
    const afterReload = await page.locator(".metric-card").first().locator("strong").textContent();

    expect(afterReload).toBe(beforeReload);
  });

  test("DRE: resultado muda ao trocar de período e a tabela reflete o período selecionado", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);

    await page.goto("/dre?period=month");
    const thisMonthResult = await page.locator(".metric-card").first().locator("strong").textContent();

    await page.goto("/dre?period=year");
    const yearResult = await page.locator(".metric-card").first().locator("strong").textContent();

    expect(thisMonthResult).not.toBe(yearResult);
  });

  test("Fluxo de Caixa: não exibe seletor de período (saldo/projeção não são filtráveis por período)", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);

    await page.goto("/fluxo-de-caixa");
    await expect(page.locator('select[name="period"]')).toHaveCount(0);
    await expect(page.getByText(/sem filtro de período/i)).toBeVisible();
  });

  test("Visão Geral: 'Melhor vendedor' nunca mistura valor real com aviso de 'sem dados'", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);

    await page.goto("/");
    const card = page.locator(".metric-card", { hasText: "Melhor vendedor" });
    await expect(card).toBeVisible();
    const value = await card.locator("strong").textContent();
    const detail = await card.locator("small").textContent();
    if (value && value.trim() !== "R$ 0,00" && value.trim() !== "—") {
      expect(detail).not.toMatch(/sem dados no per[ií]odo/i);
    }
  });
});
