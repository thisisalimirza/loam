import { db } from "./db"
import { addDays, daysBetween, fmtDate, todayISO } from "./dates"

export type Motion = {
  areaId: string | null; id: string; name: string; area: string | null; color: string | null; due: string | null
  daysLeft: number | null; pinId: string | null; open: number; done: number; elapsed: number | null; progress: number
  next: { id: string; title: string; due_date: string | null } | null
  score: number; why: string[]; risk: string | null
}
export type PinIdea = { label: string; date: string; area_id: string | null; from: string }

type Row = {
  id: string; name: string; area: string | null; color: string | null; area_id: string | null; due: string | null; created: string
  pin_id: string | null; open: number; done: number; done7: number; done14: number; touched7: number; due7: number; doing: number; last: string | null; 
  next_id: string | null; next_title: string | null; next_due: string | null
}

/** Active projects ranked by a points table that each card can explain. */
export async function getInMotion(limit = 4): Promise<Motion[]> {
  const today = todayISO()
  const rows = await db()<Row[]>`
    select j.id, j.name, a.name area, a.color, j.area_id, j.due_date::text due, j.created_at::date::text created,
      count(t.id) filter (where t.status <> 'done')::int open,
      count(t.id) filter (where t.status = 'done')::int done,
      count(t.id) filter (where t.done_at > now() - interval '7 days')::int done7,
      count(t.id) filter (where t.done_at > now() - interval '14 days')::int done14,
      count(t.id) filter (where t.status <> 'done' and (t.created_at > now() - interval '7 days' or t.status_changed_at > now() - interval '7 days'))::int touched7,
      count(t.id) filter (where t.status <> 'done' and t.due_date <= ${addDays(today, 7)})::int due7,
      count(t.id) filter (where t.status = 'doing')::int doing,
      greatest(j.created_at, max(t.done_at), max(t.created_at), max(t.status_changed_at))::date::text last,
      (select p.id from loam_os.pins p where p.pin_date >= ${today} and (lower(p.label) = lower(j.name) or p.pin_date = j.due_date) limit 1) pin_id,
      n.id next_id, n.title next_title, n.due_date::text next_due
    from loam_os.projects j
    left join loam_os.areas a on a.id = j.area_id
    left join loam_os.tasks t on t.project_id = j.id and t.archived_at is null
    left join lateral (select x.id, x.title, x.due_date from loam_os.tasks x where x.project_id = j.id and x.status <> 'done' and x.archived_at is null
      order by x.status = 'doing' desc, x.due_date nulls last, x.sort limit 1) n on true
    where j.status = 'active' and (a.id is null or not a.archived)
    group by j.id, a.name, a.color, n.id, n.title, n.due_date`
  const out = rows.map(r => {
    const why: string[] = []; let score = 0
    const daysLeft = r.due ? daysBetween(today, r.due) : null
    if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 30) { const p = 40 - Math.min(daysLeft, 30); score += p; why.push(`Deadline in ${daysLeft} ${daysLeft === 1 ? "day" : "days"} (+${p})`) }
    else if (daysLeft !== null && daysLeft < 0) { score += 30; why.push(`Deadline passed ${-daysLeft}d ago (+30)`) }
    if (r.due7) { const p = Math.min(r.due7 * 8, 24); score += p; why.push(`${r.due7} due within a week (+${p})`) }
    if (r.doing) { const p = Math.min(r.doing * 10, 20); score += p; why.push(`${r.doing} in progress on the board (+${p})`) }
    if (r.done7) { const p = Math.min(r.done7 * 6, 30); score += p; why.push(`${r.done7} done this week (+${p})`) }
    if (r.touched7) { const p = Math.min(r.touched7 * 3, 15); score += p; why.push(`${r.touched7} added or moved this week (+${p})`) }
    if (r.pin_id) { score += 15; why.push("Pinned (+15)") }
    const total = r.open + r.done
    const elapsed = r.due && daysBetween(r.created, r.due) > 0 ? Math.max(0, Math.min(1, daysBetween(r.created, today) / daysBetween(r.created, r.due))) : null
    const progress = total ? r.done / total : 0
    const idle = r.last ? daysBetween(r.last, today) : 0
    let risk: string | null = null
    if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && r.open >= 5) risk = `Deadline in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}, ${r.open} open tasks`
    else if (daysLeft !== null && daysLeft > 0 && r.open > 0) {
      const rate = r.done14 / 14
      if (rate > 0 && r.open / rate > daysLeft) risk = `At this pace you’ll finish around ${fmtDate(addDays(today, Math.ceil(r.open / rate)))}, after the deadline`
      else if (rate === 0 && r.done > 0 && daysLeft <= 30) risk = `Nothing finished in two weeks, ${r.open} left before ${fmtDate(r.due!)}`
    }
    if (!risk && idle >= 10 && r.open > 0) risk = `No activity in ${idle} days`
    if (!risk && elapsed !== null && total >= 3 && elapsed - progress > 0.3) risk = `${Math.round(elapsed * 100)}% of the time gone, ${Math.round(progress * 100)}% done`
    return {
      id: r.id, name: r.name, area: r.area, pinId: r.pin_id, areaId: r.area_id, color: r.color, due: r.due, daysLeft, open: r.open, done: r.done, elapsed, progress,
      next: r.next_id ? { id: r.next_id, title: r.next_title!, due_date: r.next_due } : null, score, why, risk,
    } satisfies Motion
  })
  // Highest score first; ties go to the sooner deadline, then the name, so the order never flickers.
  out.sort((a, b) => b.score - a.score || (a.daysLeft ?? 999) - (b.daysLeft ?? 999) || a.name.localeCompare(b.name))
  const ranked = out.filter(m => m.score > 0).slice(0, limit)
  if (ranked.length < 2) for (const m of out) { if (ranked.length >= 2) break; if (!ranked.includes(m) && m.open > 0) { m.why.push("Has open tasks (filler)"); ranked.push(m) } }
  return ranked
}

/** Deadlines worth a countdown that aren't pinned yet: project due dates and exam-like tasks. */
export async function getPinIdeas(): Promise<PinIdea[]> {
  const today = todayISO(), sql = db()
  const [ps, ts] = await Promise.all([
    sql<{ name: string; due: string; area_id: string | null }[]>`select j.name, j.due_date::text due, j.area_id from loam_os.projects j
      where j.status = 'active' and j.due_date between ${today} and ${addDays(today, 180)}
      and not exists (select 1 from loam_os.pins p where p.pin_date = j.due_date or lower(p.label) like '%' || lower(j.name) || '%') order by j.due_date limit 3`,
    sql<{ title: string; due: string; area_id: string | null }[]>`select t.title, t.due_date::text due, t.area_id from loam_os.tasks t
      where t.status <> 'done' and t.archived_at is null and t.due_date between ${addDays(today, 3)} and ${addDays(today, 180)}
      and t.title ~* '\\m(exam|shelf|step ?[123]|boards?|comlex|osce|mcat|test|deadline|interview|presentation|due)\\M'
      and not exists (select 1 from loam_os.pins p where p.pin_date = t.due_date) order by t.due_date limit 3`,
  ])
  const ideas = [...ps.map(p => ({ label: p.name, date: p.due, area_id: p.area_id, from: "project deadline" })), ...ts.map(t => ({ label: t.title, date: t.due, area_id: t.area_id, from: "task" }))]
  const seen = new Set<string>()
  return ideas.sort((a, b) => a.date.localeCompare(b.date)).filter(i => !seen.has(i.date + i.label) && (seen.add(i.date + i.label), true)).slice(0, 3)
}

/** Today's open tasks that were due today or earlier, for the end-of-day roll-over. */
export async function getRollover() {
  const today = todayISO()
  return db()<{ id: string; title: string }[]>`select id, title from loam_os.tasks where status <> 'done' and archived_at is null
    and coalesce(scheduled_date, due_date) <= ${today} and repeat is null order by sort limit 50`
}

/** Only speaks up when it adds something the cards don't: a risk on one project outranking the rest. */
export function focusLine(ms: Motion[]) {
  const risky = ms.filter(m => m.risk)
  if (ms.length < 2 || !risky.length) return null
  const m = risky[0]
  return `If you only get to one project today, make it ${m.name}.`
}
export function focusPick(ms: Motion[]) {
  const risky = ms.filter(m => m.risk && m.next)
  return ms.length >= 2 && risky.length ? risky[0] : null
}
