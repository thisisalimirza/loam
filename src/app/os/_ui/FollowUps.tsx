"use client"
import { useEffect, useState } from "react"
import { makeTask } from "@/lib/os/actions"
import { Icon } from "./icons"
import { toast } from "./Toast"

/** Suggested follow-up tasks pulled from a logged conversation. Nothing is created until he taps Add. */
export default function FollowUps({ personId, convoId, items, title = "Suggested follow-ups" }: { personId: string; convoId: string; items: string[]; title?: string }) {
  const key = `os-fu-${convoId}`
  const [gone, setGone] = useState<string[] | null>(null)
  useEffect(() => { try { setGone(JSON.parse(localStorage.getItem(key) ?? "[]")) } catch { setGone([]) } }, [key])
  if (!gone) return null
  const left = items.filter(i => !gone.includes(i))
  if (!left.length) return null
  const hide = (i: string) => { const n = [...gone, i]; setGone(n); try { localStorage.setItem(key, JSON.stringify(n)) } catch {} }
  return (
    <section className="card">
      <div className="ch"><h2><Icon name="sparkle" />{title}</h2><button className="btn ghost sm" onClick={() => { left.forEach(hide) }}>Dismiss all</button></div>
      <ul className="sugg" style={{ padding: 6 }}>
        {left.map(i => (
          <li key={i}>
            <span className="sg-ic acc"><Icon name="check" size={14} /></span>
            <div className="sg-t"><strong title={i}>{i}</strong><small>Due in 3 days, linked to this person</small></div>
            <div className="sg-act">
              <button className="btn sm" onClick={async () => {
                const t = await makeTask(i, { followUp: true, personId, source: { type: "person", id: personId } })
                hide(i); if (t) toast({ text: `Added: ${t.title}`, href: `/os/board?open=${t.id}`, cta: "Open" })
              }}>Add</button>
              <button className="btn ghost sm" aria-label="Dismiss" onClick={() => hide(i)}><Icon name="x" size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
