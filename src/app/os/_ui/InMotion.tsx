"use client"
import Link from "next/link"
import React, { useRef, useState, useTransition, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import type { Motion, PinIdea } from "@/lib/os/motion"
import { addNextStep, pinDate, rollOver, toggleTask } from "@/lib/os/actions"
import { fmtDate, relDue } from "@/lib/os/dates"
import SmartInput, { dueText, type SmartHandle, type SmartValue } from "./SmartInput"
import { Icon } from "./icons"
import { toast } from "./Toast"

export function InMotion({ items, today }: { items: Motion[]; today: string }) {
  if (!items.length) return null
  return (
    <section className="motion" aria-label="In motion">
      <h2 className="sec-h">In motion</h2>
      <ul className="mo-grid">{items.map(m => <MoCard key={m.id} m={m} today={today} />)}</ul>
    </section>
  )
}

function MoCard({ m, today }: { m: Motion; today: string }) {
  const [pending, start] = useTransition()
  const [gone, setGone] = useState(false)
  const router = useRouter()
  const si = useRef<SmartHandle>(null)
  const add = (v: SmartValue) => { if (!v.title) return; start(async () => { await addNextStep(m.id, v.title, { due: v.due, repeat: v.repeat }); si.current?.clear(); toast(v.due ? `Next step added, due ${dueText(v.due)}` : "Next step added"); router.refresh() }) }
  const left = m.daysLeft === null ? null : m.daysLeft < 0 ? `${-m.daysLeft} days past due` : m.daysLeft === 0 ? "Due today" : `${m.daysLeft} ${m.daysLeft === 1 ? "day" : "days"} left`
  return (
    <li className="card mo" style={{ "--c": m.color ?? "var(--acc)" } as CSSProperties}>
      <div className="mo-h">
        <span className="dot" style={{ margin: 0 }} />
        <Link href={`/os/projects/${m.id}`} className="mo-n">{m.name}</Link>
        <span className="mo-why" tabIndex={0} aria-label={`Why this is here: ${m.why.join("; ")}`}>
          <Icon name="info" size={13} /><span className="mo-tip" role="tooltip"><b>Why it’s here</b>{m.why.map(w => <span key={w}>{w}</span>)}</span>
        </span>
      </div>
      <div className="mo-sub">{[m.area, left].filter(Boolean).join(" · ")}{m.due && <span className="meta"> · {fmtDate(m.due)}</span>}</div>
      {m.elapsed !== null && (
        <div className="mo-bar" title={`${Math.round(m.elapsed * 100)}% of the time gone · ${Math.round(m.progress * 100)}% of tasks done`}>
          <i className="done" style={{ width: `${m.progress * 100}%` }} /><i className="time" style={{ left: `${m.elapsed * 100}%` }} />
        </div>
      )}
      {m.next && !gone ? (
        <div className="mo-next">
          <button className="chk" aria-label={`Mark “${m.next.title}” done`} disabled={pending} onClick={() => start(async () => {
            setGone(true); const nx = await toggleTask(m.next!.id, true)
            toast(nx ? `Done. Next up: ${nx.title}` : "Done."); router.refresh(); setGone(false)
          })} />
          <span className="tt">{m.next.title}</span>
          {m.next.due_date && <span className={`due${relDue(m.next.due_date, today).warn ? " warn" : ""}`}>{relDue(m.next.due_date, today).label}</span>}
        </div>
      ) : (
        <div className="mo-add"><SmartInput ref={si} placeholder="What’s the next step?" aria-label={`Next step for ${m.name}`} onSubmit={add} disabled={pending} /></div>
      )}
      {m.risk && <p className="mo-risk"><Icon name="clock" size={12} />{m.risk}</p>}
    </li>
  )
}

export function PinIdeas({ ideas, children }: { ideas: PinIdea[]; children?: React.ReactNode }) {
  const [pending, start] = useTransition()
  const [hidden, setHidden] = useState<string[]>([])
  const left = ideas.filter(i => !hidden.includes(i.label + i.date))
  if (!left.length && !children) return null
  return (
    <div className="pin-ideas">
      {left.length > 0 && <span className="meta">Count down to:</span>}
      {left.map(i => (
        <button key={i.label + i.date} className="chip" disabled={pending} title={`From a ${i.from}`} onClick={() => start(async () => { setHidden(h => [...h, i.label + i.date]); await pinDate(i.label, i.date, i.area_id); toast(`Pinned ${i.label}`) })}>
          <Icon name="pin" size={12} />{i.label} · {fmtDate(i.date)}
        </button>
      ))}
      {children}
    </div>
  )
}

export function RollOver({ items }: { items: { id: string; title: string }[] }) {
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const router = useRouter()
  if (!items.length || done) return null
  return (
    <div className="rollover">
      <span>{items.length} unfinished from today. Move {items.length === 1 ? "it" : "them"} to tomorrow?</span>
      <button className="btn sm" disabled={pending} onClick={() => start(async () => { const n = await rollOver(items.map(i => i.id)); setDone(true); toast(`Moved ${n} to tomorrow`); router.refresh() })}>Roll over</button>
    </div>
  )
}
