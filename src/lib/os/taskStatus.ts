import "server-only"
import { db } from "./db"
import { nextDate, todayISO } from "./dates"
import type { Task, TaskStatus } from "./types"

/**
 * Sets a task's status (and optionally its board column). Completing a repeating
 * task hands its rule to a fresh copy on the next date; that copy is returned.
 */
export async function setStatus(id: string, status: TaskStatus, columnId?: string | null): Promise<Task | null> {
  const sql = db()
  const [t] = await sql<Task[]>`update loam_os.tasks set status = ${status},
    column_id = ${columnId === undefined ? sql`case when (select kind from loam_os.board_columns where id = column_id) = ${status} then column_id else (select id from loam_os.board_columns where kind = ${status} order by sort limit 1) end` : columnId},
    done_at = case when ${status} = 'done' then coalesce(done_at, now()) else null end where id = ${id} returning *`
  if (!t || status !== "done" || !t.repeat) return null
  const base = (d: string) => (d > todayISO() ? d : todayISO())
  const shift = (d: string | null) => (d ? nextDate(base(d), t.repeat!) : null)
  const due = t.due_date ? shift(t.due_date) : t.scheduled_date ? null : nextDate(todayISO(), t.repeat)
  const [n] = await sql<Task[]>`insert into loam_os.tasks (title, notes, area_id, project_id, due_date, scheduled_date, status, sort, repeat, priority, tags, checklist, column_id)
    values (${t.title}, ${t.notes}, ${t.area_id}, ${t.project_id}, ${due}, ${shift(t.scheduled_date)}, 'todo', extract(epoch from now()), ${t.repeat},
      ${t.priority ?? "normal"}, ${t.tags ?? []}, ${JSON.stringify((t.checklist ?? []).map(c => ({ text: c.text, done: false })))}::text::jsonb,
      (select id from loam_os.board_columns where kind = 'todo' order by sort limit 1)) returning *`
  await sql`update loam_os.tasks set repeat = null where id = ${id}`
  return n ?? null
}
