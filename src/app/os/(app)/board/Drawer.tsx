"use client"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import type { BoardData, BoardTask } from "@/lib/os/board"
import type { Activity, BoardColumn, CheckItem, Priority } from "@/lib/os/types"
import Checklist from "./Checklist"
import { frequent, recent, remember } from "../../_ui/recent"
import { bCreate, bEditComment, bComment, bDelete, bDeleteComment, bDep, bDetail, bLink, bUpdate, type Patch } from "@/lib/os/boardActions"
import { REPEATS, REPEAT_LABEL } from "@/lib/os/dates"
import { Icon } from "../../_ui/icons"
import { MentionChips, Mentions } from "../../_ui/Mentions"
import { toast } from "../../_ui/Toast"
import DateChip from "../../_ui/DateChip"
import { dueText } from "../../_ui/SmartInput"
import { parseTask } from "@/lib/os/parse"
import { PRI, age } from "./Board"

type Dep = { task_id: string; blocked_by: string }

export default function Drawer({ task: t, data, cols, tasks, deps, onClose, onOpen, onChange, onDeps, onMove, onDeleted, fromBoard }: {
  task: BoardTask; data: BoardData; cols: BoardColumn[]; tasks: BoardTask[]; deps: Dep[]; today: string
  onClose: () => void; onOpen: (id: string) => void; onChange: (t: BoardTask) => void; onDeps: (d: Dep[]) => void
  onMove: (colId: string) => Promise<void>; onDeleted: () => void; fromBoard?: boolean
}) {
  const [moreOpen, setMoreOpen] = useState(() => !!(t.repeat || t.area_id && !t.project_id || (t.tags ?? []).length))
  const [activity, setActivity] = useState<Activity[] | null>(null)
  const [links, setLinks] = useState<{ kind: "person" | "note"; ref_id: string }[]>([])
  const [title, setTitle] = useState(t.title)
  const tp = useMemo(() => title === t.title ? { title, due: null, repeat: null, spans: [] } : parseTask(title.trim()), [title, t.title])
  const [notes, setNotes] = useState(t.notes ?? "")
  const [comment, setComment] = useState("")
  const [tagIn, setTagIn] = useState("")
  const [depQ, setDepQ] = useState("")
  const panel = useRef<HTMLElement>(null)

  useEffect(() => {
    let live = true
    bDetail(t.id).then(r => { if (live && r.ok) { setActivity(r.data.activity); setLinks(r.data.links) } })
    return () => { live = false }
  }, [t.id])
  useEffect(() => {
    const prev = document.body.style.overflow
    const docked = window.matchMedia("(min-width:1024px)").matches
    if (docked) document.body.classList.add("has-panel"); else document.body.style.overflow = "hidden"
    panel.current?.focus()
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !(e.target as HTMLElement).closest(".bd-dep-results")) onClose() }
    window.addEventListener("keydown", k)
    return () => { document.body.style.overflow = prev; document.body.classList.remove("has-panel"); window.removeEventListener("keydown", k) }
  }, [onClose])

  const seq = useRef(0)
  async function save(p: Patch, quiet = false) {
    const before = t, n = ++seq.current
    if (p.checklist !== undefined || p.priority !== undefined) onChange({ ...t, ...p } as BoardTask)
    const r = await bUpdate(t.id, p)
    if (!r.ok) { if (n === seq.current) onChange(before); toast({ text: r.error, tone: "err" }); return }
    // A newer edit is already on screen; an older reply must not roll it back.
    if (n === seq.current) onChange(r.data)
    if (!quiet) setActivity(a => a && [...a, { id: "local" + Date.now(), task_id: t.id, kind: "edit", body: Object.keys(p).join(", "), created_at: new Date().toISOString() }])
  }
  const col = cols.find(c => c.id === t.column_id && c.kind === t.status) ?? cols.find(c => c.kind === t.status)
  const projects = data.projects.filter(p => p.status !== "done" && (!t.area_id || !p.area_id || p.area_id === t.area_id))
  const checklist: CheckItem[] = Array.isArray(t.checklist) ? t.checklist : []
  const blockedBy = deps.filter(d => d.task_id === t.id).map(d => tasks.find(x => x.id === d.blocked_by)).filter(Boolean) as BoardTask[]
  const blocks = deps.filter(d => d.blocked_by === t.id).map(d => tasks.find(x => x.id === d.task_id)).filter(Boolean) as BoardTask[]
  const depGroups = useMemo(() => {
    const q = depQ.trim().toLowerCase()
    const taken = new Set([t.id, ...blockedBy.map(b => b.id)])
    const pool = tasks.filter(x => !taken.has(x.id) && x.status !== "done")
    if (q) return [{ h: "", items: pool.filter(x => x.title.toLowerCase().includes(q)).slice(0, 8) }]
    const used = new Set<string>(); const take = (l: BoardTask[], n = 4) => l.filter(x => !used.has(x.id)).slice(0, n).map(x => (used.add(x.id), x))
    const words = new Set(t.title.toLowerCase().split(/\W+/).filter(w => w.length > 3))
    const rec = recent("task")
    return [
      { h: t.project_id ? "Same project" : "Same area", items: take(pool.filter(x => t.project_id ? x.project_id === t.project_id : t.area_id && x.area_id === t.area_id)) },
      { h: "Recent", items: take(rec.map(id => pool.find(x => x.id === id)).filter(Boolean) as BoardTask[]) },
      { h: "Similar titles", items: take(pool.filter(x => x.title.toLowerCase().split(/\W+/).some(w => words.has(w)))) },
      { h: "Due before this", items: take(t.due_date ? pool.filter(x => x.due_date && x.due_date < t.due_date!).sort((a, b) => a.due_date!.localeCompare(b.due_date!)) : []) },
    ].filter(g => g.items.length)
  }, [depQ, tasks, t, blockedBy])
  const depHits = depGroups.flatMap(g => g.items)
  const [depOpen, setDepOpen] = useState(false)
  useEffect(() => { remember("task", t.id, t.title) }, [t.id, t.title])

  async function dep(other: string, on: boolean) {
    const r = await bDep(t.id, other, on)
    if (!r.ok) return toast({ text: r.error, tone: "err" })
    onDeps(on ? [...deps, { task_id: t.id, blocked_by: other }] : deps.filter(d => !(d.task_id === t.id && d.blocked_by === other)))
    setDepQ("")
  }
  async function link(kind: "person" | "note", id: string, on: boolean) {
    if (!id) return
    const r = await bLink(t.id, kind, id, on)
    if (!r.ok) return toast({ text: r.error, tone: "err" })
    setLinks(l => on ? [...l, { kind, ref_id: id }] : l.filter(x => !(x.kind === kind && x.ref_id === id)))
  }
  const personGroups = (() => {
    const free = data.people.filter(p => !links.some(l => l.kind === "person" && l.ref_id === p.id))
    const text = (t.title + " " + (t.notes ?? "")).toLowerCase(); const used = new Set<string>()
    const take = (l: typeof free) => l.filter(p => !used.has(p.id)).map(p => (used.add(p.id), p))
    const fq = frequent("person")
    return [
      { h: "Mentioned here", items: take(free.filter(p => text.includes(p.name.toLowerCase().split(" ")[0]))) },
      { h: "Recent", items: take(fq.map(id => free.find(p => p.id === id)).filter(Boolean) as typeof free).slice(0, 5) },
      { h: t.area_id ? "In this area" : "Everyone", items: take(t.area_id ? free.filter(p => (p as { area_id?: string | null }).area_id === t.area_id) : free) },
      { h: "Everyone else", items: take(free) },
    ].filter(g => g.items.length)
  })()
  const linkedPeople = links.filter(l => l.kind === "person").map(l => data.people.find(p => p.id === l.ref_id)).filter(Boolean) as { id: string; name: string }[]
  const linkedNotes = links.filter(l => l.kind === "note").map(l => data.notes.find(p => p.id === l.ref_id)).filter(Boolean) as { id: string; title: string }[]

  return (
    <div className="drawer-bg" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="drawer" ref={panel} tabIndex={-1} role="dialog" aria-label={t.title}>
        <header className="drawer-h">
          <button className="btn ghost sm" onMouseDown={e => e.preventDefault()} onClick={() => { setTitle(t.title); setNotes(t.notes ?? ""); onClose() }}>Cancel</button>
          <button className="btn ghost sm dr-done" onClick={() => { (document.activeElement as HTMLElement | null)?.blur(); setTimeout(onClose, 0) }}>Done</button>
        </header>
        <div className="drawer-b">
          <textarea className="dr-title" rows={1} value={title} aria-label="Title" onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur() } }}
            onBlur={() => {
              const v = title.trim(); if (!v || v === t.title) { setTitle(t.title); return }
              if (tp.due || tp.repeat) { setTitle(tp.title); save({ title: tp.title, ...(tp.due ? { due_date: tp.due } : {}), ...(tp.repeat ? { repeat: tp.repeat } : {}) } as Patch) }
              else save({ title: v })
            }} />
          {title !== t.title && (tp.due || tp.repeat) && <div className="sm-chips">
            {tp.due && <span className="chip on"><Icon name="calendar" size={12} />Due {dueText(tp.due)}</span>}
            {tp.repeat && <span className="chip on">↻ {REPEAT_LABEL[tp.repeat as keyof typeof REPEAT_LABEL]}</span>}
          </div>}
          <MentionChips text={`${t.title}\n${t.notes ?? ""}`} />

          <dl className="dr-props">
            {fromBoard && <><dt>Column</dt>
            <dd><select className="in" value={col?.id ?? ""} onChange={e => onMove(e.target.value)} aria-label="Column">{cols.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></dd></>}
            <dt>Priority</dt>
            <dd><div className="seg">{(Object.keys(PRI) as Priority[]).map(p => <button key={p} className={(t.priority ?? "normal") === p ? "on" : ""} onClick={() => save({ priority: p })}>{PRI[p].label}</button>)}</div></dd>
            <dt>Due</dt>
            <dd><DateChip label="Due" value={t.due_date ?? null} onChange={d => save({ due_date: d })} /></dd>
            <dt>Project</dt>
            <dd><select className="in" value={t.project_id ?? ""} onChange={e => save({ project_id: e.target.value || null })} aria-label="Project">
              <option value="">No project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></dd>
          </dl>

          <section className="dr-sec">
            <h3>Description</h3>
            <textarea className="in" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Details, links, @people, #projects"
              onBlur={() => { if (notes !== (t.notes ?? "")) save({ notes }) }} aria-label="Description" />
          </section>

          <section className="dr-sec">
            <h3>Checklist {checklist.length > 0 && <span className="meta">{checklist.filter(c => c.done).length}/{checklist.length}</span>}</h3>
            {checklist.length > 0 && <div className="dr-bar"><i style={{ width: `${(checklist.filter(c => c.done).length / checklist.length) * 100}%` }} /></div>}
            <Checklist items={checklist} onSave={next => save({ checklist: next }, true)} onPromote={async i => {
              const it = checklist[i]; const col = cols.find(c => c.kind === "todo") ?? cols[0]
              const r = await bCreate(it.text, col.id, { area_id: t.area_id, project_id: t.project_id, parsed: true })
              if (!r.ok) { toast({ text: r.error, tone: "err" }); return }
              await save({ checklist: checklist.filter((_, j) => j !== i) }, true); toast({ text: `“${it.text}” is now its own task` })
            }} />
          </section>

          <details className="dr-more" open={moreOpen} onToggle={e => setMoreOpen(e.currentTarget.open)}>
            <summary>More details</summary>
            <dl className="dr-props">
            <dt>Repeat</dt>
            <dd><select className="in" value={t.repeat ?? ""} onChange={e => save({ repeat: (e.target.value || null) as BoardTask["repeat"] })} aria-label="Repeat">
              <option value="">Never</option>{REPEATS.map(r => <option key={r} value={r}>{REPEAT_LABEL[r]}</option>)}</select></dd>
            <dt>Area</dt>
            <dd><select className="in" value={t.area_id ?? ""} onChange={e => save({ area_id: e.target.value || null })} aria-label="Area">
              <option value="">No area</option>{data.areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></dd>
            <dt>Tags</dt>
            <dd className="chips">
              {(t.tags ?? []).map(x => <span key={x} className="chip on">#{x}<button aria-label={`Remove ${x}`} onClick={() => save({ tags: (t.tags ?? []).filter(y => y !== x) })}><Icon name="x" size={11} /></button></span>)}
              <form onSubmit={e => { e.preventDefault(); if (tagIn.trim()) { save({ tags: [...(t.tags ?? []), tagIn] }); setTagIn("") } }}>
                <input className="in sm" value={tagIn} onChange={e => setTagIn(e.target.value)} placeholder="Add tag" aria-label="Add tag" />
              </form>
            </dd>
            </dl>
          <section className="dr-sec">
            <h3>Waiting on</h3>
            {blockedBy.length === 0 && <p className="meta">Nothing. Add a card this one can’t start without.</p>}
            <ul className="dr-links">{blockedBy.map(b => (
              <li key={b.id}><button className="lnk" onClick={() => onOpen(b.id)}><i className={`bd-kind k-${b.status}`} />{b.title}</button>
                <button className="bd-icon" aria-label="Remove dependency" onClick={() => dep(b.id, false)}><Icon name="x" size={12} /></button></li>
            ))}</ul>
            <div className="bd-dep">
              <input className="in" value={depQ} onChange={e => setDepQ(e.target.value)} placeholder="Search cards to wait on" aria-label="Search cards to wait on" onFocus={() => setDepOpen(true)} onBlur={() => setTimeout(() => setDepOpen(false), 150)}
                onKeyDown={e => { if (e.key === "Enter" && depHits[0]) { e.preventDefault(); dep(depHits[0].id, true) } if (e.key === "Escape") setDepQ("") }} />
              {(depOpen || depQ) && depHits.length > 0 && <ul className="bd-dep-results" aria-label="Suggestions">{depGroups.map(g => <li key={g.h || "hits"}>{g.h && <span className="pk-h">{g.h}</span>}<ul>{g.items.map(h => <li key={h.id}><button onMouseDown={e => e.preventDefault()} onClick={() => dep(h.id, true)}>{h.title}</button></li>)}</ul></li>)}</ul>}
            </div>
            {blocks.length > 0 && <>
              <h3 className="sub-h">Unblocks</h3>
              <ul className="dr-links">{blocks.map(b => <li key={b.id}><button className="lnk" onClick={() => onOpen(b.id)}><i className={`bd-kind k-${b.status}`} />{b.title}</button></li>)}</ul>
            </>}
          </section>

          <section className="dr-sec">
            <h3>People and notes</h3>
            <div className="chips">
              {linkedPeople.map(p => <span key={p.id} className="chip on"><Link href={`/os/people/${p.id}`}>{p.name}</Link><button aria-label={`Unlink ${p.name}`} onClick={() => link("person", p.id, false)}><Icon name="x" size={11} /></button></span>)}
              {linkedNotes.map(n => <span key={n.id} className="chip on"><Link href={`/os/notes/${n.id}`}>{n.title}</Link><button aria-label={`Unlink ${n.title}`} onClick={() => link("note", n.id, false)}><Icon name="x" size={11} /></button></span>)}
            </div>
            <div className="inline">
              {data.people.length > 0 && <select className="in" value="" onChange={e => { remember("person", e.target.value, data.people.find(p => p.id === e.target.value)?.name); link("person", e.target.value, true) }} aria-label="Link a person">
                <option value="">Link a person…</option>{personGroups.map(g => <optgroup key={g.h} label={g.h}>{g.items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>)}</select>}
              {data.notes.length > 0 && <select className="in" value="" onChange={e => link("note", e.target.value, true)} aria-label="Link a note">
                <option value="">Link a note…</option>{data.notes.filter(n => !linkedNotes.some(x => x.id === n.id)).map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select>}
            </div>
          </section>

          <section className="dr-sec">
            <h3>Activity</h3>
            {activity === null ? <p className="meta">Loading…</p> : (
              <ul className="dr-act">
                {activity.map(a => (
                  <li key={a.id} className={a.kind === "comment" ? "cmt" : ""}>
                    {a.kind === "comment" ? <><p><Mentions text={a.body} /></p><span className="meta">{age(a.created_at)} ago
                      <button className="lnk" onClick={async () => { const v = window.prompt("Edit comment", a.body); if (v == null || !v.trim() || v === a.body) return; const r = await bEditComment(a.id, v); if (r.ok) setActivity(x => x!.map(y => y.id === a.id ? { ...y, body: v.trim() } : y)) }}>Edit</button> <button className="lnk" onClick={async () => { const r = await bDeleteComment(a.id); if (r.ok) setActivity(x => x!.filter(y => y.id !== a.id)) }}>Delete</button></span></>
                      : <span className="meta">{a.kind === "created" ? `Created${a.body ? " " + a.body : ""}` : a.kind === "move" ? `Moved to ${a.body}` : `Edited ${a.body}`} · {age(a.created_at)} ago</span>}
                  </li>
                ))}
              </ul>
            )}
            <form className="dr-cmt" onSubmit={async e => {
              e.preventDefault(); if (!comment.trim()) return
              const r = await bComment(t.id, comment)
              if (!r.ok) return toast({ text: r.error, tone: "err" })
              setActivity(a => [...(a ?? []), r.data]); setComment("")
            }}>
              <textarea className="in" rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment" aria-label="Comment"
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit() }} />
              <button className="btn sm" disabled={!comment.trim()}>Comment</button>
            </form>
          </section>
          </details>
        </div>
        <footer className="drawer-f">
          <button className="btn sm danger" onClick={async () => {
            if (!window.confirm("Delete this card? This can’t be undone.")) return
            const r = await bDelete(t.id); if (r.ok) { onDeleted(); toast("Card deleted") } else toast({ text: r.error, tone: "err" })
          }}><Icon name="trash" size={14} />Delete</button>
          <span className="meta">Created {t.created_at ? age(t.created_at) + " ago" : ""}</span>
        </footer>
      </aside>
    </div>
  )
}
