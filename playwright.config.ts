import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// E2E credentials are never in code. Set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD (and optionally
// E2E_FINANCEIRO_*/E2E_COMERCIAL_*/E2E_VIEWER_*) in a local, gitignored env file before running
// tests that need a real session — see docs/OPERATIONS.md. Tests requiring a role that has no
// credentials configured skip themselves instead of failing.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Next dev compiles each route on first hit; a cold compile can outlast the 30s default,
  // especially for pages nobody has navigated to yet in the current dev server process.
  timeout: 45_000,
  // A single `next dev` process serializes on-demand route compilation — real concurrent
  // browser sessions against it contend for the same compile queue and time out under load.
  // Serial execution matches how this suite is actually meant to run locally.
  workers: process.env.CI ? undefined : 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
