"use client"
import Link from "next/link"
import { useOptimistic, useState, useTransition, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "./icons"
import Kanban from "./Kanban"
import { createTask, deleteTask, moveTask, renameTask, toggleTask } from "@/lib/os/actions"
import { relDue } from "@/lib/os/dates"
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

export function TaskRow({ t, areas, today, hideArea }: { t: Task; areas: AreaLite[]; today: string; hideArea?: boolean }) {
  const [done, setDone] = useOptimistic(t.status === "done")
  const [, start] = useTransition()
  const [title, setTitle] = useOptimistic(t.title)
  const [editing, setEditing] = useState(false)
  const save = (v: string) => {
    setEditing(false)
    const n = v.trim()
    if (n && n !== t.title) start(async () => { setTitle(n); await renameTask(t.id, n) })
  }
  return (
    <li className={`row hov${done ? " done" : ""}`}>
      <button className="chk" aria-label={done ? "Mark not done" : "Mark done"} onClick={() => start(async () => { setDone(!done); await toggleTask(t.id, !done) })} />
      {editing
        ? <input className="in tt" autoFocus defaultValue={title} aria-label="Edit task"
            onBlur={e => save(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false) }} />
        : <button type="button" className="tt" title="Click to edit" onClick={() => setEditing(true)}>{title}</button>}
      {!hideArea && <AreaPill id={t.area_id} areas={areas} />}
      <DueLabel t={t} today={today} />
      <button className="x" aria-label="Delete task" onClick={() => start(() => deleteTask(t.id))}><Icon name="x" size={14} /></button>
    </li>
  )
}

export function AddTask({ areaId, projectId, areas, projects, status }: { areaId?: string; projectId?: string; status?: TaskStatus } & Partial<Ctx>) {
  return (
    <form className="addrow" action={async f => { await createTask(f); (document.activeElement as HTMLElement)?.blur?.() }}
      onSubmit={e => { const form = e.currentTarget; setTimeout(() => form.reset(), 0) }}>
      <input className="in" name="title" placeholder="Add a task" required aria-label="Task title" />
      {areaId && <input type="hidden" name="area_id" value={areaId} />}
      {projectId && <input type="hidden" name="project_id" value={projectId} />}
      {status && <input type="hidden" name="status" value={status} />}
      {!areaId && !projectId && areas && areas.length > 0 && (
        <select className="in" name="area_id" defaultValue="" aria-label="Area">
          <option value="">Inbox</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      )}
      {projects && projects.length > 0 && !projectId && (
        <select className="in" name="project_id" defaultValue="" aria-label="Project">
          <option value="">No project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      <input className="in" type="date" name="due_date" aria-label="Due date" />
      <button className="btn pri sm">Add</button>
    </form>
  )
}

export function TaskList({ tasks, areas, today, hideArea, emptyTitle = "Nothing here", emptyText }: { tasks: Task[]; hideArea?: boolean; emptyTitle?: string; emptyText?: string } & Ctx) {
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
