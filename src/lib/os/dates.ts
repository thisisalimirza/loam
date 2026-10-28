export const TZ = "America/New_York"

export function todayISO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000)
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", ...opts })
}

/** "Today", "Tomorrow", "Overdue 3d", "Fri", "Nov 4" */
export function relDue(iso: string, today = todayISO()) {
  const n = daysBetween(today, iso)
  if (n === 0) return { label: "Today", warn: false }
  if (n === 1) return { label: "Tomorrow", warn: false }
  if (n < 0) return { label: `Overdue ${-n}d`, warn: true }
  if (n < 7) return { label: fmtDate(iso, { weekday: "short" }), warn: false }
  return { label: fmtDate(iso), warn: false }
}

export function ago(iso: string, today = todayISO()) {
  const n = daysBetween(iso.slice(0, 10), today)
  if (n <= 0) return "today"
  if (n === 1) return "yesterday"
  if (n < 7) return `${n}d ago`
  if (n < 60) return `${Math.round(n / 7)}w ago`
  if (n < 365) return `${Math.round(n / 30)}mo ago`
  return `${Math.round(n / 365)}y ago`
}

export type Repeat = "daily" | "weekdays" | "weekly" | "monthly" | "yearly"
export const REPEATS: Repeat[] = ["daily", "weekdays", "weekly", "monthly", "yearly"]
export const REPEAT_LABEL: Record<Repeat, string> = { daily: "Every day", weekdays: "Weekdays", weekly: "Every week", monthly: "Every month", yearly: "Every year" }

/** Next occurrence after `iso` for a repeat rule. */
export function nextDate(iso: string, r: Repeat) {
  const d = new Date(iso + "T12:00:00Z")
  if (r === "daily") d.setUTCDate(d.getUTCDate() + 1)
  else if (r === "weekly") d.setUTCDate(d.getUTCDate() + 7)
  else if (r === "weekdays") { do d.setUTCDate(d.getUTCDate() + 1); while (d.getUTCDay() === 0 || d.getUTCDay() === 6) }
  else if (r === "monthly") { const day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1); const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(day, last)) }
  else { const m = d.getUTCMonth(); d.setUTCFullYear(d.getUTCFullYear() + 1); if (d.getUTCMonth() !== m) d.setUTCDate(0) }
  return d.toISOString().slice(0, 10)
}
