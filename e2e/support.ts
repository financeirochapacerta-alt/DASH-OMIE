import type { Page } from "@playwright/test";
import { test } from "@playwright/test";

export type RoleCredentials = { email: string; password: string };

export function credentialsFor(role: "ADMIN" | "FINANCEIRO" | "COMERCIAL" | "VIEWER"): RoleCredentials | null {
  const email = process.env[`E2E_${role}_EMAIL`];
  const password = process.env[`E2E_${role}_PASSWORD`];
  return email && password ? { email, password } : null;
}

export function skipUnlessCredentials(role: "ADMIN" | "FINANCEIRO" | "COMERCIAL" | "VIEWER") {
  const creds = credentialsFor(role);
  test.skip(!creds, `E2E_${role}_EMAIL/E2E_${role}_PASSWORD not set locally — see docs/OPERATIONS.md`);
  return creds!;
}

export async function login(page: Page, creds: RoleCredentials) {
  await page.goto("/login");
  await page.getByLabel(/e-mail/i).fill(creds.email);
  await page.getByLabel(/senha/i).fill(creds.password);
  // Wait for the server action's response (redirect or re-rendered error) so the session
  // cookie is committed before the test issues another navigation — otherwise a fast test
  // with no intervening polling assertion can race ahead and cancel the pending redirect.
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/login") && response.request().method() === "POST"),
    page.getByRole("button", { name: /entrar/i }).click(),
  ]);
}
