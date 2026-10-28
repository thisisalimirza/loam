import "server-only"
import { db } from "./db"
import { requireOwner } from "./auth"
import type { Area, Conversation, Draft, Entry, Note, Person, Pin, Project, Task } from "./types"

// Reads. Each one checks the session itself.

export async function getAreas(includeArchived = false) {
  await requireOwner()
  const sql = db()
  return includeArchived
    ? sql<Area[]>`select * from loam_os.areas order by archived, sort, created_at`
    : sql<Area[]>`select * from loam_os.areas where not archived order by sort, created_at`
}
export async function getArea(id: string) {
  await requireOwner()
  const [a] = await db()<Area[]>`select * from loam_os.areas where id = ${id}`
  return a ?? null
}
export async function getProjects(areaId?: string) {
  await requireOwner()
  const sql = db()
  return areaId
    ? sql<Project[]>`select * from loam_os.projects where area_id = ${areaId} order by status, created_at`
    : sql<Project[]>`select * from loam_os.projects order by status, created_at`
}
export async function getProject(id: string) {
  await requireOwner()
  const [p] = await db()<Project[]>`select * from loam_os.projects where id = ${id}`
  return p ?? null
}

type TaskFilter = { areaId?: string; projectId?: string; inbox?: boolean; openOnly?: boolean }
export async function getTasks(f: TaskFilter = {}) {
  await requireOwner()
  const sql = db()
  return sql<Task[]>`
    select * from loam_os.tasks where true
    ${f.areaId ? sql`and area_id = ${f.areaId}` : sql``}
    ${f.projectId ? sql`and project_id = ${f.projectId}` : sql``}
    ${f.inbox ? sql`and area_id is null and project_id is null` : sql``}
    ${f.openOnly ? sql`and status <> 'done'` : sql``}
    order by (status = 'done'), sort, coalesce(due_date, scheduled_date) nulls last, created_at`
}
export async function getTasksForDay(day: string) {
  await requireOwner()
  return db()<Task[]>`
    select * from loam_os.tasks
    where (status <> 'done' and (due_date <= ${day} or scheduled_date <= ${day}))
       or (status = 'done' and (done_at at time zone 'America/New_York')::date = ${day}::date)
    order by (status = 'done'), coalesce(due_date, scheduled_date), created_at`
}
export async function countInbox() {
  await requireOwner()
  const [r] = await db()<{ n: number }[]>`select count(*)::int n from loam_os.tasks where area_id is null and project_id is null and status <> 'done'`
  return r.n
}

export async function getPins() {
  await requireOwner()
  return db()<Pin[]>`select * from loam_os.pins order by pin_date`
}

export async function getPeople() {
  await requireOwner()
  return db()<(Person & { last_on: string | null; last_summary: string | null })[]>`
    select p.*, c.happened_on last_on, c.summary last_summary
    from loam_os.people p
    left join lateral (select happened_on, summary from loam_os.conversations where person_id = p.id order by happened_on desc, created_at desc limit 1) c on true
    where p.status = 'active'
    order by p.name`
}
/** People the app noticed in tasks, notes and journal entries, waiting for a yes/no. */
export async function getSuggestedPeople() {
  await requireOwner()
  return db()<{ id: string; name: string; role: string | null; context: string | null; mentions: { type: string; id: string; snippet: string }[] }[]>`
    select p.id, p.name, p.role, p.context,
      coalesce((select json_agg(json_build_object('type', m.source_type, 'id', m.source_id, 'snippet', m.snippet) order by m.created_at desc) from loam_os.mentions m where m.person_id = p.id), '[]') mentions
    from loam_os.people p where p.status = 'suggested' order by p.created_at desc limit 20`
}
export async function getMentions(personId: string) {
  await requireOwner()
  return db()<{ source_type: string; source_id: string; snippet: string; created_at: Date }[]>`
    select source_type, source_id, snippet, created_at from loam_os.mentions where person_id = ${personId} order by created_at desc limit 30`
}
export async function getFollowUps(day: string) {
  await requireOwner()
  return db()<(Person & { last_on: string | null; last_summary: string | null; last_update: string | null })[]>`
    select p.*, c.happened_on last_on, c.summary last_summary, c.their_update last_update
    from loam_os.people p
    left join lateral (select happened_on, summary, their_update from loam_os.conversations where person_id = p.id order by happened_on desc, created_at desc limit 1) c on true
    where p.status = 'active' and p.follow_up is not null and p.follow_up <= ${day}
    order by p.follow_up`
}
export async function getPerson(id: string) {
  await requireOwner()
  const sql = db()
  const [p] = await sql<Person[]>`select * from loam_os.people where id = ${id}`
  if (!p) return null
  const convos = await sql<Conversation[]>`select * from loam_os.conversations where person_id = ${id} order by happened_on desc, created_at desc`
  return { person: p, convos }
}

export async function getNotes() {
  await requireOwner()
  return db()<Note[]>`select * from loam_os.notes order by updated_at desc`
}
export async function getNote(id: string) {
  await requireOwner()
  const [n] = await db()<Note[]>`select * from loam_os.notes where id = ${id}`
  return n ?? null
}

export async function getEntries(q?: string) {
  await requireOwner()
  const sql = db()
  return q
    ? sql<Entry[]>`select * from loam_os.journal_entries where body ilike ${"%" + q + "%"} order by entry_date desc, created_at desc limit 200`
    : sql<Entry[]>`select * from loam_os.journal_entries where length(trim(body)) > 0 order by entry_date desc, created_at desc limit 200`
}
export async function getEntry(id: string) {
  await requireOwner()
  const [e] = await db()<Entry[]>`select * from loam_os.journal_entries where id = ${id}`
  return e ?? null
}
export async function getEntryForDay(day: string) {
  await requireOwner()
  const [e] = await db()<Entry[]>`select * from loam_os.journal_entries where entry_date = ${day} order by created_at limit 1`
  return e ?? null
}
/** Entries written on this calendar day a month, six months, or years ago. */
export async function getOnThisDay(day: string) {
  await requireOwner()
  return db()<Entry[]>`
    select * from loam_os.journal_entries
    where entry_date < ${day}::date and length(trim(body)) > 0 and (
      entry_date = (${day}::date - interval '1 month')::date or
      entry_date = (${day}::date - interval '6 months')::date or
      (extract(month from entry_date) = extract(month from ${day}::date) and extract(day from entry_date) = extract(day from ${day}::date))
    ) order by entry_date desc`
}

export async function getDrafts() {
  await requireOwner()
  return db()<Draft[]>`select * from loam_os.drafts order by sort, updated_at desc`
}
export async function getDraft(id: string) {
  await requireOwner()
  const [d] = await db()<Draft[]>`select * from loam_os.drafts where id = ${id}`
  return d ?? null
}
export async function getDraftsForEntry(entryId: string) {
  await requireOwner()
  return db()<Draft[]>`select * from loam_os.drafts where source_entry_id = ${entryId} order by created_at`
}

export async function search(q: string) {
  await requireOwner()
  const sql = db()
  const like = "%" + q + "%"
  return sql<{ kind: string; id: string; title: string }[]>`
    (select 'task' kind, id, title from loam_os.tasks where title ilike ${like} limit 5)
    union all (select 'person', id, name from loam_os.people where status = 'active' and name ilike ${like} limit 5)
    union all (select 'note', id, title from loam_os.notes where title ilike ${like} or body ilike ${like} limit 5)
    union all (select 'area', id, name from loam_os.areas where name ilike ${like} limit 5)
    union all (select 'draft', id, coalesce(nullif(title,''), left(body, 60)) from loam_os.drafts where title ilike ${like} or body ilike ${like} limit 5)`
}
