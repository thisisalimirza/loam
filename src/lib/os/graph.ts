import "server-only"
import { cache } from "react"
import { db } from "./db"
import { addDays, todayISO } from "./dates"

/** People and projects that can be @/# mentioned anywhere. */
export const getMentionIndex = cache(async () => {
  const sql = db()
  const [people, projects] = await Promise.all([
    sql<{ id: string; name: string }[]>`select id, name from loam_os.people where status = 'active' order by length(name) desc`,
    sql<{ id: string; name: string }[]>`select id, name from loam_os.projects where status <> 'done' order by length(name) desc`,
  ])
  return { people: [...people], projects: [...projects] }
})

export type RelItem = { id: string; title: string; href: string; meta?: string }
export type Related = { tasks: RelItem[]; notes: RelItem[]; entries: RelItem[]; people: RelItem[]; projects: RelItem[]; drafts: RelItem[]; convos: RelItem[] }
const empty = (): Related => ({ tasks: [], notes: [], entries: [], people: [], projects: [], drafts: [], convos: [] })

// Regex fragments used in SQL. Names are escaped in SQL with regexp_replace.
const ESC = `regexp_replace(%s, '([.*+?^$(){}|\\[\\]\\\\])', '\\\\\\1', 'g')`
const esc = (col: string) => ESC.replace("%s", col)
/** SQL regex matching an @mention of a person row aliased `p`. */
const personRe = `'@(' || ${esc("p.name")} || '|' || ${esc("split_part(p.name, ' ', 1)")} || ')([^[:alnum:]]|$)'`
const projectRe = `'#(' || ${esc("j.name")} || '|' || ${esc("replace(lower(j.name), ' ', '-')")} || ')([^[:alnum:]]|$)'`
const firstLine = (s: string) => s.trim().split("\n")[0].replace(/^#+\s*/, "").slice(0, 90) || "Untitled"

type Kind = "person" | "project" | "note" | "entry" | "area" | "draft"

/** Everything in the other modules that points at (or is pointed at by) this entity. */
export async function getRelated(kind: Kind, id: string): Promise<Related> {
  const sql = db()
  const r = empty()
  const task = (t: { id: string; title: string; status: string; due_date: string | null }) =>
    ({ id: t.id, title: t.title, href: `?task=${t.id}`, meta: t.status === "done" ? "Done" : t.due_date ?? undefined })
  const entry = (e: { id: string; entry_date: string; body: string }) => ({ id: e.id, title: firstLine(e.body), href: `/os/journal/${e.id}`, meta: e.entry_date })
  const note = (n: { id: string; title: string }) => ({ id: n.id, title: n.title, href: `/os/notes/${n.id}` })
  const draft = (d: { id: string; title: string; body: string; channel: string }) => ({ id: d.id, title: d.title || firstLine(d.body), href: `/os/drafts/${d.id}`, meta: d.channel })

  if (kind === "person") {
    const [tasks, notes, entries, drafts, projects] = await Promise.all([
      sql.unsafe(`select distinct t.id, t.title, t.status, t.due_date::text from loam_os.tasks t, loam_os.people p where p.id = $1 and t.archived_at is null and
        ((t.title || ' ' || coalesce(t.notes, '')) ~* ${personRe} or exists (select 1 from loam_os.task_links l where l.task_id = t.id and l.kind = 'person' and l.ref_id = p.id)
        or exists (select 1 from loam_os.mentions m where m.person_id = p.id and m.source_type = 'task' and m.source_id::text = t.id::text)) order by t.status desc limit 12`, [id]),
      sql.unsafe(`select n.id, n.title from loam_os.notes n, loam_os.people p where p.id = $1 and ((n.title || ' ' || coalesce(n.body, '')) ~* ${personRe}
        or exists (select 1 from loam_os.links l where l.from_type='note' and l.from_id=n.id and l.to_type='person' and l.to_id=p.id)
        or exists (select 1 from loam_os.mentions m where m.person_id = p.id and m.source_type = 'note' and m.source_id::text = n.id::text)) order by n.updated_at desc limit 8`, [id]),
      sql.unsafe(`select e.id, e.entry_date::text, e.body from loam_os.journal_entries e, loam_os.people p where p.id = $1 and e.body ~* ${personRe} order by e.entry_date desc limit 8`, [id]),
      sql.unsafe(`select d.id, d.title, d.body, d.channel from loam_os.drafts d, loam_os.people p where p.id = $1 and (d.title || ' ' || d.body) ~* ${personRe} limit 6`, [id]),
      sql.unsafe(`select distinct j.id, j.name from loam_os.projects j join loam_os.tasks t on t.project_id = j.id, loam_os.people p where p.id = $1 and
        ((t.title || ' ' || coalesce(t.notes, '')) ~* ${personRe} or exists (select 1 from loam_os.task_links l where l.task_id = t.id and l.kind='person' and l.ref_id = p.id)) limit 6`, [id]),
    ])
    r.tasks = tasks.map(t => task(t as never)); r.notes = notes.map(n => note(n as never)); r.entries = entries.map(e => entry(e as never))
    r.drafts = drafts.map(d => draft(d as never)); r.projects = projects.map(j => ({ id: j.id, title: j.name, href: `/os/projects/${j.id}` }))
  }
  if (kind === "project") {
    const [notes, entries, people, drafts] = await Promise.all([
      sql.unsafe(`select n.id, n.title from loam_os.notes n, loam_os.projects j where j.id = $1 and (n.project_id = j.id or (n.title || ' ' || n.body) ~* ${projectRe}) order by n.updated_at desc limit 8`, [id]),
      sql.unsafe(`select e.id, e.entry_date::text, e.body from loam_os.journal_entries e, loam_os.projects j where j.id = $1 and e.body ~* ${projectRe} order by e.entry_date desc limit 8`, [id]),
      sql.unsafe(`select distinct p.id, p.name from loam_os.people p join loam_os.tasks t on t.project_id = $1 where (t.title || ' ' || coalesce(t.notes, '')) ~* ${personRe}
        or exists (select 1 from loam_os.task_links l where l.task_id = t.id and l.kind='person' and l.ref_id = p.id) limit 8`, [id]),
      sql.unsafe(`select d.id, d.title, d.body, d.channel from loam_os.drafts d, loam_os.projects j where j.id = $1 and (d.title || ' ' || d.body) ~* ${projectRe} limit 6`, [id]),
    ])
    r.notes = notes.map(n => note(n as never)); r.entries = entries.map(e => entry(e as never)); r.drafts = drafts.map(d => draft(d as never))
    r.people = people.map(p => ({ id: p.id, title: p.name, href: `/os/people/${p.id}` }))
  }
  if (kind === "note" || kind === "entry" || kind === "draft") {
    const table = kind === "note" ? "notes" : kind === "entry" ? "journal_entries" : "drafts"
    const text = kind === "entry" ? "x.body" : "x.title || ' ' || x.body"
    const [people, projects, tasks] = await Promise.all([
      sql.unsafe(`select p.id, p.name from loam_os.${table} x, loam_os.people p where x.id = $1 and ${text} ~* ${personRe}`, [id]),
      sql.unsafe(`select j.id, j.name from loam_os.${table} x, loam_os.projects j where x.id = $1 and ${text} ~* ${projectRe}`, [id]),
      sql`select t.id, t.title, t.status, t.due_date::text from loam_os.links l join loam_os.tasks t on t.id = l.to_id
        where l.from_type = ${kind} and l.from_id = ${id} and l.to_type = 'task' order by t.created_at desc limit 12`,
    ])
    r.people = people.map(p => ({ id: p.id, title: p.name, href: `/os/people/${p.id}` }))
    r.projects = projects.map(j => ({ id: j.id, title: j.name, href: `/os/projects/${j.id}` }))
    r.tasks = tasks.map(t => task(t as never))
    if (kind === "note") {
      const [n] = await sql<{ title: string }[]>`select title from loam_os.notes where id = ${id}`
      if (n && n.title.trim().length > 2) {
        const back = await sql<{ id: string; title: string }[]>`select id, title from loam_os.notes where id <> ${id} and body ilike ${"%[[" + n.title + "]]%"} limit 8`
        r.notes = back.map(note)
      }
    }
    if (kind === "draft") {
      const src = await sql<{ id: string; entry_date: string; body: string }[]>`select e.id, e.entry_date::text, e.body from loam_os.drafts d join loam_os.journal_entries e on e.id = d.source_entry_id where d.id = ${id}`
      r.entries = src.map(entry)
    }
  }
  if (kind === "area") {
    const [entries, drafts] = await Promise.all([
      sql`select e.id, e.entry_date::text, e.body from loam_os.journal_entries e where exists (select 1 from loam_os.projects j where j.area_id = ${id} and e.body ~* (${sql.unsafe(projectRe)}))
        order by e.entry_date desc limit 6`,
      sql`select d.id, d.title, d.body, d.channel from loam_os.drafts d where exists (select 1 from loam_os.projects j where j.area_id = ${id} and (d.title || ' ' || d.body) ~* (${sql.unsafe(projectRe)})) limit 6`,
    ])
    r.entries = entries.map(e => entry(e as never)); r.drafts = drafts.map(d => draft(d as never))
  }
  return r
}

// ---------- proactive suggestions for Today ----------

export type Suggestion = {
  key: string; kind: "overdue" | "followup" | "quiet" | "stalled" | "stuck" | "seed" | "next" | "sort" | "person"
  text: string; sub?: string; href?: string; projectId?: string; entryId?: string; personId?: string
}

export async function getSuggestions(): Promise<Suggestion[]> {
  const sql = db()
  const today = todayISO()
  const [overdue, follow, quiet, stuck, stalled, seeds, bare, [unsorted], sugg] = await Promise.all([
    sql<{ id: string; title: string; due_date: string }[]>`select id, title, due_date::text from loam_os.tasks
      where status <> 'done' and archived_at is null and due_date < ${today} order by due_date limit 5`,
    sql<{ id: string; name: string; follow_up: string }[]>`select id, name, follow_up::text from loam_os.people where status = 'active' and follow_up <= ${addDays(today, 1)} order by follow_up limit 5`,
    sql<{ id: string; name: string; last: string | null }[]>`select p.id, p.name, max(c.happened_on)::text last from loam_os.people p
      left join loam_os.conversations c on c.person_id = p.id where p.status = 'active' and p.follow_up is null group by p.id
      having max(c.happened_on) < ${addDays(today, -45)} order by max(c.happened_on) limit 3`,
    sql<{ id: string; title: string; days: number; col: string }[]>`select t.id, t.title, (current_date - t.status_changed_at::date) days, coalesce(c.name, 'Doing') col
      from loam_os.tasks t left join loam_os.board_columns c on c.id = t.column_id
      where t.status = 'doing' and t.archived_at is null and t.status_changed_at < now() - interval '7 days' order by t.status_changed_at limit 3`,
    sql<{ id: string; name: string; days: number }[]>`select j.id, j.name, (current_date - greatest(j.created_at, max(t.done_at), max(t.created_at))::date) days
      from loam_os.projects j left join loam_os.tasks t on t.project_id = j.id where j.status = 'active' group by j.id
      having greatest(j.created_at, max(t.done_at), max(t.created_at)) < now() - interval '14 days' and count(*) filter (where t.status <> 'done') > 0 limit 3`,
    sql<{ id: string; entry_date: string; body: string }[]>`select e.id, e.entry_date::text, e.body from loam_os.journal_entries e
      where e.entry_date >= ${addDays(today, -21)} and length(e.body) > 160
      and not exists (select 1 from loam_os.drafts d where d.source_entry_id = e.id) order by e.entry_date desc limit 2`,
    sql<{ id: string; name: string }[]>`select j.id, j.name from loam_os.projects j where j.status = 'active'
      and not exists (select 1 from loam_os.tasks t where t.project_id = j.id and t.status <> 'done' and t.archived_at is null) limit 3`,
    sql<{ n: number }[]>`select count(*)::int n from loam_os.tasks where area_id is null and project_id is null and status <> 'done' and archived_at is null`,
    sql<{ id: string; name: string; context: string | null }[]>`select id, name, context from loam_os.people where status = 'suggested' order by created_at desc limit 2`,
  ])
  const out: Suggestion[] = []
  for (const t of overdue) out.push({ key: `o:${t.id}:${t.due_date}`, kind: "overdue", text: t.title, sub: `Overdue since ${t.due_date}`, href: `?task=${t.id}` })
  for (const p of follow) out.push({ key: `f:${p.id}:${p.follow_up}`, kind: "followup", text: `Follow up with ${p.name}`, sub: p.follow_up < today ? `Since ${p.follow_up}` : p.follow_up === today ? "Today" : "Tomorrow", href: `/os/people/${p.id}`, personId: p.id })
  for (const b of bare) out.push({ key: `n:${b.id}`, kind: "next", text: `${b.name} has no next step`, sub: "Add one", projectId: b.id, href: `/os/projects/${b.id}` })
  for (const c of stuck) out.push({ key: `s:${c.id}`, kind: "stuck", text: c.title, sub: `${c.days} days in ${c.col}`, href: `?task=${c.id}` })
  for (const j of stalled) out.push({ key: `p:${j.id}:${Math.floor(j.days / 7)}`, kind: "stalled", text: `${j.name}: nothing done lately`, sub: `Nothing moved in ${j.days} days`, href: `/os/projects/${j.id}` })
  for (const p of quiet) out.push({ key: `q:${p.id}:${p.last}`, kind: "quiet", text: `Check in with ${p.name}`, sub: `Last talked ${p.last}`, href: `/os/people/${p.id}`, personId: p.id })
  if (unsorted?.n) out.push({ key: `u:${unsorted.n}`, kind: "sort", text: unsorted.n === 1 ? "1 task has no area yet" : `${unsorted.n} tasks have no area yet`, sub: "Sort them", href: "/os/inbox" })
  for (const p of sugg) out.push({ key: `m:${p.id}`, kind: "person", text: `Add ${p.name} to People?`, sub: (p.context ?? "From your notes").replace(/^Mentioned: /, "You wrote: ").slice(0, 80), href: "/os/people" })
  for (const e of seeds) out.push({ key: `d:${e.id}`, kind: "seed", text: firstLine(e.body), sub: `Journal, ${e.entry_date}. Could become a post`, href: `/os/journal/${e.id}`, entryId: e.id })
  return out
}

/** Next open task after one is completed: same project, then same area, soonest due first. */
export async function nextAfter(taskId: string) {
  const sql = db()
  const [n] = await sql<{ id: string; title: string }[]>`with t as (select project_id, area_id from loam_os.tasks where id = ${taskId})
    select x.id, x.title from loam_os.tasks x, t where x.id <> ${taskId} and x.status <> 'done' and x.archived_at is null
      and ((t.project_id is not null and x.project_id = t.project_id) or (t.area_id is not null and x.area_id = t.area_id))
    order by (x.project_id is not distinct from t.project_id) desc, x.status = 'doing' desc, x.due_date nulls last, x.sort limit 1`
  return n ?? null
}

/** Pulls likely action items out of free text (conversation follow-ups, notes, journal). No AI needed. */
export function extractActions(text: string): string[] {
  const out: string[] = []
  const verbs = /\b(send|email|text|call|intro|introduce|follow up|share|schedule|book|ask|check|review|write|read|finish|submit|reply|ping|draft|plan|set up|buy|pay)\b/i
  for (let line of text.split(/\n|(?<=[.!?])\s+/)) {
    line = line.trim()
    const bullet = /^([-*•]|\[ \]|\d+[.)])\s+/.test(line)
    line = line.replace(/^([-*•]|\[ \]|\d+[.)])\s+/, "").replace(/^(i|we)\s+(will|'ll|need to|should|must)\s+/i, "").replace(/^(todo|to do|next|action)\s*:\s*/i, "").trim()
    if (line.length < 4 || line.length > 160) continue
    if (bullet || verbs.test(line) || /\b(will|need to|should|todo|next step)\b/i.test(line)) out.push(line[0].toUpperCase() + line.slice(1).replace(/[.;]$/, ""))
  }
  return [...new Set(out)].slice(0, 6)
}
