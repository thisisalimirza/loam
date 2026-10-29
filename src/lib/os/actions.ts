"use server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { timingSafeEqual, createHash } from "node:crypto"
import { db, later } from "./db"
import { enrich } from "./enrich"
import { requireOwner } from "./auth"
import { createToken, SESSION_COOKIE, SESSION_TTL } from "./session"
import { parseTask } from "./parse"
import { addDays, todayISO, REPEATS, type Repeat } from "./dates"
import { setStatus } from "./taskStatus"
import { CHANNELS, type Channel, type Stage, type TaskStatus } from "./types"

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim()
const opt = (f: FormData, k: string) => str(f, k) || null
const back = () => revalidatePath("/os", "layout")

// ---------- session ----------

// Never let a slow database hold up sign-in
function within<T>(p: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), ms))])
}

export async function login(_prev: { error?: string } | undefined, f: FormData) {
  const h = await headers()
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown"
  const sql = db()
  // Rate limit lives in the database. If the database is down, sign-in still works
  // (so /admin stays usable) but without the limit, and the failure is logged.
  let dbOk = true
  try {
    const [{ n }] = await within(sql<{ n: number }[]>`
      select count(*)::int n from loam_os.login_attempts where ip = ${ip} and not ok and at > now() - interval '15 minutes'`.execute())
    if (n >= 5) return { error: "Too many attempts. Try again in 15 minutes." }
  } catch (e) {
    dbOk = false
    console.error("login: rate limit check failed", (e as { code?: string }).code ?? "unknown")
  }

  const real = process.env.ADMIN_PASSWORD
  if (!real || !process.env.SESSION_SECRET) return { error: "Sign-in isn't configured on this deployment." }
  const given = createHash("sha256").update(str(f, "password")).digest()
  const ok = timingSafeEqual(given, createHash("sha256").update(real).digest())
  if (dbOk) {
    try {
      await within(sql`insert into loam_os.login_attempts (ip, ok) values (${ip}, ${ok})`.execute())
      if (ok) await within(sql`delete from loam_os.login_attempts where (ip = ${ip} and not ok) or at < now() - interval '7 days'`.execute())
    } catch (e) { console.error("login: attempt log failed", (e as { code?: string }).code ?? "unknown") }
  }
  if (!ok) return { error: "That password didn't match." }

  const jar = await cookies()
  jar.set(SESSION_COOKIE, await createToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL,
  })
  redirect(safeNext(str(f, "next")))
}

function safeNext(next: string) {
  return /^\/(os|admin)(\/|$|\?)/.test(next) && !next.startsWith("//") ? next : "/os"
}

export async function logout() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  redirect("/os/login?out=1")
}

// ---------- areas, projects, pins ----------

export async function createArea(f: FormData) {
  await requireOwner()
  const name = str(f, "name"); if (!name) return
  await db()`insert into loam_os.areas (name, color, sort) values (${name}, ${str(f, "color") || "#4f5bd5"}, extract(epoch from now()))`
  back()
}
/** Creates only what he ticked in the starter picker. */
export async function createStarterAreas(picks: { name: string; color: string; projects: string[] }[]) {
  await requireOwner()
  const clean = picks.map(p => ({ name: p.name.trim().slice(0, 80), color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#4f5bd5", projects: p.projects.map(x => x.trim().slice(0, 120)).filter(Boolean).slice(0, 8) })).filter(p => p.name).slice(0, 8)
  await db().begin(async sql => {
    for (const [i, p] of clean.entries()) {
      const [a] = await sql`insert into loam_os.areas (name, color, sort) values (${p.name}, ${p.color}, extract(epoch from now()) + ${i}) returning id`
      for (const pr of p.projects) await sql`insert into loam_os.projects (name, area_id) values (${pr}, ${a.id})`
    }
  })
  back()
}
export async function updateArea(f: FormData) {
  await requireOwner()
  await db()`update loam_os.areas set name = ${str(f, "name")}, color = ${str(f, "color")} where id = ${str(f, "id")}`
  back()
}
export async function archiveArea(id: string, archived: boolean) {
  await requireOwner()
  await db()`update loam_os.areas set archived = ${archived} where id = ${id}`
  back()
}
export async function deleteArea(id: string) {
  await requireOwner()
  await db()`delete from loam_os.areas where id = ${id}`
  back(); redirect("/os/areas")
}

const TEMPLATES: Record<string, { stage?: string; tasks: string[]; metrics: [string, string][] }> = {
  research: { stage: "Idea", tasks: ["Write the research question in one sentence", "Ask a mentor if they will supervise", "Check whether it needs IRB review"], metrics: [] },
  business: { tasks: ["Write who it is for and what they pay", "Talk to five possible customers"], metrics: [["Revenue", "$"], ["Customers", ""]] },
}
export async function createProject(f: FormData) {
  await requireOwner()
  const name = str(f, "name"); if (!name) return
  const kind = ["research", "business"].includes(str(f, "kind")) ? str(f, "kind") : "general"
  const tpl = TEMPLATES[kind]
  const area = opt(f, "area_id")
  await db().begin(async sql => {
    const [p] = await sql<{ id: string }[]>`insert into loam_os.projects (name, area_id, due_date, kind, stage) values (${name}, ${area}, ${opt(f, "due_date")}, ${kind}, ${tpl?.stage ?? null}) returning id`
    for (const [i, t] of (tpl?.tasks ?? []).entries()) await sql`insert into loam_os.tasks (title, project_id, area_id, sort) values (${t}, ${p.id}, ${area}, ${i})`
    for (const [l, u] of tpl?.metrics ?? []) await sql`insert into loam_os.project_metrics (project_id, label, unit) values (${p.id}, ${l}, ${u})`
  })
  back()
}
export async function updateProject(f: FormData) {
  await requireOwner()
  const name = str(f, "name"); if (!name) return
  const kind = ["research", "business"].includes(str(f, "kind")) ? str(f, "kind") : "general"
  await db()`update loam_os.projects set name = ${name}, area_id = ${opt(f, "area_id")}, due_date = ${opt(f, "due_date")}, kind = ${kind},
    stage = case when ${kind} = 'research' then coalesce(stage, 'Idea') else stage end where id = ${str(f, "id")}`
  back()
}
export async function setProjectStage(id: string, stage: string) {
  await requireOwner()
  await db()`update loam_os.projects set stage = ${stage} where id = ${id}`
  back()
}
export async function addMetric(projectId: string, f: FormData) {
  await requireOwner()
  const label = str(f, "label"); if (!label) return
  const num = (k: string) => { const v = str(f, k).replace(/[$,%\s]/g, ""); return v && !isNaN(+v) ? +v : null }
  await db()`insert into loam_os.project_metrics (project_id, label, value, target, unit) values (${projectId}, ${label}, ${num("value") ?? 0}, ${num("target")}, ${str(f, "unit")})`
  back()
}
export async function setMetric(id: string, f: FormData) {
  await requireOwner()
  const v = str(f, "value").replace(/[$,%\s]/g, ""); if (!v || isNaN(+v)) return
  await db()`update loam_os.project_metrics set value = ${+v}, updated_at = now() where id = ${id}`
  back()
}
export async function deleteMetric(id: string) {
  await requireOwner()
  await db()`delete from loam_os.project_metrics where id = ${id}`
  back()
}
export async function setProjectStatus(id: string, status: "active" | "paused" | "done") {
  await requireOwner()
  await db()`update loam_os.projects set status = ${status} where id = ${id}`
  back()
}
export async function deleteProject(id: string) {
  await requireOwner()
  await db()`delete from loam_os.projects where id = ${id}`
  back(); redirect("/os/areas")
}

export async function createPin(f: FormData) {
  await requireOwner()
  const label = str(f, "label"), date = str(f, "pin_date")
  if (!label || !date) return
  await db()`insert into loam_os.pins (label, pin_date, area_id) values (${label}, ${date}, ${opt(f, "area_id")})`
  back()
}
export async function pinDate(label: string, date: string, areaId: string | null) {
  await requireOwner()
  await db()`insert into loam_os.pins (label, pin_date, area_id) values (${label.slice(0, 120)}, ${date}, ${areaId})`
  back()
}
/** End of day: move unfinished tasks that were due or planned up to today onto tomorrow. */
export async function rollOver(ids: string[]) {
  await requireOwner()
  if (!ids.length) return 0
  const tm = addDays(todayISO(), 1)
  const r = await db()`update loam_os.tasks set due_date = case when due_date is not null then ${tm}::date else null end,
    scheduled_date = case when scheduled_date is not null then ${tm}::date else null end
    where id = any(${ids}::uuid[]) and status <> 'done'`
  back(); return r.count
}
export async function deletePin(id: string) {
  await requireOwner()
  await db()`delete from loam_os.pins where id = ${id}`
  back()
}

// ---------- tasks ----------

export async function createTask(f: FormData) {
  await requireOwner()
  let title = str(f, "title"); if (!title) return
  let project = opt(f, "project_id") ?? opt(f, "mention_project")
  if (!f.get("parsed") && !opt(f, "due_date") && !opt(f, "repeat")) {
    const p = parseTask(title); title = p.title
    if (p.due) f.set("due_date", p.due); if (p.repeat) f.set("repeat", p.repeat)
  }
  if (!project) { const { getMentionIndex } = await import("./graph"); const { findMentions } = await import("./mentions"); project = findMentions(title, await getMentionIndex()).find(m => m.kind === "project")?.id ?? null }
  let area = opt(f, "area_id")
  const sql = db()
  if (project && !area) {
    const [p] = await sql<{ area_id: string | null }[]>`select area_id from loam_os.projects where id = ${project}`
    area = p?.area_id ?? null
  }
  const repeat = repeatOf(opt(f, "repeat"))
  let due = opt(f, "due_date")
  if (repeat && !due && !opt(f, "scheduled_date")) due = todayISO()
  const [nt] = await sql<{ id: string }[]>`insert into loam_os.tasks (title, area_id, project_id, due_date, scheduled_date, status, sort, repeat)
    values (${title}, ${area}, ${project}, ${due}, ${opt(f, "scheduled_date")}, ${(opt(f, "status") as TaskStatus) ?? "todo"}, extract(epoch from now()), ${repeat}) returning id`
  later(() => enrich("task", nt.id, title))
  back()
}
export async function updateTask(f: FormData) {
  await requireOwner()
  const id = str(f, "id")
  await db()`update loam_os.tasks set title = ${str(f, "title")}, notes = ${str(f, "notes")}, area_id = ${opt(f, "area_id")},
    project_id = ${opt(f, "project_id")}, due_date = ${opt(f, "due_date")}, scheduled_date = ${opt(f, "scheduled_date")} where id = ${id}`
  if (f.has("repeat")) {
    const repeat = repeatOf(opt(f, "repeat"))
    await db()`update loam_os.tasks set repeat = ${repeat},
      due_date = case when ${repeat}::text is not null and due_date is null and scheduled_date is null then ${todayISO()}::date else due_date end where id = ${id}`
  }
  if (f.has("status")) await setStatus(id, (opt(f, "status") as TaskStatus) ?? "todo")
  back()
}
export async function renameTask(id: string, title: string) {
  await requireOwner()
  const t = title.trim()
  if (!t) return
  await db()`update loam_os.tasks set title = ${t} where id = ${id}`
  back()
}
export async function toggleTask(id: string, done: boolean) {
  await requireOwner()
  await setStatus(id, done ? "done" : "todo")
  back()
  if (!done) return null
  const { nextAfter } = await import("./graph")
  return nextAfter(id)
}

/**
 * One-step "make this a task" from any text (a journal line, a note selection, a conversation).
 * Mentioned @people and #projects get linked; follow-ups get a date three days out.
 */
export async function makeTask(text: string, o: { followUp?: boolean; due?: string | null; repeat?: string | null; source?: { type: "entry" | "note" | "draft" | "conversation" | "person"; id: string }; personId?: string } = {}) {
  await requireOwner()
  const sql = db()
  const { getMentionIndex } = await import("./graph")
  let title = text.trim().split("\n")[0].replace(/^([-*•]|\[ \]|\d+[.)])\s+/, "").slice(0, 200)
  if (!title) return null
  let parsedDue: string | null = null, rep = repeatOf(o.repeat ?? null)
  if (o.due === undefined) { const p = parseTask(title); title = p.title; parsedDue = p.due; rep = rep ?? p.repeat }
  const idx = await getMentionIndex()
  const low = text.toLowerCase()
  const has = (k: string) => { const i = low.indexOf(k.toLowerCase()); return i >= 0 && !/[\p{L}\p{N}]/u.test(low[i + k.length] ?? "") }
  const people = idx.people.filter(p => has("@" + p.name) || has("@" + p.name.split(/\s+/)[0])).map(p => p.id)
  if (o.personId && !people.includes(o.personId)) people.push(o.personId)
  const proj = idx.projects.find(p => has("#" + p.name) || has("#" + p.name.toLowerCase().replace(/\s+/g, "-")))
  let area: string | null = null
  if (proj) { const [r] = await sql<{ area_id: string | null }[]>`select area_id from loam_os.projects where id = ${proj.id}`; area = r?.area_id ?? null }
  else if (people[0]) { const [r] = await sql<{ area_id: string | null }[]>`select area_id from loam_os.people where id = ${people[0]}`; area = r?.area_id ?? null }
  const due = o.due !== undefined ? o.due : parsedDue ?? (o.followUp ? addDays(todayISO(), 3) : null)
  const firstLine = text.trim().split("\n")[0]
  const [t] = await sql<{ id: string; title: string }[]>`insert into loam_os.tasks (title, notes, area_id, project_id, due_date, repeat, status, sort, tags, column_id)
    values (${title}, ${text.trim() === firstLine.trim() ? "" : text.trim().slice(0, 4000)}, ${area}, ${proj?.id ?? null}, ${due}, ${rep}, 'todo', extract(epoch from now()),
      ${o.followUp ? ["follow-up"] : []}, (select id from loam_os.board_columns where kind = 'todo' order by sort limit 1)) returning id, title`
  if (!o.personId) later(() => enrich("task", t.id, t.title))
  await sql`insert into loam_os.task_activity (task_id, kind, body) values (${t.id}, 'created', ${o.source ? "from " + o.source.type : ""})`
  for (const pid of people) await sql`insert into loam_os.task_links (task_id, kind, ref_id) values (${t.id}, 'person', ${pid}) on conflict do nothing`
  if (o.source && o.source.type !== "person") await sql`insert into loam_os.links (from_type, from_id, to_type, to_id) values (${o.source.type}, ${o.source.id}, 'task', ${t.id})`
  back()
  return t
}
export async function moveTask(id: string, status: TaskStatus, sort: number) {
  await requireOwner()
  await db()`update loam_os.tasks set sort = ${sort} where id = ${id}`
  await setStatus(id, status)
  back()
}
export async function deleteTask(id: string) {
  await requireOwner()
  await db()`delete from loam_os.tasks where id = ${id}`
  back()
}

// ---------- quick capture ----------

/** "Call Sam tomorrow" → task in the inbox. Prefix "note:" or "person:" to file elsewhere. */
export async function capture(text: string, parsed?: { title: string; due: string | null; repeat: string | null }) {
  await requireOwner()
  const t = text.trim(); if (!t) return { href: null as string | null }
  const sql = db()
  const m = t.match(/^(note|person|journal|draft|idea|read)\s*:\s*(.*)$/i)
  if (m) {
    const kind = m[1].toLowerCase(), rest = m[2].trim()
    if (kind === "note") {
      const [n] = await sql<{ id: string }[]>`insert into loam_os.notes (title, body) values (${rest || "Untitled"}, '') returning id`
      back(); return { href: `/os/notes/${n.id}` }
    }
    if (kind === "person") {
      const [p] = await sql<{ id: string }[]>`insert into loam_os.people (name) values (${rest || "New person"}) returning id`
      back(); return { href: `/os/people/${p.id}` }
    }
    if (kind === "idea") {
      const [d] = await sql<{ id: string }[]>`insert into loam_os.drafts (title, channel, stage, sort) values (${rest || "Untitled idea"}, 'X', 'idea', extract(epoch from now())) returning id`
      back(); return { href: `/os/drafts/${d.id}` }
    }
    if (kind === "read") { await addReadingRaw(rest); back(); return { href: null } }
    if (kind === "draft") {
      const [d] = await sql<{ id: string }[]>`insert into loam_os.drafts (body, channel, stage) values (${rest}, 'X', 'idea') returning id`
      back(); return { href: `/os/drafts/${d.id}` }
    }
    return { href: "/os/journal/write" }
  }
  const p = parsed ?? parseTask(t)
  const due = p.due, title = p.title || t, rep = repeatOf(p.repeat)
  const [nt] = await sql<{ id: string }[]>`insert into loam_os.tasks (title, due_date, repeat, sort, column_id) values (${title}, ${due}, ${rep}, extract(epoch from now()), (select id from loam_os.board_columns where kind = 'todo' order by sort limit 1)) returning id`
  later(() => enrich("task", nt.id, title))
  back(); return { href: null }
}

// ---------- notes ----------

export async function createNote(f?: FormData) {
  await requireOwner()
  const [n] = await db()<{ id: string }[]>`insert into loam_os.notes (title, area_id) values (${(f && str(f, "title")) || "Untitled"}, ${f ? opt(f, "area_id") : null}) returning id`
  back(); redirect(`/os/notes/${n.id}`)
}
export async function saveNote(id: string, title: string, body: string, areaId: string | null) {
  await requireOwner()
  await db()`update loam_os.notes set title = ${title || "Untitled"}, body = ${body}, area_id = ${areaId}, updated_at = now() where id = ${id}`
  debounced("note:" + id, () => enrich("note", id, `${title}\n${body}`))
  revalidatePath("/os/notes")
}
export async function deleteNote(id: string) {
  await requireOwner()
  await db()`delete from loam_os.notes where id = ${id}`
  back(); redirect("/os/notes")
}

// ---------- journal ----------

export async function startEntry() {
  await requireOwner()
  const today = todayISO()
  const sql = db()
  // One entry per day: a second open (or a double keypress) reuses it.
  await sql`insert into loam_os.journal_entries (entry_date) values (${today}) on conflict do nothing`
  const [e] = await sql<{ id: string }[]>`select id from loam_os.journal_entries where entry_date = ${today} limit 1`
  redirect(`/os/journal/${e.id}`)
}
export async function newEntry() {
  return startEntry()
}
export async function saveEntry(id: string, body: string) {
  await requireOwner()
  const [r] = await db()<{ updated_at: Date }[]>`update loam_os.journal_entries set body = ${body}, updated_at = now() where id = ${id} returning updated_at`
  debounced("entry:" + id, () => enrich("entry", id, body))
  return { savedAt: r?.updated_at?.toISOString() ?? null }
}
export async function deleteEntry(id: string) {
  await requireOwner()
  await db()`delete from loam_os.journal_entries where id = ${id}`
  back(); redirect("/os/journal")
}

/** Delete without navigating (used after the Undo toast runs out). */
export async function deleteEntryNow(id: string) {
  await requireOwner()
  await db()`delete from loam_os.journal_entries where id = ${id}`
  back()
}

// ---------- drafts ----------

export async function promote(entryId: string | null, text: string, channel: Channel) {
  await requireOwner()
  if (!CHANNELS.includes(channel)) throw new Error("bad channel")
  const firstLine = text.trim().split("\n")[0].replace(/^#+\s*/, "").slice(0, 80)
  const [d] = await db()<{ id: string }[]>`insert into loam_os.drafts (title, body, channel, stage, source_entry_id, sort)
    values (${channel === "X" ? "" : firstLine}, ${text.trim()}, ${channel}, 'idea', ${entryId}, extract(epoch from now())) returning id`
  back()
  return { id: d.id }
}
export async function createDraft(f: FormData) {
  await requireOwner()
  const channel = (str(f, "channel") || "X") as Channel
  const [d] = await db()<{ id: string }[]>`insert into loam_os.drafts (title, channel, stage, sort) values (${str(f, "title")}, ${channel}, 'idea', extract(epoch from now())) returning id`
  back(); redirect(`/os/drafts/${d.id}`)
}
export async function saveDraft(id: string, patch: { title: string; body: string; channel: Channel; url: string | null }) {
  await requireOwner()
  await db()`update loam_os.drafts set title = ${patch.title}, body = ${patch.body}, channel = ${patch.channel},
    url = ${patch.url || null}, updated_at = now() where id = ${id}`
  revalidatePath("/os/drafts")
}
export async function moveDraft(id: string, stage: Stage, sort: number, url?: string | null) {
  await requireOwner()
  await db()`update loam_os.drafts set stage = ${stage}, sort = ${sort}, updated_at = now(),
    url = coalesce(${url ?? null}, url),
    published_at = case when ${stage} = 'published' then coalesce(published_at, ${todayISO()}::date) else null end
    where id = ${id}`
  back()
}
export async function scheduleDraft(id: string, day: string | null) {
  await requireOwner()
  await db()`update loam_os.drafts set scheduled_for = ${day || null}::date, stage = case when ${day || null}::date is null then stage else 'scheduled' end, updated_at = now() where id = ${id}`
  back()
}
export async function deleteDraft(id: string) {
  await requireOwner()
  await db()`delete from loam_os.drafts where id = ${id}`
  back(); redirect("/os/drafts")
}

// ---------- people ----------

export async function createPerson(f: FormData) {
  await requireOwner()
  const name = str(f, "name"); if (!name) return
  const [p] = await db()<{ id: string }[]>`insert into loam_os.people (name, role, area_id) values (${name}, ${str(f, "role")}, ${opt(f, "area_id")}) returning id`
  back(); redirect(`/os/people/${p.id}`)
}
export async function updatePerson(f: FormData) {
  await requireOwner()
  await db()`update loam_os.people set name = ${str(f, "name")}, role = ${str(f, "role")}, area_id = ${opt(f, "area_id")},
    notes = ${str(f, "notes")}, follow_up = ${opt(f, "follow_up")} where id = ${str(f, "id")}`
  back()
}
export async function setFollowUp(id: string, date: string | null) {
  await requireOwner()
  await db()`update loam_os.people set follow_up = ${date} where id = ${id}`
  back()
}
export async function deletePerson(id: string) {
  await requireOwner()
  await db()`delete from loam_os.people where id = ${id}`
  back(); redirect("/os/people")
}
export async function logConversation(f: FormData) {
  await requireOwner()
  const person = str(f, "person_id")
  const sql = db()
  await sql`insert into loam_os.conversations (person_id, happened_on, channel, summary, their_update, follow_ups)
    values (${person}, ${str(f, "happened_on") || todayISO()}, ${str(f, "channel") || "In person"}, ${str(f, "summary")}, ${str(f, "their_update")}, ${str(f, "follow_ups")})`
  // Logging a conversation clears a due follow-up unless a new date was set.
  const next = opt(f, "next_follow_up")
  await sql`update loam_os.people set follow_up = ${next} where id = ${person}`
  back()
}
export async function deleteConversation(id: string) {
  await requireOwner()
  await db()`delete from loam_os.conversations where id = ${id}`
  back()
}

export async function searchAll(q: string) {
  await requireOwner()
  const { search } = await import("./data")
  return q.trim().length < 2 ? [] : search(q.trim())
}

function repeatOf(v: string | null): Repeat | null {
  return v && (REPEATS as string[]).includes(v) ? (v as Repeat) : null
}

/** Starts a draft from a whole journal entry (used by Today's "not drafted yet" nudge). */
export async function draftFromEntry(entryId: string, channel: Channel = "Substack") {
  await requireOwner()
  const [e] = await db()<{ body: string }[]>`select body from loam_os.journal_entries where id = ${entryId}`
  if (!e) return null
  return promote(entryId, e.body, channel)
}
/** Adds the next step to a project that has none. */
export async function addNextStep(projectId: string, title: string, parsed?: { due: string | null; repeat: string | null }) {
  await requireOwner()
  const p = parsed ? { title: title.trim(), ...parsed } : parseTask(title.trim())
  const t = p.title.slice(0, 300); if (!t) return null
  const sql = db()
  const [pr] = await sql<{ area_id: string | null }[]>`select area_id from loam_os.projects where id = ${projectId}`
  const [r] = await sql<{ id: string }[]>`insert into loam_os.tasks (title, project_id, area_id, due_date, repeat, status, sort, column_id)
    values (${t}, ${projectId}, ${pr?.area_id ?? null}, ${p.due}, ${repeatOf(p.repeat)}, 'todo', extract(epoch from now()), (select id from loam_os.board_columns where kind = 'todo' order by sort limit 1)) returning id`
  back()
  return r
}

// Autosave fires often; run enrichment at most once every 20s per item (per instance).
const lastRun = new Map<string, number>()
function debounced(key: string, fn: () => Promise<void>) {
  const now = Date.now(); if (now - (lastRun.get(key) ?? 0) < 20000) return
  lastRun.set(key, now); later(fn)
}

export async function confirmPerson(id: string) {
  await requireOwner()
  await db()`update loam_os.people set status = 'active' where id = ${id} and status = 'suggested'`
  back()
}
/** Folds a suggestion into an existing person: their mentions move over, the suggestion goes. */
export async function mergePerson(id: string, into: string) {
  await requireOwner()
  if (!into || into === id) return
  const sql = db()
  await sql`insert into loam_os.mentions (person_id, source_type, source_id, snippet)
    select ${into}, source_type, source_id, snippet from loam_os.mentions where person_id = ${id} on conflict do nothing`
  await sql`update loam_os.people set status = 'dismissed', follow_up = null where id = ${id} and status = 'suggested'`
  back()
}
/** "Not a person": kept as dismissed so the same name isn't suggested again. */
export async function dismissPerson(id: string) {
  await requireOwner()
  await db()`update loam_os.people set status = 'dismissed' where id = ${id} and status = 'suggested'`
  await db()`delete from loam_os.mentions where person_id = ${id}`
  back()
}

// ---------- ideas & reading ----------

async function addReadingRaw(text: string) {
  const t = text.trim(); if (!t) return
  const url = t.match(/https?:\/\/\S+/)?.[0] ?? null
  const title = (url ? t.replace(url, "").trim() : t) || url!.replace(/^https?:\/\/(www\.)?/, "").slice(0, 80)
  await db()`insert into loam_os.notes (title, kind, url, area_id) values (${title}, 'reading', ${url},
    (select id from loam_os.areas where name ilike 'med%' and not archived order by sort limit 1))`
}
export async function addReading(f: FormData) {
  await requireOwner(); await addReadingRaw(String(f.get("text") ?? "")); revalidatePath("/os/notes")
}
export async function markRead(id: string, read: boolean) {
  await requireOwner()
  await db()`update loam_os.notes set read_at = ${read ? todayISO() : null}::date, updated_at = now() where id = ${id} and kind = 'reading'`
  revalidatePath("/os/notes")
}
export async function ideaTo(id: string, to: "task" | "draft" | "note" | "drop") {
  await requireOwner()
  const sql = db()
  const [n] = await sql<{ title: string; body: string }[]>`select title, body from loam_os.notes where id = ${id} and kind = 'idea'`
  if (!n) return { href: null as string | null }
  let href: string | null = null
  if (to === "task") await sql`insert into loam_os.tasks (title, notes, sort, column_id) values (${n.title}, ${n.body}, extract(epoch from now()), (select id from loam_os.board_columns where kind = 'todo' order by sort limit 1))`
  if (to === "draft") { const [d] = await sql<{ id: string }[]>`insert into loam_os.drafts (title, body, channel, stage, sort) values (${n.title}, ${n.body}, 'X', 'idea', extract(epoch from now())) returning id`; href = `/os/drafts/${d.id}` }
  if (to === "note") { await sql`update loam_os.notes set kind = 'note', updated_at = now() where id = ${id}`; href = `/os/notes/${id}` }
  else await sql`delete from loam_os.notes where id = ${id}`
  back(); return { href }
}

// ---------- learn ----------

export async function addEvidence(f: FormData) {
  await requireOwner()
  const { readPage, summarizeOne } = await import("./learn")
  const url = str(f, "url"), note = str(f, "note")
  if (!url && !note) return
  const page = url ? await readPage(url) : null
  const ai = page ? await summarizeOne(page.title, page.text) : null
  const title = (str(f, "title") || page?.title || note.split("\n")[0]).slice(0, 200)
  const sources = url ? [{ url, title: page?.title ?? url }] : []
  await db()`insert into loam_os.learn_items (kind, title, url, source, summary, takeaway, sources, review_due)
    values ('evidence', ${title}, ${url || null}, ${page?.host ?? ""}, ${ai?.summary ?? ""}, ${note || ai?.takeaway || ""}, ${sources as never}::jsonb, ${addDays(todayISO(), 1)})`
  back()
}
export async function addEdge(f: FormData) {
  await requireOwner()
  const { readPost, searchX, summarizeMany } = await import("./learn")
  const topic = str(f, "topic")
  const links = str(f, "links").split(/\s+/).filter(l => /^https?:\/\/(www\.)?(x|twitter)\.com\/[^/]+\/status\/\d+/.test(l)).slice(0, 10)
  if (!topic && !links.length) return
  const found = topic ? (await searchX(topic)) ?? [] : []
  const pasted = (await Promise.all(links.map(readPost))).filter(Boolean) as { url: string; author: string; text: string }[]
  const posts = [...pasted, ...found].filter((p, i, a) => a.findIndex(q => q.url === p.url) === i).slice(0, 15)
  if (!posts.length) redirect("/os/learn?tab=edges&err=" + (topic && !links.length ? "search" : "posts"))
  const r = await summarizeMany(topic || "these posts", posts)
  const summary = r ? r.points.map(p => `${p.claim}|${p.sources.join(",")}`).join("\n") : ""
  const title = (r?.title || topic || `${posts[0].author}: ${posts[0].text}`).slice(0, 120)
  await db()`insert into loam_os.learn_items (kind, title, source, summary, takeaway, sources, query, review_due)
    values ('edge', ${title}, 'X', ${summary}, ${r?.takeaway ?? ""}, ${posts.map(p => ({ url: p.url, title: p.text.slice(0, 140), author: p.author })) as never}::jsonb, ${topic || null}, ${addDays(todayISO(), 1)})`
  back()
  redirect("/os/learn?tab=edges")
}
export async function toggleTopic(title: string) {
  await requireOwner()
  const sql = db()
  const d = await sql`delete from loam_os.learn_items where kind = 'topic' and title = ${title} returning id`
  if (!d.length) await sql`insert into loam_os.learn_items (kind, title, source) values ('topic', ${title.slice(0, 80)}, '')`
  back()
}
export async function reviewLearn(id: string, ok: boolean) {
  await requireOwner()
  const steps = [1, 3, 7, 21, 60]
  const sql = db()
  const [it] = await sql<{ review_step: number }[]>`select review_step from loam_os.learn_items where id = ${id}`
  if (!it) return
  const step = ok ? Math.min(it.review_step + 1, steps.length - 1) : 0
  await sql`update loam_os.learn_items set review_step = ${step}, review_due = ${addDays(todayISO(), ok ? steps[step] : 1)}, reviewed_at = now() where id = ${id}`
  back()
}
export async function deleteLearn(id: string) {
  await requireOwner()
  await db()`delete from loam_os.learn_items where id = ${id}`
  back()
}

/** What the capture sheet shows before you type: notes and drafts touched lately, and people mentioned this week. */
export async function captureHints() {
  await requireOwner()
  const sql = db()
  const today = todayISO()
  const [due, journal, docs, people] = await Promise.all([
    sql<{ kind: string; id: string; title: string; due_date: string }[]>`
      select 'task' as kind, id, title, due_date::text from loam_os.tasks
      where status <> 'done' and due_date is not null and due_date <= ${today}
      order by due_date, sort limit 2`,
    sql<{ kind: string; id: string; title: string }[]>`
      select 'journal' as kind, id, 'Today’s journal' as title from loam_os.journal_entries
      where entry_date = ${today} and length(trim(body)) > 0 order by created_at desc limit 1`,
    sql<{ kind: string; id: string; title: string }[]>`
      (select 'note' as kind, id, coalesce(nullif(title, ''), 'Untitled') as title, updated_at from loam_os.notes where kind = 'note' order by updated_at desc limit 3)
      union all
      (select 'draft' as kind, id, coalesce(nullif(title, ''), 'Untitled') as title, updated_at from loam_os.drafts order by updated_at desc limit 3)
      order by updated_at desc limit 4`,
    sql<{ kind: string; id: string; title: string }[]>`
      select 'person' as kind, p.id, p.name as title from loam_os.people p
      where exists (select 1 from loam_os.mentions m where m.person_id = p.id and m.created_at > now() - interval '7 days')
      order by (select max(m.created_at) from loam_os.mentions m where m.person_id = p.id) desc limit 3`,
  ])
  return [...due.map(t => ({ kind: t.kind, id: t.id, title: t.title, sub: t.due_date < today ? "Overdue" : "Due today" })), ...journal.map(j => ({ kind: j.kind, id: j.id, title: j.title })),
    ...docs.map(d => ({ kind: d.kind, id: d.id, title: d.title })), ...people.map(p => ({ kind: p.kind, id: p.id, title: p.title }))]
}

/** Settings → Suggestions switch (a cookie; no AI calls when off). */
export async function setAiOn(on: boolean) {
  await requireOwner()
  ;(await cookies()).set("loam_ai", on ? "on" : "off", { path: "/", maxAge: 60 * 60 * 24 * 400, sameSite: "lax", httpOnly: true, secure: true })
  revalidatePath("/os/settings")
}
