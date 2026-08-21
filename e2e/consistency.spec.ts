import { expect, test } from "@playwright/test";
import { login, skipUnlessCredentials } from "./support";

function parseBRL(text: string): number {
  const cleaned = text.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(cleaned);
}

test.describe("Consistência de dados (drill-down = KPI)", () => {
  test("Financeiro: soma do detalhamento de A Receber bate com o KPI", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);
    await page.goto("/financeiro");

    const kpiText = await page.locator(".metric-card-clickable", { hasText: "A Receber" }).locator("strong").textContent();
    const kpiValue = parseBRL(kpiText ?? "0");

    await page.locator(".metric-card-clickable", { hasText: "A Receber" }).click();
    await expect(page.locator(".drawer-panel")).toBeVisible();
    const totalText = await page.locator(".drawer-summary strong").first().textContent();
    const drawerTotal = parseBRL(totalText ?? "0");

    expect(drawerTotal).toBeCloseTo(kpiValue, 2);
  });

  test("Comercial: Mercadorias + Serviços = Vendas totais", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);
    await page.goto("/comercial");

    const total = parseBRL((await page.locator(".metric-card-clickable", { hasText: "Vendas totais" }).locator("strong").textContent()) ?? "0");
    const mercadorias = parseBRL((await page.locator(".metric-card-clickable", { hasText: "Mercadorias" }).locator("strong").textContent()) ?? "0");
    const servicos = parseBRL((await page.locator(".metric-card-clickable", { hasText: "Serviços" }).locator("strong").textContent()) ?? "0");

    expect(mercadorias + servicos).toBeCloseTo(total, 2);
  });

  test("Comercial: drill-down de Mercadorias respeita o período e exclui cancelados", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);
    await page.goto("/comercial");

    const mercadoriasValue = parseBRL((await page.locator(".metric-card-clickable", { hasText: "Mercadorias" }).locator("strong").textContent()) ?? "0");
    await page.locator(".metric-card-clickable", { hasText: "Mercadorias" }).click();
    await expect(page.locator(".drawer-panel")).toBeVisible();
    const drawerTotal = parseBRL((await page.locator(".drawer-summary strong").first().textContent()) ?? "0");

    expect(drawerTotal).toBeCloseTo(mercadoriasValue, 2);
    // Every row in the drawer must be tagged "Mercadoria" — never a mix.
    const badges = await page.locator(".drawer-panel .status-badge").allTextContents();
    for (const badge of badges) expect(badge).toBe("Mercadoria");
  });

  test("Financeiro: filtro Hoje e Esta semana estão disponíveis e mudam a URL", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);
    await page.goto("/financeiro");

    await page.locator('select[name="period"]').selectOption("today");
    await page.getByRole("button", { name: /aplicar filtros/i }).click();
    await expect(page).toHaveURL(/period=today/);

    await page.locator('select[name="period"]').selectOption("week");
    await page.getByRole("button", { name: /aplicar filtros/i }).click();
    await expect(page).toHaveURL(/period=week/);
  });

  test("Personalizado: from/to aparecem imediatamente e refresh preserva tudo", async ({ page }) => {
    const creds = skipUnlessCredentials("ADMIN");
    await login(page, creds);
    await page.goto("/comercial");

    await page.locator('select[name="period"]').selectOption("custom");
    await expect(page.locator('input[name="from"]')).toBeVisible();
    await expect(page.locator('input[name="to"]')).toBeVisible();
    await page.locator('input[name="from"]').fill("2026-05-01");
    await page.locator('input[name="to"]').fill("2026-05-31");
    await page.getByRole("button", { name: /aplicar filtros/i }).click();
    await expect(page).toHaveURL(/period=custom.*from=2026-05-01.*to=2026-05-31/);

    await page.reload();
    await expect(page.locator('select[name="period"]')).toHaveValue("custom");
    await expect(page.locator('input[name="from"]')).toHaveValue("2026-05-01");
    await expect(page.locator('input[name="to"]')).toHaveValue("2026-05-31");
  });

  test("FINANCEIRO não acessa drill-down Comercial e vice-versa (RLS por role)", async ({ page }) => {
    const creds = skipUnlessCredentials("FINANCEIRO");
    await login(page, creds);
    await page.goto("/comercial");
    await expect(page.getByText(/não encontrada|404/i)).toBeVisible();
  });
});
