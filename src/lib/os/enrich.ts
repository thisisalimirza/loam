import "server-only"
import { z } from "zod"
import { db } from "./db"
import { aiObject } from "./ai"

type Source = "task" | "note" | "entry"
const NOT_NAMES = new Set("I Me My We Our You Today Tomorrow Monday Tuesday Wednesday Thursday Friday Saturday Sunday Mon Tue Wed Thu Fri Sat Sun January February March April May June July August September October November December Jan Feb Mar Apr Jun Jul Aug Sep Sept Oct Nov Dec The A An And Or But UWorld Step Anki Zoom Google Slack Dr Mr Ms Mrs Team Mom Dad Clinic Hospital Lab Class Exam Notes".split(" "))

/** Names after words that usually precede a person: "with Sam", "call Priya", "ask Dr Lee". */
export function guessNames(text: string): string[] {
  const out = new Set<string>()
  const re = /\b(?:with|call|called|text|texted|email|emailed|ask|asked|tell|told|meet|met|from|for|saw|see|thank|thanks|dinner with|lunch with|coffee with)\s+((?:Dr\.?\s+)?[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)/g
  for (const m of text.matchAll(re)) {
    const n = m[1].replace(/^Dr\.?\s+/, "").trim()
    if (n.split(/\s+/).every(w => !NOT_NAMES.has(w))) out.add(n)
  }
  return [...out]
}

const snip = (text: string, name: string) => {
  const i = text.toLowerCase().indexOf(name.toLowerCase()); const s = Math.max(0, i - 60)
  return (s > 0 ? "…" : "") + text.slice(s, i + name.length + 80).replace(/\s+/g, " ").trim() + (i + name.length + 80 < text.length ? "…" : "")
}

const Found = z.object({ people: z.array(z.object({ name: z.string(), role: z.string().nullable(), doing: z.string().nullable() })) })

/**
 * Background pass after something is saved: link mentioned people and suggest new ones.
 * Idempotent (unique per person+source) and never throws into the caller.
 */
export async function enrich(type: Source, id: string, text: string) {
  try {
    if (!text || text.trim().length < 3) return
    const sql = db()
    const people = await sql<{ id: string; name: string; status: string }[]>`select id, name, status from loam_os.people`
    const lower = text.toLowerCase()
    const firstCount = new Map<string, number>()
    for (const p of people) { const f = p.name.split(/\s+/)[0].toLowerCase(); firstCount.set(f, (firstCount.get(f) ?? 0) + 1) }
    const word = (w: string) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
    const hit = new Map<string, string>()  // person id -> matched name
    for (const p of people) {
      if (p.status === "dismissed") continue
      const first = p.name.split(/\s+/)[0]
      if (word(p.name).test(lower)) hit.set(p.id, p.name)
      else if (first.length >= 3 && firstCount.get(first.toLowerCase()) === 1 && word(first).test(text) && /[A-Z]/.test(first[0])) {
        const m = text.match(new RegExp(`\\b${first}\\b`)); if (m) hit.set(p.id, first)
      }
    }
    // New names: the model when available, plus the phrase heuristic.
    const ai = await aiObject(Found,
      "Extract real individual people (not the author, not companies, not famous people referenced in passing) mentioned in a personal note. role = inferred relationship or job in under 5 words, doing = what they are up to in under 12 words. Empty list if none.",
      text.slice(0, 4000))
    const known = (n: string) => people.some(p => p.name.toLowerCase() === n.toLowerCase() || p.name.split(/\s+/)[0].toLowerCase() === n.split(/\s+/)[0].toLowerCase())
    const fresh = new Map<string, { role: string | null; doing: string | null }>()
    for (const n of guessNames(text)) if (!known(n)) fresh.set(n, { role: null, doing: null })
    for (const p of ai?.people ?? []) {
      const n = p.name.trim(); if (!n || n.length > 60 || known(n) || !text.toLowerCase().includes(n.split(/\s+/)[0].toLowerCase())) continue
      fresh.set([...fresh.keys()].find(k => k.toLowerCase() === n.toLowerCase()) ?? n, { role: p.role, doing: p.doing })
    }
    for (const [name, info] of fresh) {
      const s = snip(text, name)
      const [p] = await sql<{ id: string }[]>`insert into loam_os.people (name, role, status, context)
        values (${name}, ${info.role}, 'suggested', ${[info.doing, `Mentioned: ${s}`].filter(Boolean).join("\n")}) returning id`
      hit.set(p.id, name)
    }
    for (const [pid, name] of hit) {
      await sql`insert into loam_os.mentions (person_id, source_type, source_id, snippet) values (${pid}, ${type}, ${id}, ${snip(text, name)})
        on conflict (person_id, source_type, source_id) do update set snippet = excluded.snippet`
    }
  } catch (e) { console.warn("enrich failed", (e as Error).message) }
}
