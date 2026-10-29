import Link from "next/link"
import type { CSSProperties } from "react"
import { getAreas, getDrafts, getEntryForDay, getFollowUps, getPins, getTasks, getTasksForDay } from "@/lib/os/data"
import { ago, daysBetween, fmtDate, todayISO } from "@/lib/os/dates"
import { nextUp } from "@/lib/os/focus"
import type { Task } from "@/lib/os/types"
import { Avatar, Card, PageHeader } from "../_ui/ui"
import { Icon } from "../_ui/icons"
import { TaskList } from "../_ui/Tasks"
import Suggestions from "../_ui/Suggestions"
import { RollOver } from "../_ui/InMotion"
import { focusPick, getInMotion, getRollover } from "@/lib/os/motion"
import { getSuggestions } from "@/lib/os/graph"

export const metadata = { title: "Today" }

/**
 * Today: title, one task list (with the journal as a row), then a slim projects strip.
 * Each task shows once; empty sections disappear.
 */
export default async function Today() {
  const today = todayISO()
  const [areas, dayTasks, pins, people, entry, sugg, motion, roll, allOpen, drafts] = await Promise.all([
    getAreas(), getTasksForDay(today), getPins(), getFollowUps(today), getEntryForDay(today), getSuggestions().catch(() => []),
    getInMotion().catch(() => []), getRollover().catch(() => []), getTasks({ openOnly: true }), getDrafts().catch(() => []),
  ])
  const posting = drafts.filter(d => d.stage !== "published" && d.scheduled_for && ((d.scheduled_for as unknown) instanceof Date ? (d.scheduled_for as unknown as Date).toISOString() : String(d.scheduled_for)).slice(0, 10) === today)
  // One list: overdue + due today (+ done today). If nothing is dated, the next step per project/area instead.
  let tasks: Task[] = dayTasks
  let listTitle = "Due today"
  if (!dayTasks.some(t => t.status !== "done")) {
    const byKey = new Map<string, Task[]>()
    for (const t of allOpen) { const k = t.project_id ?? t.area_id ?? "-"; byKey.set(k, [...(byKey.get(k) ?? []), t]) }
    const seen = new Set(dayTasks.map(t => t.id))
    tasks = [...dayTasks, ...[...byKey.values()].map(ts => nextUp(ts)!).filter(t => t && !seen.has(t.id)).slice(0, 5)]
    listTitle = "Up next"
  }
  const listed = new Set(tasks.map(t => t.id))
  const hero = focusPick(motion)
  const showHero = hero && hero.next && !listed.has(hero.next.id)
  const s = sugg.filter(x => x.kind !== "followup" && !(x.kind === "next" && x.projectId && motion.some(m => m.id === x.projectId)) && ![...listed].some(id => x.key.includes(id)))
  const words = entry ? entry.body.trim().split(/\s+/).filter(Boolean).length : 0
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(new Date()))
  const strip = [
    ...motion.map(m => ({ key: m.id, href: `/os/projects/${m.id}`, name: m.name, color: m.color, days: m.daysLeft })),
    ...pins.filter(p => p.pin_date >= today && !motion.some(m => m.pinId === p.id))
      .map(p => ({ key: p.id, href: null as string | null, name: p.label, color: areas.find(a => a.id === p.area_id)?.color ?? null, days: daysBetween(today, p.pin_date) as number | null })),
  ]
  const left = (n: number | null) => n === null ? null : n < 0 ? `${-n} days past due` : n === 0 ? "Due today" : `${n} ${n === 1 ? "day" : "days"} left`

  return (
    <>
      <PageHeader eyebrow={fmtDate(today, { weekday: "long", month: "long", day: "numeric" })} title="Today" />
      {[0, 1].includes(new Date(today + "T12:00:00").getDay()) && <Link href="/os/review" className="nudge"><Icon name="calendar" size={16} /><span><strong>Weekly review</strong> Look back at the week and pick what’s next.</span><Icon name="chev" size={14} /></Link>}
      {showHero && (
        <section className="hero" aria-label="Focus">
          <div><p className="hero-k">If you only get to one thing</p><h2>{hero.next!.title}</h2><p className="meta">{hero.name}{hero.risk ? ` · ${hero.risk}` : ""}</p></div>
          <Link href={`/os?task=${hero.next!.id}`} className="btn pri">Start</Link>
        </section>
      )}
      <Card title={listTitle} className="today-list">
        {tasks.length > 0 && <TaskList tasks={tasks} areas={areas} today={today} />}
        <Link href="/os/journal/write" className="jrow"><Icon name="pen" /><span className="tt">Journal</span><span className="meta">{words ? `${words} words` : "Not started"}</span><Icon name="chev" className="i chev" /></Link>
        {posting.map(d => <Link key={d.id} href={`/os/drafts/${d.id}`} className="jrow"><Icon name="send" /><span className="tt">{d.title || "Untitled"}</span><span className="meta">Goes out on {d.channel}</span><Icon name="chev" /></Link>)}
        {hour >= 17 && <RollOver items={roll} />}
      </Card>
      {strip.length > 0 && (
        <section className="pstrip" aria-label="Your projects">
          <h2 className="sec-h">Projects</h2>
          <ul>{strip.map(x => {
            const body = <><span className="dot" style={{ "--c": x.color ?? "var(--acc)" } as CSSProperties} /><span className="tt">{x.name}</span>{left(x.days) && <span className="meta">{left(x.days)}</span>}</>
            return <li key={x.key}>{x.href ? <Link href={x.href}>{body}</Link> : <div>{body}</div>}</li>
          })}</ul>
        </section>
      )}
      {s.length > 0 && <Suggestions items={s} />}
      {people.length > 0 && (
        <Card title="Follow up" icon="chat">
          <ul className="pgrid">
            {people.map(p => (
              <li key={p.id}>
                <Link href={`/os/people/${p.id}`} className="person">
                  <Avatar name={p.name} />
                  <div className="pb">
                    <div className="pn"><strong>{p.name}</strong><small>{p.role}</small>{p.last_on && <span className="ago">{ago(p.last_on, today)}</span>}</div>
                    <p>{p.last_summary || p.last_update || "No conversations logged yet."}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
