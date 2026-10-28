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

const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
/**
 * Reads a date out of plain words: "today", "tmrw", "fri", "next mon", "next week", "in 3 days", "2w",
 * "nov 4", "4 nov", "11/4", "2026-11-04". Returns null when it isn't a date.
 */
export function parseDate(s: string, today = todayISO()): string | null {
  const t = s.trim().toLowerCase().replace(/[.,]/g, "").replace(/^(on|by|due)\s+/, "")
  if (!t) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  if (t === "today" || t === "tod") return today
  if (/^(tomorrow|tmrw|tmr|tom)$/.test(t)) return addDays(today, 1)
  if (t === "next week") return addDays(today, 7 - ((dow(today) + 6) % 7))
  if (t === "weekend" || t === "this weekend") return addDays(today, (6 - dow(today) + 7) % 7)
  let m = t.match(/^(?:in\s+)?(\d{1,3})\s*(d|day|days|w|wk|week|weeks|m|mo|month|months)$/)
  if (m) { const n = +m[1], u = m[2][0]; return u === "d" ? addDays(today, n) : u === "w" ? addDays(today, n * 7) : addMonths(today, n) }
  m = t.match(/^(next\s+|this\s+)?([a-z]{3})[a-z]*$/)
  if (m && DOW.includes(m[2])) { let d = (DOW.indexOf(m[2]) - dow(today) + 7) % 7; if (d === 0 || m[1]?.startsWith("next")) d += 7; return addDays(today, d) }
  m = t.match(/^([a-z]{3})[a-z]*\s+(\d{1,2})$/) ?? null
  const m2 = t.match(/^(\d{1,2})\s+([a-z]{3})[a-z]*$/)
  const mo = m ? MON.indexOf(m[1]) : m2 ? MON.indexOf(m2[2]) : -1
  const day = m ? +m[2] : m2 ? +m2[1] : 0
  if (mo >= 0 && day >= 1 && day <= 31) return rollYear(today, mo + 1, day)
  m = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (m) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : null
    if (+m[1] < 1 || +m[1] > 12 || +m[2] < 1 || +m[2] > 31) return null
    return y ? `${y}-${pad(+m[1])}-${pad(+m[2])}` : rollYear(today, +m[1], +m[2])
  }
  return null
}
const pad = (n: number) => String(n).padStart(2, "0")
const dow = (iso: string) => new Date(iso + "T12:00:00Z").getUTCDay()
function addMonths(iso: string, n: number) { const d = new Date(iso + "T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10) }
function rollYear(today: string, m: number, d: number) {
  const y = +today.slice(0, 4), c = `${y}-${pad(m)}-${pad(d)}`
  return c < addDays(today, -30) ? `${y + 1}-${pad(m)}-${pad(d)}` : c
}
/** Splits a trailing date phrase off a title: "Call mom fri" → { title: "Call mom", date }. */
export function splitDate(title: string, today = todayISO()) {
  const words = title.trim().split(/\s+/)
  for (let n = Math.min(3, words.length - 1); n >= 1; n--) {
    const tail = words.slice(-n).join(" ")
    if (!/^(today|tomorrow|tmrw|tonight|next|in|on|by|due|mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d)/i.test(tail)) continue
    const d = parseDate(tail, today)
    if (d) return { title: words.slice(0, -n).join(" ").replace(/\s+(by|on|due)$/i, ""), date: d }
  }
  return { title: title.trim(), date: null }
}
