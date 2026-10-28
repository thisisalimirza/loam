"use client"
import SmartInput, { type SmartHandle } from "./SmartInput"
import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Icon } from "./icons"
import { capture, searchAll } from "@/lib/os/actions"
import { recentItems, remember, type Recent } from "./recent"

const OPEN = "loam:capture"
const KIND_HREF: Record<string, string> = { task: "/os/tasks", person: "/os/people/", note: "/os/notes/", area: "/os/areas/", draft: "/os/drafts/" }
const JUMPS = [
  { label: "Write in the journal", href: "/os/journal/write", key: "⌘J" },
  { label: "Tasks board", href: "/os/tasks?view=board" },
  { label: "Drafts", href: "/os/drafts" },
  { label: "People", href: "/os/people" },
]

type Hit = { kind: string; id: string; title: string }

function Trigger() {
  return (
    <button className="cmd" onClick={() => window.dispatchEvent(new Event(OPEN))}>
      <Icon name="search" /><span>Search or capture</span><kbd>⌘K</kbd>
    </button>
  )
}

// Pages that have their own add field: one add per page, so the floating bar steps aside (⌘K still works).
const OWN_ADD = [/^\/os\/tasks$/, /^\/os\/drafts$/, /^\/os\/people$/, /^\/os\/inbox$/, /^\/os\/notes$/, /^\/os\/areas\/[^/]+$/, /^\/os\/projects\/[^/]+$/, /^\/os\/board$/]

export default function Capture() {
  const pathname = usePathname()
  const ownAdd = OWN_ADD.some(r => r.test(pathname))
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<Hit[]>([])
  const [sel, setSel] = useState(0)
  const [rec, setRec] = useState<Recent[]>([])
  const [flash, setFlash] = useState("")
  const [pending, start] = useTransition()
  const router = useRouter()
  const si = useRef<SmartHandle>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(o => !o) }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") { e.preventDefault(); router.push("/os/journal/write") }
      if (e.key === "Escape") setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN, onOpen)
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(OPEN, onOpen) }
  }, [router])

  useEffect(() => { if (open) { setQ(""); setHits([]); setSel(0); setRec(recentItems(5)); setTimeout(() => si.current?.focus(), 10) } }, [open])

  useEffect(() => {
    if (!open || q.trim().length < 2 || q.includes(":")) { setHits([]); return }
    const t = setTimeout(() => { searchAll(q).then(setHits).catch(() => setHits([])) }, 160)
    return () => clearTimeout(t)
  }, [q, open])

  const jumps = q ? JUMPS.filter(j => j.label.toLowerCase().includes(q.toLowerCase())) : JUMPS
  const items: { label: string; sub: string; go: () => void }[] = [
    ...(q.trim() ? [{ label: `Add “${q.trim()}”`, sub: q.includes(":") ? "" : "Inbox", go: () => submit() }] : []),
    ...(q.trim() ? [] : rec.map(r => ({ label: r.title!, sub: "Recent " + r.kind, go: () => { setOpen(false); remember(r.kind, r.id, r.title); router.push(r.kind === "task" ? `${location.pathname}?task=${r.id}` : KIND_HREF[r.kind] + r.id) } }))),
    ...hits.map(h => ({ label: h.title, sub: h.kind, go: () => { setOpen(false); remember(h.kind, h.id, h.title); router.push(h.kind === "task" ? `${location.pathname}?task=${h.id}` : KIND_HREF[h.kind] + h.id) } })),
    ...jumps.map(j => ({ label: j.label, sub: j.key ?? "Go", go: () => { setOpen(false); router.push(j.href) } })),
  ]

  function submit() {
    const text = q.trim(); if (!text) return
    start(async () => {
      const v = si.current?.value()
      const r = await capture(text, v && !/^\w+:/.test(text) ? { title: v.title, due: v.due, repeat: v.repeat } : undefined)
      setOpen(false)
      if (r.href) router.push(r.href)
      else { setFlash("Added to Inbox"); router.refresh(); setTimeout(() => setFlash(""), 1800) }
    })
  }

  return (
    <>
      {!ownAdd && <button className="capture" onClick={() => setOpen(true)}>
        <Icon name="plus" /><span>{flash || "Add a task, note, or person…"}</span><kbd>⌘K</kbd>
      </button>}
      {open && (
        <div className="modal-bg" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="modal" role="dialog" aria-label="Capture">
            <div className="mi">
              <Icon name="plus" />
              <SmartInput ref={si} autoFocus dates={!/^\w+:/.test(q)} placeholder="Add a task, or type to search…" aria-label="Capture or search" onValue={v => { if (v.raw !== q) { setQ(v.raw); setSel(0) } }}
                onKeyDown={e => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, items.length - 1)) }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
                  if (e.key === "Enter") { e.preventDefault(); items[sel]?.go() }
                }} disabled={pending} />
              <kbd>esc</kbd>
            </div>
            <ul>
              {items.map((it, i) => (
                <li key={i}><button className={i === sel ? "on" : ""} onMouseEnter={() => setSel(i)} onClick={it.go}>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span><small>{it.sub}</small>
                </button></li>
              ))}
            </ul>
            <div className="hint"><span>Dates like “fri” or “every mon” are picked up as you type</span><span>note: · person: · draft:</span></div>
          </div>
        </div>
      )}
    </>
  )
}
Capture.Trigger = Trigger
