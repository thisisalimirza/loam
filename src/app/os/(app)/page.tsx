import Link from "next/link"
import type { CSSProperties } from "react"
import { getAreas, getDrafts, getEntryForDay, getFollowUps, getPins, getTasks, getTasksForDay } from "@/lib/os/data"
import { ago, daysBetween, fmtDate, todayISO } from "@/lib/os/dates"
import { nextUp } from "@/lib/os/focus"
import type { Task } from "@/lib/os/types"
import { Avatar, Card, PageHeader } from "../_ui/ui"
import { Icon } from "../_ui/icons"
import { TaskList } from "../_ui/Tasks"
import Suggestions, { type Lead } from "../_ui/Suggestions"
import { RollOver } from "../_ui/InMotion"
import { focusPick, getInMotion, getRollover } from "@/lib/os/motion"
import { getSuggestions } from "@/lib/os/graph"
import { getNudges } from "@/lib/os/nudges"

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
  const nudges = await getNudges().catch(() => [])
  const posting = drafts.filter(d => d.stage !== "published" && d.scheduled_for && ((d.scheduled_for as unknown) instanceof Date ? (d.scheduled_for as unknown as Date).toISOString() : String(d.scheduled_for)).slice(0, 10) === today)
  // One list: overdue + due today (+ done today). If nothing is dated, the next step per project/area instead.
  let tasks: Task[] = dayTasks
  let listTitle = "Today"
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

  const leads: Lead[] = [
    ...(showHero ? [{ key: "focus", href: `/os?task=${hero.next!.id}`, text: hero.next!.title, sub: `${hero.name}${hero.risk ? ` · ${hero.risk}` : ""}`, icon: "flag" as const, cta: { label: "Start", href: `/os?task=${hero.next!.id}` } }] : []),
    ...([0, 1].includes(new Date(today + "T12:00:00").getDay()) ? [{ key: "review", href: "/os/review", text: "Weekly review", sub: "Look back at the week and pick what’s next.", icon: "review" as const }] : []),
    ...nudges.map(n => ({ key: n.key, href: n.href, text: n.text, icon: n.icon, ...(n.cta ? { cta: { label: n.cta, href: n.href } } : {}) })),
  ]

  return (
    <>
      <PageHeader eyebrow={fmtDate(today, { weekday: "long", month: "long", day: "numeric" })} title="Today" />
      <Suggestions items={s} lead={leads} />
      <Card title={listTitle} className="today-list">
        {tasks.length > 0 && <TaskList tasks={tasks} areas={areas} today={today} hideToday />}
        <Link href="/os/journal/write" className="jrow"><Icon name="pen" /><span className="tt">Journal</span><span className="meta">{words ? `${words} words` : "Not started"}</span><Icon name="chev" className="i chev" /></Link>
        {posting.map(d => <Link key={d.id} href={`/os/drafts/${d.id}`} className="jrow"><Icon name="send" /><span className="tt">{d.title || "Untitled"}</span><span className="meta">Goes out on {d.channel}</span><Icon name="chev" /></Link>)}
        {hour >= 17 && <RollOver items={roll} />}
      </Card>
      {strip.length > 0 && (
        <Card title="Projects" icon="areas">
          {strip.map(x => {
            const body = <><span className="dot" style={{ "--c": x.color ?? "var(--acc)" } as CSSProperties} /><span className="tt">{x.name}{left(x.days) && <span className="meta"> · {left(x.days)}</span>}</span>{x.href && <Icon name="chev" />}</>
            return x.href ? <Link key={x.key} href={x.href} className="jrow prow">{body}</Link> : <div key={x.key} className="jrow prow">{body}</div>
          })}
        </Card>
      )}
      {people.length > 0 && (
        <Card title="Follow up" icon="chat">
          <ul>
            {people.map(p => (
              <li key={p.id}>
                <Link href={`/os/people/${p.id}`} className="row hov">
                  <Avatar name={p.name} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="tt ell">{p.name}</div>
                    <div className="meta ell">{[p.last_on && ago(p.last_on, today), p.last_summary || p.last_update].filter(Boolean).join(" · ") || "No conversations logged yet"}</div>
                  </div>
                  <Icon name="chev" size={14} className="muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
