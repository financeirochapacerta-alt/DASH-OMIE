export type PeriodPreset = "today" | "week" | "month" | "previous" | "3m" | "6m" | "year" | "custom";
export type Period = { from: string; to: string; preset: PeriodPreset; label: string };
export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

const PRESET_LABELS: Record<PeriodPreset, string> = {
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  previous: "Mês anterior",
  "3m": "Últimos 3 meses",
  "6m": "Últimos 6 meses",
  year: "Este ano",
  custom: "Personalizado",
};

const PRESETS: readonly PeriodPreset[] = ["today", "week", "month", "previous", "3m", "6m", "year", "custom"];

// Chapa Certa operates in Brazil; "hoje"/"esta semana" and every month/year boundary must be
// computed on the business's local calendar day, not the server's (Vercel runs UTC — near
// midnight UTC is still evening in Brazil, a full calendar day off for anything date-boundary
// sensitive).
const BUSINESS_TIMEZONE = "America/Sao_Paulo";
const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

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

function businessLocalParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")), weekday: get("weekday") };
}

function addDays(y: number, m: number, d: number, delta: number) {
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}
function shiftMonth(y: number, m: number, delta: number) {
  const total = y * 12 + (m - 1) + delta;
  return { y: Math.floor(total / 12), m: (((total % 12) + 12) % 12) + 1 };
}
function monthStart(y: number, m: number) {
  return iso(y, m, 1);
}
function monthEnd(y: number, m: number) {
  return iso(y, m, lastDayOfMonth(y, m));
}
function daysBetweenIso(fromIso: string, toIso: string) {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / msPerDay);
}

/**
 * Resolves the ?period=/&from=/&to= search params into a concrete [from, to] date range, on
 * Chapa Certa's local business calendar (America/Sao_Paulo), not the server's. Calendar-based
 * presets (month/previous/3m/6m/year) use full month/year boundaries (not capped at "today")
 * since commercial forecast dates can legitimately fall later in the period. Falls back to
 * "Este mês" for anything missing/invalid — never throws, never silently returns an
 * unbounded range.
 */
export function resolvePeriod(searchParams: Record<string, string | string[] | undefined>, now: Date = new Date()): Period {
  const requested = param(searchParams, "period");
  const preset: PeriodPreset = PRESETS.includes(requested as PeriodPreset) ? (requested as PeriodPreset) : "month";
  const { year: y, month: m, day: d, weekday } = businessLocalParts(now);

  if (preset === "custom") {
    const from = param(searchParams, "from");
    const to = param(searchParams, "to");
    if (isValidIsoDate(from) && isValidIsoDate(to) && from <= to) {
      return { from, to, preset, label: PRESET_LABELS.custom };
    }
    return resolvePeriod({ period: "month" }, now);
  }

  if (preset === "today") {
    return { from: iso(y, m, d), to: iso(y, m, d), preset, label: PRESET_LABELS.today };
  }

  if (preset === "week") {
    const offset = WEEKDAY_INDEX[weekday] ?? 0;
    const monday = addDays(y, m, d, -offset);
    const sunday = addDays(monday.year, monday.month, monday.day, 6);
    return { from: iso(monday.year, monday.month, monday.day), to: iso(sunday.year, sunday.month, sunday.day), preset, label: PRESET_LABELS.week };
  }

  if (preset === "previous") {
    const prev = shiftMonth(y, m, -1);
    return { from: monthStart(prev.y, prev.m), to: monthEnd(prev.y, prev.m), preset, label: PRESET_LABELS.previous };
  }

  if (preset === "3m" || preset === "6m") {
    const span = preset === "3m" ? 3 : 6;
    const start = shiftMonth(y, m, -(span - 1));
    return { from: monthStart(start.y, start.m), to: monthEnd(y, m), preset, label: PRESET_LABELS[preset] };
  }

  if (preset === "year") {
    return { from: iso(y, 1, 1), to: iso(y, 12, 31), preset, label: PRESET_LABELS.year };
  }

  return { from: monthStart(y, m), to: monthEnd(y, m), preset, label: PRESET_LABELS.month };
}

/**
 * The comparable prior window for a period, for "vs período anterior" deltas. Calendar-based
 * presets shift by whole months/years (so a 30-day and a 31-day month compare correctly);
 * day-based presets (today/week/custom) shift by the exact day count instead. Derived only
 * from the period's own from/to — no implicit "now" dependency.
 */
export function previousPeriod(period: Period): Period {
  const [fy, fm, fd] = period.from.split("-").map(Number);

  if (period.preset === "today") {
    const prev = addDays(fy, fm, fd, -1);
    return { from: iso(prev.year, prev.month, prev.day), to: iso(prev.year, prev.month, prev.day), preset: "today", label: "Ontem" };
  }
  if (period.preset === "week") {
    const prevFrom = addDays(fy, fm, fd, -7);
    const prevTo = addDays(fy, fm, fd, -1);
    return { from: iso(prevFrom.year, prevFrom.month, prevFrom.day), to: iso(prevTo.year, prevTo.month, prevTo.day), preset: "week", label: "Semana anterior" };
  }
  if (period.preset === "month" || period.preset === "previous") {
    const prev = shiftMonth(fy, fm, -1);
    return { from: monthStart(prev.y, prev.m), to: monthEnd(prev.y, prev.m), preset: period.preset, label: "Período anterior" };
  }
  if (period.preset === "3m" || period.preset === "6m") {
    const span = period.preset === "3m" ? 3 : 6;
    const end = shiftMonth(fy, fm, -1);
    const start = shiftMonth(fy, fm, -span);
    return { from: monthStart(start.y, start.m), to: monthEnd(end.y, end.m), preset: period.preset, label: "Período anterior" };
  }
  if (period.preset === "year") {
    return { from: iso(fy - 1, 1, 1), to: iso(fy - 1, 12, 31), preset: "year", label: "Ano anterior" };
  }
  // custom: shift both edges back by the exact length of the selected range
  const lengthDays = daysBetweenIso(period.from, period.to) + 1;
  const prevTo = addDays(fy, fm, fd, -1);
  const prevFrom = addDays(prevTo.year, prevTo.month, prevTo.day, -(lengthDays - 1));
  return { from: iso(prevFrom.year, prevFrom.month, prevFrom.day), to: iso(prevTo.year, prevTo.month, prevTo.day), preset: "custom", label: "Período anterior" };
}
