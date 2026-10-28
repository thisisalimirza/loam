"use client"
import Link from "next/link"
import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { MIndex } from "@/lib/os/mentions"
export type { MIndex }
const Ctx = createContext<MIndex>({ people: [], projects: [] })
export const MentionProvider = ({ value, children }: { value: MIndex; children: ReactNode }) => <Ctx.Provider value={value}>{children}</Ctx.Provider>
export const useMentionIndex = () => useContext(Ctx)

export { findMentions } from "@/lib/os/mentions"
import { findMentions } from "@/lib/os/mentions"

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
