"use client"
import SmartInput, { type SmartHandle, type SmartValue } from "./SmartInput"
import Link from "next/link"
import { useOptimistic, useRef, useState, useTransition, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "./icons"
import Kanban from "./Kanban"
import { createTask, deleteTask, moveTask, renameTask, toggleTask } from "@/lib/os/actions"
import { relDue, REPEATS, REPEAT_LABEL } from "@/lib/os/dates"
import DateChip from "./DateChip"
import { toast } from "./Toast"
import { Mentions } from "./Mentions"
import { TASK_COLS, type Task, type TaskStatus } from "@/lib/os/types"

export type AreaLite = { id: string; name: string; color: string }
type Ctx = { areas: AreaLite[]; projects?: { id: string; name: string }[]; today: string }

function AreaPill({ id, areas }: { id: string | null; areas: AreaLite[] }) {
  const a = areas.find(x => x.id === id)
  if (!a) return null
  return <span className="pill" style={{ "--c": a.color } as CSSProperties}>{a.name}</span>
}

function DueLabel({ t, today }: { t: Task; today: string }) {
  const d = t.due_date ?? t.scheduled_date
  if (!d) return null
  const r = relDue(d, today)
  return <span className={`due${r.warn && t.status !== "done" ? " warn" : ""}`}>{t.due_date ? "" : "Planned "}{r.label}</span>
}

/** Quiet indicators: priority, checklist progress, notes. */
function Quiet({ t }: { t: Task }) {
  const c = Array.isArray(t.checklist) ? t.checklist : [], d = c.filter(i => i.done).length
  return <span className="qi">
    {(t.priority === "urgent" || t.priority === "high") && <span className={`qi-p p-${t.priority}`} aria-label={`${t.priority} priority`}>{t.priority === "urgent" ? "!!!" : "!!"}</span>}
    {c.length > 0 && <span className="qi-c" aria-label={`${d} of ${c.length} checklist items done`}><Icon name="list" size={12} />{d}/{c.length}</span>}
    {t.notes?.trim() && <span className="qi-n" aria-label="Has notes"><Icon name="pen" size={12} /></span>}
  </span>
}

export function TaskRow({ t, areas, today, hideArea }: { t: Task; areas: AreaLite[]; today: string; hideArea?: boolean }) {
  const [done, setDone] = useOptimistic(t.status === "done")
  const [, start] = useTransition()
  const [title, setTitle] = useOptimistic(t.title)
  const [editing, setEditing] = useState(false)
  const open = (id: string) => { const u = new URL(location.href); u.searchParams.set("task", id); window.history.pushState(null, "", u.pathname + u.search) } // shallow: no server round trip, and it can't get stuck behind a pending refresh
  const save = (v: string) => {
    setEditing(false)
    const n = v.trim()
    if (n && n !== t.title) start(async () => { setTitle(n); await renameTask(t.id, n) })
  }
  return (
    <li className={`row hov trow${done ? " done" : ""}`}>
      <button className="chk" aria-label={done ? "Mark not done" : "Mark done"} onClick={() => start(async () => {
        setDone(!done)
        const next = await toggleTask(t.id, !done)
        if (!done) toast(next ? { text: `Done. Next up: ${next.title}`, href: `?task=${next.id}`, cta: "Open" } : t.repeat ? "Done. The next one is scheduled." : "Done.")
      })} />
      {editing
        ? <input className="in tt" autoFocus defaultValue={title} aria-label="Edit task"
            onBlur={e => save(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false) }} />
        : <button type="button" className="tt" aria-label={`Open ${title}`} onClick={() => open(t.id)} onDoubleClick={() => setEditing(true)}><Mentions text={title} />{t.repeat && <span className="rep" title={`Repeats ${t.repeat}`}> ↻</span>}<Quiet t={t} /></button>}
      <span className="rmeta">{!hideArea && <AreaPill id={t.area_id} areas={areas} />}<DueLabel t={t} today={today} /></span>
      <button className="x" aria-label="Delete task" onClick={() => start(() => deleteTask(t.id))}><Icon name="x" size={14} /></button>
    </li>
  )
}

export function AddTask({ areaId, projectId, areas, projects, status, placeholder = "Add a task. Try “Call mom fri” or “Gym every mon”" }: { areaId?: string; projectId?: string; status?: TaskStatus; placeholder?: string } & Partial<Ctx>) {
  const [open, setOpen] = useState(false)
  const [v, setV] = useState<SmartValue | null>(null)
  const box = useRef<HTMLFormElement>(null)
  const si = useRef<SmartHandle>(null)
  const [due, setDue] = useState(""), [rep, setRep] = useState("")
  const showArea = !areaId && !projectId && areas && areas.length > 0
  const showProj = projects && projects.length > 0 && !projectId && !v?.project
  return (
    <form ref={box} className={`addrow smart-add${open ? " open" : ""}`}
      onFocus={() => setOpen(true)}
      onBlur={e => { if (!box.current?.contains(e.relatedTarget as Node) && !si.current?.value().raw) setOpen(false) }}
      action={async f => {
        if (due) f.set("due_date", due); if (rep) f.set("repeat", rep)
        await createTask(f); si.current?.clear(); setDue(""); setRep("")
      }}>
      <div className="sa-main">
        <SmartInput ref={si} names placeholder={placeholder} aria-label="Task title" onValue={setV} />
        {v?.title && <button className="btn pri sm">Add</button>}
      </div>
      {areaId && <input type="hidden" name="area_id" value={areaId} />}
      {projectId && <input type="hidden" name="project_id" value={projectId} />}
      {status && <input type="hidden" name="status" value={status} />}
      {open && (showArea || showProj || !v?.due || !v?.repeat) && (
        <div className="sa-opts">
          {showArea && <select className="in" name="area_id" defaultValue="" aria-label="Area">
            <option value="">Inbox</option>{areas!.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>}
          {showProj && <select className="in" name="project_id" defaultValue="" aria-label="Project">
            <option value="">No project</option>{projects!.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>}
          {!v?.due && <DateChip label="Due" value={due} onChange={d => setDue(d ?? "")} />}
          {!v?.repeat && <select className="in" value={rep} onChange={e => setRep(e.target.value)} aria-label="Repeat">
            <option value="">Doesn’t repeat</option>{REPEATS.map(r => <option key={r} value={r}>{REPEAT_LABEL[r]}</option>)}
          </select>}
        </div>
      )}
    </form>
  )
}

export function TaskList({ tasks: all, areas, today, hideArea, unfiledOnly, emptyTitle = "Nothing here", emptyText }: { tasks: Task[]; hideArea?: boolean; unfiledOnly?: boolean; emptyTitle?: string; emptyText?: string } & Ctx) {
  // In the inbox a task leaves the list the moment it gets an area or project.
  const tasks = unfiledOnly ? all.filter(t => !t.area_id && !t.project_id) : all
  if (tasks.length === 0) return <div className="empty"><Icon name="check" className="ic" /><strong>{emptyTitle}</strong>{emptyText && <p>{emptyText}</p>}</div>
  return <ul>{tasks.map(t => <TaskRow key={t.id} t={t} areas={areas} today={today} hideArea={hideArea} />)}</ul>
}

export function TaskBoard({ tasks, areas, today, areaId, projectId }: { tasks: Task[]; areaId?: string; projectId?: string } & Ctx) {
  const router = useRouter()
  const items = tasks.map(t => ({ ...t, col: t.status }))
  return (
    <Kanban cols={TASK_COLS} items={items}
      onMove={async (id, col, sort) => { await moveTask(id, col as TaskStatus, sort); router.refresh() }}
      render={t => (
        <>
          <div className="kt">{t.title}</div>
          {(t.area_id || t.due_date || t.scheduled_date) && <div className="km"><AreaPill id={t.area_id} areas={areas} /><DueLabel t={t} today={today} /></div>}
        </>
      )}
      footer={col => col === "done" ? null : (
        <form className="coladd" action={createTask} onSubmit={e => { const f = e.currentTarget; setTimeout(() => f.reset(), 0) }}>
          <input className="in" name="title" placeholder="Add a card" aria-label={`Add to ${col}`} required />
          <input type="hidden" name="status" value={col} />
          {areaId && <input type="hidden" name="area_id" value={areaId} />}
          {projectId && <input type="hidden" name="project_id" value={projectId} />}
          <button className="btn sm" aria-label="Add"><Icon name="plus" /></button>
        </form>
      )}
    />
  )
}

export function ViewToggle({ base, view }: { base: string; view: string }) {
  const sep = base.includes("?") ? "&" : "?"
  return (
    <nav className="seg">
      <Link href={`${base}${sep}view=list`} className={view === "list" ? "on" : ""}>List</Link>
      <Link href={`${base}${sep}view=board`} className={view === "board" ? "on" : ""}>Board</Link>
    </nav>
  )
}
