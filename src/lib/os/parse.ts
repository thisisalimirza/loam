import { parseDate, todayISO, type Repeat } from "./dates"

export type Span = { start: number; end: number; kind: "date" | "repeat"; text: string }
export type Parsed = { title: string; due: string | null; repeat: Repeat | null; spans: Span[] }

const DAYS = "mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?"
const FULLDAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues|tue|wed|thurs|thu|fri"
const MONTHS = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?"
const B = "(?<![\\p{L}\\p{N}@#])", E = "(?![\\p{L}\\p{N}])"

const REPEAT_RE = new RegExp(`${B}(?:every\\s+(day|weekday|week|month|year|${DAYS})|(daily|weekly|monthly|yearly|weekdays))${E}`, "giu")
const DATE_RES = [
  `(?:(?:due|by|on|before)\\s+)?(?:today|tonight|tod|tomorrow|tmrw|tmr)`,
  `(?:(?:due|by|on|before)\\s+)?(?:next|this)\\s+(?:week|weekend|${DAYS})`,
  `(?:(?:due|by|before)\\s+)?(?:the\\s+)?weekend`,
  `(?:(?:due|by)\\s+)?in\\s+(?:\\d{1,3}|a|an|one|two|three|four|five|six)\\s+(?:days?|weeks?|wks?|months?|mos?)`,
  `(?:(?:due|by|on|before)\\s+)?(?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?`,
  `(?:(?:due|by|on|before)\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})`,
  `(?:(?:due|by|on|before)\\s+)?\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?`,
  // Bare weekday names only in their unambiguous forms ("sat" and "sun" need by/on/due).
  `(?:due|by|on|before)\\s+(?:${DAYS})`,
  `(?:${FULLDAYS})`,
].map(r => new RegExp(`${B}${r}${E}`, "giu"))

const WORDNUM: Record<string, string> = { a: "1", an: "1", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6" }
const DOWMAP: Record<string, string> = { mon: "mon", tue: "tue", wed: "wed", thu: "thu", fri: "fri", sat: "sat", sun: "sun" }

function dateOf(phrase: string, today: string) {
  let t = phrase.toLowerCase().replace(/^(due|by|on|before)\s+/, "").replace(/(\d)(st|nd|rd|th)\b/, "$1").replace(/^the\s+/, "")
  if (t === "tonight") t = "today"
  t = t.replace(/^in\s+(a|an|one|two|three|four|five|six)\s+/, (_, w) => `in ${WORDNUM[w]} `).replace(/\b(wks?|mos?)$/, m => m.startsWith("w") ? "w" : "m")
  return parseDate(t, today)
}

/**
 * One parser for every task input. Finds a due-date phrase and a repeat phrase anywhere in the text,
 * returns the cleaned title and the spans so inputs can highlight them as you type.
 * `ignore` holds phrases the user dismissed, so they stay in the title.
 */
export function parseTask(text: string, today = todayISO(), ignore: string[] = []): Parsed {
  const ign = new Set(ignore.map(s => s.toLowerCase()))
  const spans: Span[] = []
  let repeat: Repeat | null = null, due: string | null = null, repeatDay: string | null = null
  for (const m of text.matchAll(REPEAT_RE)) {
    if (ign.has(m[0].toLowerCase())) continue
    const w = (m[1] ?? m[2]).toLowerCase()
    repeat = w === "day" || w === "daily" ? "daily" : w.startsWith("weekday") ? "weekdays" : w === "week" || w === "weekly" ? "weekly" : w === "month" || w === "monthly" ? "monthly" : w === "year" || w === "yearly" ? "yearly" : "weekly"
    if (repeat === "weekly" && DOWMAP[w.slice(0, 3)]) repeatDay = w.slice(0, 3)
    spans.push({ start: m.index!, end: m.index! + m[0].length, kind: "repeat", text: m[0] }); break
  }
  const taken = (a: number, b: number) => spans.some(s => a < s.end && b > s.start)
  let best: { start: number; end: number; d: string; text: string } | null = null
  for (const re of DATE_RES) for (const m of text.matchAll(re)) {
    const a = m.index!, b = a + m[0].length
    if (taken(a, b) || ign.has(m[0].toLowerCase())) continue
    const d = dateOf(m[0], today); if (!d) continue
    if (!best || m[0].length > best.text.length || (m[0].length === best.text.length && a > best.start)) best = { start: a, end: b, d, text: m[0] }
  }
  if (best) { due = best.d; spans.push({ start: best.start, end: best.end, kind: "date", text: best.text }) }
  else if (repeatDay) due = parseDate(repeatDay, today)
  if (repeat && !due) due = today
  spans.sort((x, y) => x.start - y.start)
  let title = text
  for (const s of [...spans].reverse()) title = title.slice(0, s.start) + title.slice(s.end)
  title = title.replace(/\s{2,}/g, " ").replace(/\s+([,.;!?])/g, "$1").replace(/\s+(due|by|on|before|at)\s*$/i, "").replace(/^[\s,;-]+|[\s,;-]+$/g, "").trim()
  return { title: title || text.trim(), due, repeat, spans }
}
