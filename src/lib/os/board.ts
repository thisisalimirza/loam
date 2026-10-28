import "server-only"
import { db } from "./db"
import { requireOwner } from "./auth"
import type { Area, BoardColumn, BoardView, Project, Task } from "./types"

export type BoardTask = Task & { status_changed_at: string; created_at: string; archived_at: string | null }
export type BoardData = {
  columns: BoardColumn[]; tasks: BoardTask[]; deps: { task_id: string; blocked_by: string }[]
  areas: Area[]; projects: Project[]; views: BoardView[]
  people: { id: string; name: string }[]; notes: { id: string; title: string }[]
  archived: number
}

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : (d as string | null))

export function normTask(t: Task): BoardTask {
  return { ...t, status_changed_at: iso(t.status_changed_at) ?? new Date().toISOString(), created_at: iso(t.created_at) ?? "", archived_at: iso(t.archived_at ?? null),
    priority: t.priority ?? "normal", checklist: t.checklist ?? [], tags: t.tags ?? [] } as BoardTask
}

export async function getBoard(): Promise<BoardData> {
  await requireOwner()
  const sql = db()
  const [columns, tasks, deps, areas, projects, views, people, notes, [arch]] = await Promise.all([
    sql<BoardColumn[]>`select id, name, kind, wip, sort from loam_os.board_columns order by sort, created_at`,
    sql<Task[]>`select * from loam_os.tasks where archived_at is null order by sort, created_at`,
    sql<{ task_id: string; blocked_by: string }[]>`select task_id, blocked_by from loam_os.task_deps`,
    sql<Area[]>`select * from loam_os.areas where not archived order by sort, created_at`,
    sql<Project[]>`select * from loam_os.projects order by status, created_at`,
    sql<BoardView[]>`select id, name, filters from loam_os.board_views order by created_at`,
    sql<{ id: string; name: string }[]>`select id, name from loam_os.people where status = 'active' order by name`,
    sql<{ id: string; title: string }[]>`select id, title from loam_os.notes order by updated_at desc limit 300`,
    sql<{ n: number }[]>`select count(*)::int n from loam_os.tasks where archived_at is not null`,
  ])
  return { columns: [...columns], tasks: tasks.map(normTask), deps: [...deps], areas: [...areas], projects: [...projects], views: [...views], people: [...people], notes: [...notes], archived: arch.n }
}
