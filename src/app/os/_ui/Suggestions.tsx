"use client"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Suggestion } from "@/lib/os/graph"
import { addNextStep, draftFromEntry } from "@/lib/os/actions"
import { Icon, type IconName } from "./icons"
import { toast } from "./Toast"

const KEY = "os-dismissed"
const IC: Record<Suggestion["kind"], [IconName, string]> = {
  overdue: ["clock", "warn"], followup: ["chat", "acc"], quiet: ["people", ""], stalled: ["flag", ""], stuck: ["board", "warn"], seed: ["pen", "acc"], next: ["arrow", "acc"],
}

/** Read and prune dismissals; each one hides a suggestion for a week. */
function dismissed(): Record<string, number> {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, number>
    const now = Date.now(), keep: Record<string, number> = {}
    for (const [k, t] of Object.entries(all)) if (now - t < 7 * 864e5) keep[k] = t
    return keep
  } catch { return {} }
}

export default function Suggestions({ items, limit = 6 }: { items: Suggestion[]; limit?: number }) {
  const [hidden, setHidden] = useState<Record<string, number> | null>(null)
  const [all, setAll] = useState(false)
  useEffect(() => setHidden(dismissed()), [])
  if (!hidden) return null
  const shown = items.filter(s => !hidden[s.key])
  if (!shown.length) return null
  const dismiss = (k: string) => { const n = { ...hidden, [k]: Date.now() }; setHidden(n); try { localStorage.setItem(KEY, JSON.stringify(n)) } catch {} }
  return (
    <section className="card">
      <div className="ch"><h2><Icon name="sparkle" />Worth a look</h2><span className="meta">{shown.length}</span></div>
      <ul className="sugg" style={{ padding: 6 }}>
        {(all ? shown : shown.slice(0, limit)).map(s => <Row key={s.key} s={s} onDismiss={() => dismiss(s.key)} />)}
      </ul>
      {shown.length > limit && <div className="addrow"><button className="btn ghost sm" onClick={() => setAll(a => !a)}>{all ? "Show fewer" : `Show ${shown.length - limit} more`}</button></div>}
    </section>
  )
}

function Row({ s, onDismiss }: { s: Suggestion; onDismiss: () => void }) {
  const [ic, tone] = IC[s.kind]
  const [adding, setAdding] = useState(false)
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <li>
      <span className={`sg-ic ${tone}`}><Icon name={ic} size={14} /></span>
      {adding && s.projectId ? (
        <form className="inline" onSubmit={e => {
          e.preventDefault(); const v = new FormData(e.currentTarget).get("t") as string
          start(async () => { const r = await addNextStep(s.projectId!, v); if (r) { toast("Next step added"); onDismiss() } })
        }}>
          <input className="in" name="t" autoFocus placeholder={`Next step for ${s.text.replace(/ has no next step$/, "")}`} aria-label="Next step" style={{ height: 32 }}
            onKeyDown={e => { if (e.key === "Escape") setAdding(false) }} />
          <button className="btn pri sm" disabled={pending}>Add</button>
        </form>
      ) : (<>
        <div className="sg-t">{s.href ? <Link href={s.href}>{s.text}</Link> : <strong>{s.text}</strong>}{s.sub && <small>{s.sub}</small>}</div>
        <div className="sg-act">
          {s.kind === "next" && <button className="btn sm" onClick={() => setAdding(true)}>Add step</button>}
          {s.kind === "seed" && s.entryId && <button className="btn sm" disabled={pending} onClick={() => start(async () => {
            const r = await draftFromEntry(s.entryId!); if (r) { onDismiss(); router.push(`/os/drafts/${r.id}`) }
          })}>Start draft</button>}
          <button className="btn ghost sm" aria-label="Dismiss for a week" title="Hide for a week" onClick={onDismiss}><Icon name="x" size={14} /></button>
        </div>
      </>)}
    </li>
  )
}
