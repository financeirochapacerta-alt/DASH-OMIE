import { describe, expect, it } from "vitest";
import { previousPeriod, resolvePeriod } from "@/features/management/period";

const NOW = new Date("2026-08-21T12:00:00Z");

function isoOf(date: Date) {
  return date.toISOString().slice(0, 10);
}
// Independent day-of-week check (not the Intl-based path resolvePeriod uses), so the test
// doesn't just restate the implementation. getUTCDay(): 0=Sunday..6=Saturday.
function mondayOfWeekUtc(date: Date) {
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - mondayOffset);
  return monday;
}

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

  it("resolves 'Hoje' to a single-day range on the business's local calendar date", () => {
    const result = resolvePeriod({ period: "today" }, NOW);
    expect(result.from).toBe(result.to);
    expect(result).toMatchObject({ preset: "today" });
  });

  it("resolves 'Hoje' using America/Sao_Paulo, not the server's UTC day, near the UTC day boundary", () => {
    // 01:30 UTC on the 22nd is still 22:30 on the 21st in São Paulo (UTC-3) — "hoje" must
    // stay on the 21st, not roll over to the 22nd just because the server clock (UTC) did.
    const nearMidnightUtc = new Date("2026-08-22T01:30:00Z");
    expect(resolvePeriod({ period: "today" }, nearMidnightUtc)).toMatchObject({ from: "2026-08-21", to: "2026-08-21" });
  });

  it("resolves 'Esta semana' to a Monday-Sunday range containing today (independent weekday check)", () => {
    const result = resolvePeriod({ period: "week" }, NOW);
    expect(result.from).toBe(isoOf(mondayOfWeekUtc(NOW)));
    const [fy, fm, fd] = result.from.split("-").map(Number);
    const [ty, tm, td] = result.to.split("-").map(Number);
    const spanDays = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
    expect(spanDays).toBe(6);
  });

  it("previousPeriod('Hoje') is exactly yesterday", () => {
    const today = resolvePeriod({ period: "today" }, NOW);
    expect(previousPeriod(today)).toMatchObject({ from: "2026-08-20", to: "2026-08-20" });
  });

  it("previousPeriod('Esta semana') is exactly the prior Monday-Sunday, no gap or overlap", () => {
    const week = resolvePeriod({ period: "week" }, NOW);
    const prev = previousPeriod(week);
    const [py, pm, pd] = prev.to.split("-").map(Number);
    const dayAfterPrevTo = isoOf(new Date(Date.UTC(py, pm - 1, pd) + 86400000));
    expect(dayAfterPrevTo).toBe(week.from);
  });

  it("previousPeriod('Este mês') is the full previous calendar month, correct even across different month lengths", () => {
    const august = resolvePeriod({ period: "month" }, NOW); // August has 31 days
    expect(previousPeriod(august)).toMatchObject({ from: "2026-07-01", to: "2026-07-31" }); // July also 31

    const march = resolvePeriod({ period: "month" }, new Date("2026-03-15T12:00:00Z"));
    expect(previousPeriod(march)).toMatchObject({ from: "2026-02-01", to: "2026-02-28" }); // Feb 2026 is not a leap year
  });

  it("previousPeriod('Últimos 3 meses') is the 3 months immediately before, not overlapping", () => {
    const threeMonths = resolvePeriod({ period: "3m" }, NOW); // Jun-Aug 2026
    expect(previousPeriod(threeMonths)).toMatchObject({ from: "2026-03-01", to: "2026-05-31" });
  });

  it("previousPeriod('Este ano') is the full previous calendar year", () => {
    const year = resolvePeriod({ period: "year" }, NOW);
    expect(previousPeriod(year)).toMatchObject({ from: "2025-01-01", to: "2025-12-31" });
  });

  it("previousPeriod('Personalizado') shifts back by the exact selected length, no gap or overlap", () => {
    const custom = resolvePeriod({ period: "custom", from: "2026-05-10", to: "2026-05-19" }, NOW); // 10 days
    const prev = previousPeriod(custom);
    expect(prev).toMatchObject({ from: "2026-04-30", to: "2026-05-09" }); // also 10 days, ending the day before from
  });
});
