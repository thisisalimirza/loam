"use client"
import { useOptimistic, useTransition } from "react"
import { addReading, markRead } from "@/lib/os/actions"

type R = { id: string; title: string; url: string | null; read_at: string | null }
/** Papers and articles to read. Paste a link or a title; tick it off when it's read. */
export default function Reading({ items }: { items: R[] }) {
  const [list, setRead] = useOptimistic(items, (s, p: { id: string; read: boolean }) => s.map(r => r.id === p.id ? { ...r, read_at: p.read ? "x" : null } : r))
  const [, start] = useTransition()
  return (
    <>
      {list.length > 0 && <ul>{list.map(r => (
        <li key={r.id} className={`row${r.read_at ? " is-read" : ""}`}>
          <input type="checkbox" checked={!!r.read_at} aria-label={`Read: ${r.title}`} onChange={e => { const v = e.target.checked; start(async () => { setRead({ id: r.id, read: v }); await markRead(r.id, v) }) }} />
          {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="tt">{r.title}</a> : <span className="tt">{r.title}</span>}
        </li>
      ))}</ul>}
      <form action={addReading} className="add-row" onSubmit={e => { const f = e.currentTarget; setTimeout(() => f.reset(), 0) }}>
        <input name="text" className="in" placeholder="Paste a link or a title" aria-label="Add to reading list" required />
        <button className="btn sm">Add</button>
      </form>
    </>
  )
}
