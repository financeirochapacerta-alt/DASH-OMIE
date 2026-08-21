export type PeriodPreset = "month" | "previous" | "3m" | "6m" | "year" | "custom";
export type Period = { from: string; to: string; preset: PeriodPreset; label: string };
export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

const PRESET_LABELS: Record<PeriodPreset, string> = {
  month: "Este mês",
  previous: "Mês anterior",
  "3m": "Últimos 3 meses",
  "6m": "Últimos 6 meses",
  year: "Este ano",
  custom: "Personalizado",
};

const PRESETS: readonly PeriodPreset[] = ["month", "previous", "3m", "6m", "year", "custom"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}
function lastDayOfMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}
function param(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Resolves the ?period=/&from=/&to= search params into a concrete [from, to]
 * date range. Presets use full calendar-month boundaries (not capped at
 * "today") since commercial forecast dates can legitimately fall later in
 * the month. Falls back to "Este mês" for anything missing/invalid — never
 * throws, never silently returns an unbounded range.
 */
export function resolvePeriod(searchParams: Record<string, string | string[] | undefined>, now: Date = new Date()): Period {
  const requested = param(searchParams, "period");
  const preset: PeriodPreset = PRESETS.includes(requested as PeriodPreset) ? (requested as PeriodPreset) : "month";
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;

  if (preset === "custom") {
    const from = param(searchParams, "from");
    const to = param(searchParams, "to");
    if (isValidIsoDate(from) && isValidIsoDate(to) && from <= to) {
      return { from, to, preset, label: PRESET_LABELS.custom };
    }
    return resolvePeriod({ period: "month" }, now);
  }

  if (preset === "previous") {
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    return { from: iso(py, pm, 1), to: iso(py, pm, lastDayOfMonth(py, pm)), preset, label: PRESET_LABELS.previous };
  }

  if (preset === "3m" || preset === "6m") {
    const span = preset === "3m" ? 3 : 6;
    let sm = m - (span - 1);
    let sy = y;
    while (sm < 1) {
      sm += 12;
      sy -= 1;
    }
    return { from: iso(sy, sm, 1), to: iso(y, m, lastDayOfMonth(y, m)), preset, label: PRESET_LABELS[preset] };
  }

  if (preset === "year") {
    return { from: iso(y, 1, 1), to: iso(y, 12, 31), preset, label: PRESET_LABELS.year };
  }

  return { from: iso(y, m, 1), to: iso(y, m, lastDayOfMonth(y, m)), preset, label: PRESET_LABELS.month };
}
