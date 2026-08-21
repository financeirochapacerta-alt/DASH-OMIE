import { describe, expect, it } from "vitest";
import { resolvePeriod } from "@/features/management/period";

const NOW = new Date("2026-08-21T12:00:00Z");

describe("resolvePeriod", () => {
  it("resolves 'Este mês' to the full current calendar month", () => {
    expect(resolvePeriod({ period: "month" }, NOW)).toMatchObject({ from: "2026-08-01", to: "2026-08-31", preset: "month" });
  });

  it("resolves 'Mês anterior' to the full previous calendar month", () => {
    expect(resolvePeriod({ period: "previous" }, NOW)).toMatchObject({ from: "2026-07-01", to: "2026-07-31", preset: "previous" });
  });

  it("crosses the year boundary for 'Mês anterior' in January", () => {
    expect(resolvePeriod({ period: "previous" }, new Date("2026-01-15T00:00:00Z"))).toMatchObject({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("resolves 'Últimos 3 meses' spanning back from the current month", () => {
    expect(resolvePeriod({ period: "3m" }, NOW)).toMatchObject({ from: "2026-06-01", to: "2026-08-31" });
  });

  it("resolves 'Últimos 6 meses' crossing the year boundary", () => {
    expect(resolvePeriod({ period: "6m" }, new Date("2026-02-10T00:00:00Z"))).toMatchObject({ from: "2025-09-01", to: "2026-02-28" });
  });

  it("resolves 'Este ano' to the full calendar year", () => {
    expect(resolvePeriod({ period: "year" }, NOW)).toMatchObject({ from: "2026-01-01", to: "2026-12-31" });
  });

  it("accepts a valid custom range", () => {
    expect(resolvePeriod({ period: "custom", from: "2026-05-10", to: "2026-05-20" }, NOW)).toMatchObject({ from: "2026-05-10", to: "2026-05-20", preset: "custom" });
  });

  it("falls back to 'Este mês' when the custom range is missing", () => {
    expect(resolvePeriod({ period: "custom" }, NOW)).toMatchObject({ from: "2026-08-01", to: "2026-08-31", preset: "month" });
  });

  it("falls back to 'Este mês' when the custom range is inverted", () => {
    expect(resolvePeriod({ period: "custom", from: "2026-08-20", to: "2026-08-01" }, NOW)).toMatchObject({ preset: "month" });
  });

  it("falls back to 'Este mês' when the custom range has an invalid date", () => {
    expect(resolvePeriod({ period: "custom", from: "not-a-date", to: "2026-08-20" }, NOW)).toMatchObject({ preset: "month" });
  });

  it("defaults to 'Este mês' when no period param is present", () => {
    expect(resolvePeriod({}, NOW)).toMatchObject({ preset: "month" });
  });

  it("ignores an unrecognized preset value instead of throwing", () => {
    expect(resolvePeriod({ period: "not-a-real-preset" }, NOW)).toMatchObject({ preset: "month" });
  });

  it("is pure — the same searchParams always resolve to the same period (refresh-safe)", () => {
    const params = { period: "6m" };
    expect(resolvePeriod(params, NOW)).toEqual(resolvePeriod(params, NOW));
  });
});
