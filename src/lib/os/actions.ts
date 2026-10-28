"use server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { timingSafeEqual, createHash } from "node:crypto"
import { db } from "./db"
import { requireOwner } from "./auth"
import { createToken, SESSION_COOKIE, SESSION_TTL } from "./session"
import { todayISO } from "./dates"
import { CHANNELS, type Channel, type Stage, type TaskStatus } from "./types"

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim()
const opt = (f: FormData, k: string) => str(f, k) || null
const back = () => revalidatePath("/os", "layout")

// ---------- session ----------

export async function login(_prev: { error?: string } | undefined, f: FormData) {
  const h = await headers()
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown"
  const sql = db()
  // Rate limit lives in the database. If the database is down, sign-in still works
  // (so /admin stays usable) but without the limit, and the failure is logged.
  let dbOk = true
  try {
    const [{ n }] = await sql<{ n: number }[]>`
      select count(*)::int n from loam_os.login_attempts where ip = ${ip} and not ok and at > now() - interval '15 minutes'`
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
      await sql`insert into loam_os.login_attempts (ip, ok) values (${ip}, ${ok})`
      if (ok) await sql`delete from loam_os.login_attempts where (ip = ${ip} and not ok) or at < now() - interval '7 days'`
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

export async function createProject(f: FormData) {
  await requireOwner()
  const name = str(f, "name"); if (!name) return
  await db()`insert into loam_os.projects (name, area_id, due_date) values (${name}, ${opt(f, "area_id")}, ${opt(f, "due_date")})`
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
export async function deletePin(id: string) {
  await requireOwner()
  await db()`delete from loam_os.pins where id = ${id}`
  back()
}

// ---------- tasks ----------

export async function createTask(f: FormData) {
  await requireOwner()
  const title = str(f, "title"); if (!title) return
  const project = opt(f, "project_id")
  let area = opt(f, "area_id")
  const sql = db()
  if (project && !area) {
    const [p] = await sql<{ area_id: string | null }[]>`select area_id from loam_os.projects where id = ${project}`
    area = p?.area_id ?? null
  }
  await sql`insert into loam_os.tasks (title, area_id, project_id, due_date, scheduled_date, status, sort)
    values (${title}, ${area}, ${project}, ${opt(f, "due_date")}, ${opt(f, "scheduled_date")}, ${(opt(f, "status") as TaskStatus) ?? "todo"}, extract(epoch from now()))`
  back()
}
export async function updateTask(f: FormData) {
  await requireOwner()
  const id = str(f, "id")
  await db()`update loam_os.tasks set title = ${str(f, "title")}, notes = ${str(f, "notes")}, area_id = ${opt(f, "area_id")},
    project_id = ${opt(f, "project_id")}, due_date = ${opt(f, "due_date")}, scheduled_date = ${opt(f, "scheduled_date")} where id = ${id}`
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
  await db()`update loam_os.tasks set status = ${done ? "done" : "todo"}, done_at = ${done ? new Date() : null} where id = ${id}`
  back()
}
export async function moveTask(id: string, status: TaskStatus, sort: number) {
  await requireOwner()
  await db()`update loam_os.tasks set status = ${status}, sort = ${sort},
    done_at = case when ${status} = 'done' then coalesce(done_at, now()) else null end where id = ${id}`
  back()
}
export async function deleteTask(id: string) {
  await requireOwner()
  await db()`delete from loam_os.tasks where id = ${id}`
  back()
}

// ---------- quick capture ----------

/** "Call Sam tomorrow" → task in the inbox. Prefix "note:" or "person:" to file elsewhere. */
export async function capture(text: string) {
  await requireOwner()
  const t = text.trim(); if (!t) return { href: null as string | null }
  const sql = db()
  const m = t.match(/^(note|person|journal|draft)\s*:\s*(.*)$/i)
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
    if (kind === "draft") {
      const [d] = await sql<{ id: string }[]>`insert into loam_os.drafts (body, channel, stage) values (${rest}, 'X', 'idea') returning id`
      back(); return { href: `/os/drafts/${d.id}` }
    }
    return { href: "/os/journal/write" }
  }
  let due: string | null = null, title = t
  const today = todayISO()
  if (/\btoday$/i.test(title)) { due = today; title = title.replace(/\s*\btoday$/i, "") }
  else if (/\btomorrow$/i.test(title)) {
    const d = new Date(today + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)
    due = d.toISOString().slice(0, 10); title = title.replace(/\s*\btomorrow$/i, "")
  }
  await sql`insert into loam_os.tasks (title, due_date, sort) values (${title}, ${due}, extract(epoch from now()))`
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
  const [e] = await sql<{ id: string }[]>`select id from loam_os.journal_entries where entry_date = ${today} order by created_at limit 1`
  if (e) redirect(`/os/journal/${e.id}`)
  const [n] = await sql<{ id: string }[]>`insert into loam_os.journal_entries (entry_date) values (${today}) returning id`
  redirect(`/os/journal/${n.id}`)
}
export async function newEntry() {
  await requireOwner()
  const [n] = await db()<{ id: string }[]>`insert into loam_os.journal_entries (entry_date) values (${todayISO()}) returning id`
  redirect(`/os/journal/${n.id}`)
}
export async function saveEntry(id: string, body: string) {
  await requireOwner()
  const [r] = await db()<{ updated_at: Date }[]>`update loam_os.journal_entries set body = ${body}, updated_at = now() where id = ${id} returning updated_at`
  return { savedAt: r?.updated_at?.toISOString() ?? null }
}
export async function deleteEntry(id: string) {
  await requireOwner()
  await db()`delete from loam_os.journal_entries where id = ${id}`
  back(); redirect("/os/journal")
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
