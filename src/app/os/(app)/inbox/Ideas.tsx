"use client"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ideaTo } from "@/lib/os/actions"

/** Ideas captured with "idea: …". Each one gets turned into something or let go. */
export default function Ideas({ items }: { items: { id: string; title: string }[] }) {
  const router = useRouter(); const [pending, start] = useTransition()
  const go = (id: string, to: "task" | "draft" | "note" | "drop") => start(async () => { const r = await ideaTo(id, to); if (r.href) router.push(r.href); else router.refresh() })
  return (
    <ul aria-busy={pending}>
      {items.map(i => (
        <li key={i.id} className="row idea">
          <span className="tt">{i.title}</span>
          <span className="idea-acts">
            <button className="btn sm" onClick={() => go(i.id, "task")}>Task</button>
            <button className="btn sm" onClick={() => go(i.id, "draft")}>Draft</button>
            <button className="btn sm" onClick={() => go(i.id, "note")}>Note</button>
            <button className="btn sm ghost" aria-label={`Let go of ${i.title}`} onClick={() => go(i.id, "drop")}>×</button>
          </span>
        </li>
      ))}
    </ul>
  )
}
