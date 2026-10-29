"use client"
import SmartInput, { dueText, type SmartHandle, type SmartValue } from "./SmartInput"
import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Suggestion } from "@/lib/os/graph"
import { addNextStep, draftFromEntry } from "@/lib/os/actions"
import { Icon, type IconName } from "./icons"
import { toast } from "./Toast"

const KEY = "os-dismissed"
const IC: Record<Suggestion["kind"], [IconName, string]> = {
  overdue: ["clock", "warn"], followup: ["chat", "acc"], quiet: ["people", ""], stalled: ["flag", ""], stuck: ["board", "warn"], seed: ["pen", "acc"], next: ["arrow", "acc"], sort: ["inbox", ""], person: ["people", "acc"],
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

export type Lead = { key: string; href: string; text: string; sub?: string; icon: IconName; cta?: { label: string; href: string } }

/** Today's single "Suggested" group: lead rows (focus, review, nudges) first, then graph suggestions; at most `limit` in total. */
export default function Suggestions({ items, lead = [], limit = 3 }: { items: Suggestion[]; lead?: Lead[]; limit?: number }) {
  const [hidden, setHidden] = useState<Record<string, number> | null>(null)
  useEffect(() => setHidden(dismissed()), [])
  const leads = lead.slice(0, limit)
  const shown = hidden ? items.filter(s => !hidden[s.key]).slice(0, Math.max(0, limit - leads.length)) : []
  if (!leads.length && !shown.length) return null
  const dismiss = (k: string) => { const n = { ...hidden, [k]: Date.now() }; setHidden(n); try { localStorage.setItem(KEY, JSON.stringify(n)) } catch {} }
  return (
    <section className="card sugg-card" aria-label="Suggested">
      <h2 className="sec-h sg-h">Suggested</h2>
      <ul className="sugg" style={{ padding: 6 }}>
        {leads.map(l => (
          <li key={l.key} data-lead={l.key}>
            <span className="sg-ic acc"><Icon name={l.icon} size={14} /></span>
            <div className="sg-t"><Link href={l.href}>{l.text}</Link>{l.sub && <small>{l.sub}</small>}</div>
            {l.cta && <div className="sg-act"><Link href={l.cta.href} className="btn pri sm">{l.cta.label}</Link></div>}
          </li>
        ))}
        {shown.map(s => <Row key={s.key} s={s} onDismiss={() => dismiss(s.key)} />)}
      </ul>
    </section>
  )
}

function Row({ s, onDismiss }: { s: Suggestion; onDismiss: () => void }) {
  const [ic, tone] = IC[s.kind]
  const [adding, setAdding] = useState(false)
  const [pending, start] = useTransition()
  const router = useRouter()
  const si = useRef<SmartHandle>(null)
  const go = (v: SmartValue) => { if (!v.title) return; start(async () => { const r = await addNextStep(s.projectId!, v.title, { due: v.due, repeat: v.repeat }); if (r) { toast(v.due ? `Next step added, due ${dueText(v.due)}` : "Next step added"); onDismiss() } }) }
  return (
    <li>
      <span className={`sg-ic ${tone}`}><Icon name={ic} size={14} /></span>
      {adding && s.projectId ? (
        <div className="inline sg-step">
          <SmartInput ref={si} autoFocus placeholder={`Next step for ${s.text.replace(/ has no next step$/, "")}. Try “… today”`} aria-label="Next step"
            onKeyDown={e => { if (e.key === "Escape") setAdding(false) }}
            onSubmit={v => go(v)} />
          <button className="btn pri sm" disabled={pending} onClick={() => si.current && go(si.current.value())}>Add</button>
        </div>
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
