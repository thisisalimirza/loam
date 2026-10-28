"use server"
import { parseTask } from "./parse"
import { db } from "./db"
import { requireOwner } from "./auth"
import { setStatus } from "./taskStatus"
import { normTask, type BoardTask } from "./board"
import { REPEATS } from "./dates"
import type { Activity, BoardColumn, BoardFilters, BoardView, CheckItem, Task, TaskStatus } from "./types"

type R<T> = { ok: true; data: T } | { ok: false; error: string }
async function run<T>(f: () => Promise<T>): Promise<R<T>> {
  try { await requireOwner(); return { ok: true, data: await f() } }
  catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e // redirects
    console.error("board action", e)
    return { ok: false, error: e instanceof Error && e.message.startsWith("!") ? e.message.slice(1) : "Couldn't save. Try again." }
  }
}
const uuid = (s: string) => { if (!/^[0-9a-f-]{36}$/i.test(s)) throw new Error("!Bad id"); return s }
const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : String(d))
const act = (a: Activity) => ({ ...a, created_at: iso(a.created_at) })

export async function bMove(id: string, columnId: string, sort: number) {
  return run(async () => {
    const sql = db()
    const [c] = await sql<{ kind: TaskStatus }[]>`select kind from loam_os.board_columns where id = ${uuid(columnId)}`
    if (!c) throw new Error("!That column is gone. Reload the board.")
    await sql`update loam_os.tasks set sort = ${sort} where id = ${uuid(id)}`
    const spawned = await setStatus(id, c.kind, columnId)
    const [t] = await sql<Task[]>`select * from loam_os.tasks where id = ${id}`
    return { task: t ? normTask(t) : null, spawned: spawned ? normTask(spawned) : null }
  })
}

export type Patch = Partial<Pick<Task, "title" | "notes" | "priority" | "due_date" | "scheduled_date" | "area_id" | "project_id" | "tags" | "checklist" | "repeat">>
export async function bUpdate(id: string, patch: Patch) {
  return run(async () => {
    const sql = db()
    const p: Record<string, unknown> = {}
    if (patch.title !== undefined) { const t = patch.title.trim().slice(0, 300); if (!t) throw new Error("!A task needs a title."); p.title = t }
    if (patch.notes !== undefined) p.notes = patch.notes.slice(0, 20000)
    if (patch.priority !== undefined) { if (!["urgent", "high", "normal", "low"].includes(patch.priority!)) throw new Error("!Bad priority"); p.priority = patch.priority }
    for (const k of ["due_date", "scheduled_date"] as const) if (patch[k] !== undefined) { const v = patch[k]; if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error("!Bad date"); p[k] = v || null }
    for (const k of ["area_id", "project_id"] as const) if (patch[k] !== undefined) p[k] = patch[k] ? uuid(patch[k]!) : null
    if (patch.tags !== undefined) p.tags = [...new Set(patch.tags!.map(t => t.trim().toLowerCase().replace(/^#/, "")).filter(Boolean))].slice(0, 12)
    if (patch.checklist !== undefined) p.checklist = JSON.stringify((patch.checklist as CheckItem[]).slice(0, 50).map(c => ({ text: String(c.text).slice(0, 200), done: !!c.done })))
    if (patch.repeat !== undefined) p.repeat = patch.repeat && (REPEATS as string[]).includes(patch.repeat) ? patch.repeat : null
    if (p.project_id && patch.area_id === undefined) {
      const [pr] = await sql<{ area_id: string | null }[]>`select area_id from loam_os.projects where id = ${p.project_id as string}`
      if (pr?.area_id) p.area_id = pr.area_id
    }
    const keys = Object.keys(p).filter(k => k !== "checklist")
    if (!keys.length && p.checklist === undefined) throw new Error("!Nothing to save")
    const cl = p.checklist as string | undefined
    const [t] = await sql<Task[]>`update loam_os.tasks set ${keys.length ? sql(p as Record<string, string>, keys) : sql`id = id`}
      ${cl !== undefined ? sql`, checklist = ${cl}::jsonb` : sql``} where id = ${uuid(id)} returning *`
    if (!t) throw new Error("!That task was deleted.")
    return normTask(t)
  })
}

export async function bCreate(title: string, columnId: string, extra: { area_id?: string | null; project_id?: string | null; tags?: string[]; priority?: string; due_date?: string | null; repeat?: string | null; parsed?: boolean } = {}) {
  return run(async () => {
    const sql = db()
    let t = title.trim().slice(0, 300)
    if (!extra.parsed && !extra.due_date) { const p = parseTask(t); t = p.title; extra = { ...extra, due_date: p.due, repeat: extra.repeat ?? p.repeat } }
    const repeat = ["daily", "weekdays", "weekly", "monthly", "yearly"].includes(extra.repeat ?? "") ? extra.repeat! : null
    if (!t) throw new Error("!Type a title first.")
    const [c] = await sql<{ kind: TaskStatus }[]>`select kind from loam_os.board_columns where id = ${uuid(columnId)}`
    if (!c) throw new Error("!That column is gone. Reload the board.")
    let area = extra.area_id ? uuid(extra.area_id) : null
    const project = extra.project_id ? uuid(extra.project_id) : null
    if (project && !area) { const [pr] = await sql<{ area_id: string | null }[]>`select area_id from loam_os.projects where id = ${project}`; area = pr?.area_id ?? null }
    const [min] = await sql<{ m: number | null }[]>`select min(sort) m from loam_os.tasks where column_id = ${columnId}`
    const pr = ["urgent", "high", "normal", "low"].includes(extra.priority ?? "") ? extra.priority! : "normal"
    const [row] = await sql<Task[]>`insert into loam_os.tasks (title, column_id, status, area_id, project_id, tags, priority, due_date, repeat, sort, done_at)
      values (${t}, ${columnId}, ${c.kind}, ${area}, ${project}, ${extra.tags ?? []}, ${pr}, ${extra.due_date || null}, ${repeat}, ${(min.m ?? 1000) - 1}, ${c.kind === "done" ? new Date() : null}) returning *`
    await sql`insert into loam_os.task_activity (task_id, kind, body) values (${row.id}, 'created', '')`
    return normTask(row)
  })
}

export async function bDelete(id: string) {
  return run(async () => { await db()`delete from loam_os.tasks where id = ${uuid(id)}`; return true })
}
export async function bArchiveDone() {
  return run(async () => {
    const r = await db()<{ id: string }[]>`update loam_os.tasks set archived_at = now() where status = 'done' and archived_at is null returning id`
    return r.map(x => x.id)
  })
}
export async function bUnarchiveAll() {
  return run(async () => {
    const r = await db()<Task[]>`update loam_os.tasks set archived_at = null where archived_at is not null returning *`
    return r.map(normTask) as BoardTask[]
  })
}

export async function bDep(taskId: string, blockedBy: string, on: boolean) {
  return run(async () => {
    const sql = db()
    uuid(taskId); uuid(blockedBy)
    if (!on) { await sql`delete from loam_os.task_deps where task_id = ${taskId} and blocked_by = ${blockedBy}`; return true }
    if (taskId === blockedBy) throw new Error("!A task can't wait on itself.")
    // Would blockedBy (directly or further down) already wait on taskId?
    const [loop] = await sql<{ n: number }[]>`with recursive up(id) as (
        select blocked_by from loam_os.task_deps where task_id = ${blockedBy}
        union select d.blocked_by from loam_os.task_deps d join up on d.task_id = up.id)
      select count(*)::int n from up where id = ${taskId}`
    if (loop.n) throw new Error("!That would make a loop: the other task already waits on this one.")
    await sql`insert into loam_os.task_deps (task_id, blocked_by) values (${taskId}, ${blockedBy}) on conflict do nothing`
    return true
  })
}

export async function bLink(taskId: string, kind: "person" | "note", refId: string, on: boolean) {
  return run(async () => {
    const sql = db()
    if (kind !== "person" && kind !== "note") throw new Error("!Bad link")
    if (on) await sql`insert into loam_os.task_links (task_id, kind, ref_id) values (${uuid(taskId)}, ${kind}, ${uuid(refId)}) on conflict do nothing`
    else await sql`delete from loam_os.task_links where task_id = ${uuid(taskId)} and kind = ${kind} and ref_id = ${uuid(refId)}`
    return true
  })
}

export async function bComment(taskId: string, body: string) {
  return run(async () => {
    const b = body.trim().slice(0, 4000)
    if (!b) throw new Error("!Write something first.")
    const [a] = await db()<Activity[]>`insert into loam_os.task_activity (task_id, kind, body) values (${uuid(taskId)}, 'comment', ${b}) returning *`
    return act(a)
  })
}
export async function bDeleteComment(id: string) {
  return run(async () => { await db()`delete from loam_os.task_activity where id = ${uuid(id)} and kind = 'comment'`; return true })
}

export async function bDetail(taskId: string) {
  return run(async () => {
    const sql = db()
    const [activity, links] = await Promise.all([
      sql<Activity[]>`select * from loam_os.task_activity where task_id = ${uuid(taskId)} order by created_at`,
      sql<{ kind: "person" | "note"; ref_id: string }[]>`select kind, ref_id from loam_os.task_links where task_id = ${taskId}`,
    ])
    return { activity: activity.map(act), links: [...links] }
  })
}

export async function bColumnSave(c: { id?: string; name: string; kind: TaskStatus; wip: number | null }) {
  return run(async () => {
    const sql = db()
    const name = c.name.trim().slice(0, 40)
    if (!name) throw new Error("!Give the column a name.")
    if (!["todo", "doing", "done"].includes(c.kind)) throw new Error("!Bad column type")
    const wip = c.wip && c.wip > 0 ? Math.min(99, Math.floor(c.wip)) : null
    if (c.id) {
      const [r] = await sql<BoardColumn[]>`update loam_os.board_columns set name = ${name}, kind = ${c.kind}, wip = ${wip} where id = ${uuid(c.id)} returning id, name, kind, wip, sort`
      await sql`update loam_os.tasks set status = ${c.kind}, done_at = case when ${c.kind} = 'done' then coalesce(done_at, now()) else null end where column_id = ${c.id} and status <> ${c.kind}`
      return r
    }
    const [r] = await sql<BoardColumn[]>`insert into loam_os.board_columns (name, kind, wip, sort)
      values (${name}, ${c.kind}, ${wip}, (select coalesce(max(sort), 0) + 1 from loam_os.board_columns)) returning id, name, kind, wip, sort`
    return r
  })
}
export async function bColumnOrder(ids: string[]) {
  return run(async () => {
    const sql = db()
    await Promise.all(ids.map((id, i) => sql`update loam_os.board_columns set sort = ${i + 1} where id = ${uuid(id)}`))
    return true
  })
}
/** Deletes a column; its tasks move to the first other column of the same type (or the first column). */
export async function bColumnDelete(id: string) {
  return run(async () => {
    const sql = db()
    const cols = await sql<BoardColumn[]>`select id, name, kind, wip, sort from loam_os.board_columns order by sort`
    if (cols.length <= 1) throw new Error("!The board needs at least one column.")
    const me = cols.find(c => c.id === uuid(id))
    if (!me) return null
    const to = cols.find(c => c.id !== id && c.kind === me.kind) ?? cols.find(c => c.id !== id)!
    await sql`update loam_os.tasks set column_id = ${to.id}, status = ${to.kind} where column_id = ${id}`
    await sql`delete from loam_os.board_columns where id = ${id}`
    return to.id
  })
}

export async function bViewSave(name: string, filters: BoardFilters) {
  return run(async () => {
    const n = name.trim().slice(0, 40)
    if (!n) throw new Error("!Name the view.")
    const clean: BoardFilters = {}
    for (const k of ["areas", "projects", "tags", "priorities"] as const) if (filters[k]?.length) clean[k] = filters[k]!.map(String).slice(0, 30)
    if (filters.due) clean.due = filters.due
    const [v] = await db()<BoardView[]>`insert into loam_os.board_views (name, filters) values (${n}, ${JSON.stringify(clean)}::jsonb) returning id, name, filters`
    return v
  })
}
export async function bViewDelete(id: string) {
  return run(async () => { await db()`delete from loam_os.board_views where id = ${uuid(id)}`; return true })
}
