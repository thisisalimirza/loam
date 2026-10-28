"use client"
import Link from "next/link"
import { createContext, useContext, useMemo, type ReactNode } from "react"

export type MIndex = { people: { id: string; name: string }[]; projects: { id: string; name: string }[] }
const Ctx = createContext<MIndex>({ people: [], projects: [] })
export const MentionProvider = ({ value, children }: { value: MIndex; children: ReactNode }) => <Ctx.Provider value={value}>{children}</Ctx.Provider>
export const useMentionIndex = () => useContext(Ctx)

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-")

type Hit = { kind: "person" | "project"; id: string; name: string; start: number; end: number }

/** Finds @Person (full or first name) and #Project (name or hyphen-slug) mentions. */
export function findMentions(text: string, idx: MIndex): Hit[] {
  const keys: { k: string; kind: Hit["kind"]; id: string; name: string }[] = []
  for (const p of idx.people) {
    keys.push({ k: "@" + p.name, kind: "person", id: p.id, name: p.name })
    const first = p.name.split(/\s+/)[0]
    if (first && first !== p.name) keys.push({ k: "@" + first, kind: "person", id: p.id, name: p.name })
  }
  for (const p of idx.projects) {
    keys.push({ k: "#" + p.name, kind: "project", id: p.id, name: p.name })
    if (/\s/.test(p.name)) keys.push({ k: "#" + slug(p.name), kind: "project", id: p.id, name: p.name })
  }
  if (!keys.length || !/[@#]/.test(text)) return []
  keys.sort((a, b) => b.k.length - a.k.length)
  const re = new RegExp(`(${keys.map(k => esc(k.k)).join("|")})(?![\\p{L}\\p{N}])`, "giu")
  const out: Hit[] = []
  for (const m of text.matchAll(re)) {
    const key = keys.find(k => k.k.toLowerCase() === m[0].toLowerCase())!
    out.push({ kind: key.kind, id: key.id, name: key.name, start: m.index!, end: m.index! + m[0].length })
  }
  return out
}

/** Renders text with @person / #project mentions as links. */
export function Mentions({ text, plain }: { text: string; plain?: boolean }) {
  const idx = useMentionIndex()
  const hits = useMemo(() => findMentions(text, idx), [text, idx])
  if (!hits.length) return <>{text}</>
  const parts: ReactNode[] = []
  let at = 0
  hits.forEach((h, i) => {
    if (h.start > at) parts.push(text.slice(at, h.start))
    const label = text.slice(h.start, h.end)
    parts.push(plain
      ? <span key={i} className="mention">{label}</span>
      : <Link key={i} className="mention" href={h.kind === "person" ? `/os/people/${h.id}` : `/os/projects/${h.id}`} onClick={e => e.stopPropagation()}>{label}</Link>)
    at = h.end
  })
  parts.push(text.slice(at))
  return <>{parts}</>
}

/** Chip row of the distinct people/projects a text mentions. */
export function MentionChips({ text, label = "Mentions" }: { text: string; label?: string }) {
  const idx = useMentionIndex()
  const hits = useMemo(() => {
    const seen = new Set<string>()
    return findMentions(text, idx).filter(h => !seen.has(h.id) && seen.add(h.id))
  }, [text, idx])
  if (!hits.length) return null
  return (
    <div className="mchips"><span>{label}</span>
      {hits.map(h => <Link key={h.id} className="mention" href={h.kind === "person" ? `/os/people/${h.id}` : `/os/projects/${h.id}`}>{h.kind === "person" ? "@" : "#"}{h.name}</Link>)}
    </div>
  )
}
