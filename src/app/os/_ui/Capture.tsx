"use client"
import SmartInput, { type SmartHandle } from "./SmartInput"
import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Icon } from "./icons"
import { capture, captureHints, searchAll } from "@/lib/os/actions"
import { recentItems, remember, type Recent } from "./recent"

const OPEN = "loam:capture"
const KIND_HREF: Record<string, string> = { task: "/os/tasks", person: "/os/people/", note: "/os/notes/", area: "/os/areas/", draft: "/os/drafts/" }
const JUMPS = [
  { label: "Write in the journal", href: "/os/journal/write", key: "⌘J" },
  { label: "Tasks board", href: "/os/tasks?view=board" },
  { label: "Drafts", href: "/os/drafts" },
  { label: "People", href: "/os/people" },
]

/** Open the task panel over the current page (shallow URL change, no server round trip). */
const openTask = (id: string) => { const u = new URL(location.href); u.searchParams.set("task", id); window.history.pushState(null, "", u.pathname + u.search) }

type Hit = { kind: string; id: string; title: string }

function Trigger() {
  return (
    <button className="cmd" onClick={() => window.dispatchEvent(new Event(OPEN))}>
      <Icon name="search" /><span>Search or capture</span><kbd>⌘K</kbd>
    </button>
  )
}

const KINDS = [
  { k: "task", label: "Task", prefix: "", ph: "Add a task, or type to search…" },
  { k: "note", label: "Note", prefix: "note: ", ph: "Note title" },
  { k: "person", label: "Person", prefix: "person: ", ph: "Name" },
  { k: "draft", label: "Draft", prefix: "draft: ", ph: "Idea or working title" },
] as const

export default function Capture() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<(typeof KINDS)[number]>(KINDS[0])
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<Hit[]>([])
  const [sel, setSel] = useState(0)
  const [rec, setRec] = useState<Recent[]>([])
  const [hint, setHint] = useState<Hit[]>([])
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

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => { if (open) { setKind(KINDS[0]); setQ(""); setHits([]); setSel(0); setRec(recentItems(3)); captureHints().then(setHint).catch(() => setHint([])); setTimeout(() => si.current?.focus(), 10) } }, [open])

  useEffect(() => {
    if (!open || q.trim().length < 2 || q.includes(":")) { setHits([]); return }
    const t = setTimeout(() => { searchAll(q).then(setHits).catch(() => setHits([])) }, 160)
    return () => clearTimeout(t)
  }, [q, open])

  const jumps = q.trim() ? JUMPS.filter(j => j.label.toLowerCase().includes(q.toLowerCase())) : []
  const SUB: Record<string, string> = { note: "Note", draft: "Draft", person: "Mentioned this week" }
  const hints = q.trim() ? [] : hint.filter(h => !rec.some(r => r.id === h.id))
  const items: { label: string; sub: string; go: () => void }[] = [
    ...(q.trim() ? [{ label: `Add “${q.trim()}”`, sub: q.includes(":") ? "" : kind.label, go: () => submit() }] : []),
    ...(q.trim() ? [] : rec.map(r => ({ label: r.title!, sub: "Recent " + r.kind, go: () => { setOpen(false); remember(r.kind, r.id, r.title); if (r.kind === "task") openTask(r.id); else router.push(KIND_HREF[r.kind] + r.id) } }))),
    ...hints.map(h => ({ label: h.title, sub: SUB[h.kind] ?? h.kind, go: () => { setOpen(false); remember(h.kind, h.id, h.title); router.push(KIND_HREF[h.kind] + h.id) } })),
    ...hits.map(h => ({ label: h.title, sub: h.kind, go: () => { setOpen(false); remember(h.kind, h.id, h.title); if (h.kind === "task") openTask(h.id); else router.push(KIND_HREF[h.kind] + h.id) } })),
    ...jumps.map(j => ({ label: j.label, sub: j.key ?? "Go", go: () => { setOpen(false); router.push(j.href) } })),
  ]

  function submit() {
    const raw = q.trim(); if (!raw) return
    const text = kind.prefix && !/^\w+:/.test(raw) ? kind.prefix + raw : raw
    start(async () => {
      const v = si.current?.value()
      const r = await capture(text, v && !kind.prefix && !/^\w+:/.test(text) ? { title: v.title, due: v.due, repeat: v.repeat } : undefined)
      setOpen(false)
      if (r.href) router.push(r.href)
      else { setFlash("Added"); router.refresh(); setTimeout(() => setFlash(""), 1800) }
    })
  }

  return (
    <>
      {/^\/os(\/(journal|notes|people|more))?$/.test(pathname) && <button className="capture" onClick={() => setOpen(true)}>
        <Icon name="plus" /><span>{flash || "Add a task, note, or person…"}</span>
      </button>}
      {open && (
        <div className="modal-bg" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="modal" role="dialog" aria-label="Capture">
            <div className="mi">
              <Icon name="plus" />
              <SmartInput ref={si} autoFocus dates={!kind.prefix && !/^\w+:/.test(q)} placeholder={kind.ph} aria-label="Capture or search" onValue={v => { if (v.raw !== q) { setQ(v.raw); setSel(0) } }}
                onKeyDown={e => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, items.length - 1)) }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
                  if (e.key === "Enter") { e.preventDefault(); items[sel]?.go() }
                }} disabled={pending} />
              <kbd className="kbd-hint">esc</kbd>
            </div>
            <div className="seg cap-kind" role="group" aria-label="Add as">{KINDS.map(x => <button key={x.k} className={x.k === kind.k ? "on" : ""} onClick={() => { setKind(x); si.current?.focus() }}>{x.label}</button>)}</div>
            <ul>
              {items.map((it, i) => (
                <li key={i}><button className={i === sel ? "on" : ""} onMouseEnter={() => setSel(i)} onClick={it.go}>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span><small>{it.sub}</small>
                </button></li>
              ))}
            </ul>
            {kind.k === "task" && <div className="hint kbd-hint"><span>Dates like “fri” or “every mon” are picked up as you type</span></div>}
          </div>
        </div>
      )}
    </>
  )
}
Capture.Trigger = Trigger
