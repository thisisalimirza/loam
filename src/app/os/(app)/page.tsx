import Link from "next/link"
import type { CSSProperties } from "react"
import { getAreas, getEntryForDay, getFollowUps, getPins, getTasks, getTasksForDay } from "@/lib/os/data"
import { ago, daysBetween, fmtDate, todayISO } from "@/lib/os/dates"
import { nextUp } from "@/lib/os/focus"
import type { Task } from "@/lib/os/types"
import { Avatar, Card, PageHeader } from "../_ui/ui"
import { Icon } from "../_ui/icons"
import { TaskList } from "../_ui/Tasks"
import Suggestions from "../_ui/Suggestions"
import { InMotion, RollOver } from "../_ui/InMotion"
import { focusLine, getInMotion, getRollover } from "@/lib/os/motion"
import { getSuggestions } from "@/lib/os/graph"

export const metadata = { title: "Today" }

/**
 * Today. Each fact shows once: project countdowns and next steps live in In motion,
 * the task list skips anything already on a card, and empty sections disappear.
 */
export default async function Today() {
  const today = todayISO()
  const [areas, dayTasks, pins, people, entry, sugg, motion, roll, allOpen] = await Promise.all([
    getAreas(), getTasksForDay(today), getPins(), getFollowUps(today), getEntryForDay(today), getSuggestions().catch(() => []),
    getInMotion().catch(() => []), getRollover().catch(() => []), getTasks({ openOnly: true }),
  ])
  const shown = new Set(motion.flatMap(m => m.next ? [m.next.id] : []))
  const shownProjects = new Set(motion.map(m => m.id))
  // Today's list: due/planned today or earlier, minus what a project card already shows.
  let tasks: Task[] = dayTasks.filter(t => !shown.has(t.id))
  let listTitle = "Due today"
  if (!tasks.some(t => t.status !== "done")) {
    // Nothing dated: offer the next step from each area that isn't already on a card.
    const byArea = new Map<string, Task[]>()
    for (const t of allOpen) if (!shown.has(t.id) && !(t.project_id && shownProjects.has(t.project_id))) { const k = t.area_id ?? "-"; byArea.set(k, [...(byArea.get(k) ?? []), t]) }
    tasks = [...dayTasks.filter(t => !shown.has(t.id)), ...[...byArea.values()].map(ts => nextUp(ts)!).filter(Boolean).slice(0, 4)]
    listTitle = "Up next"
  }
  const openToday = dayTasks.filter(t => t.status !== "done").length
  const pinsLeft = pins.filter(p => p.pin_date >= today && !motion.some(m => m.pinId === p.id))
  const s = sugg.filter(x => x.kind !== "followup" && !(x.kind === "next" && x.projectId && shownProjects.has(x.projectId)) && !(x.kind === "overdue" && dayTasks.some(t => x.key.startsWith(`o:${t.id}:`))))
  const focus = focusLine(motion)
  const words = entry ? entry.body.trim().split(/\s+/).filter(Boolean).length : 0
  const areaColor = (id: string | null) => areas.find(a => a.id === id)?.color
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(new Date()))
  const sub = [
    openToday ? `${openToday} due today` : motion.length ? `${motion.length} ${motion.length === 1 ? "project" : "projects"} active` : "Nothing due today",
    people.length ? `${people.length} to follow up with` : null,
  ].filter(Boolean).join(" · ")

  return (
    <>
      <PageHeader
        eyebrow={fmtDate(today, { weekday: "long" })}
        title={fmtDate(today, { month: "long", day: "numeric" })}
        sub={focus ?? sub}
        actions={
          <Link href="/os/journal/write" className="jr">
            <Icon name="pen" className="ic" />
            <div><strong>Today’s journal</strong><small>{words ? `${words} words so far` : "Not started"}</small></div>
            <Icon name="arrow" className="i go" />
          </Link>
        }
      />
      {hour >= 17 && <RollOver items={roll} />}
      {pinsLeft.length > 0 && (
        <div className="countdowns">
          {pinsLeft.map(p => {
            const n = daysBetween(today, p.pin_date)
            return (
              <div key={p.id} className="cd" style={{ "--c": areaColor(p.area_id) } as CSSProperties} title={fmtDate(p.pin_date, { month: "long", day: "numeric", year: "numeric" })}>
                <div className="num">{n === 0 ? "Today" : n}{n !== 0 && <small>{n === 1 ? "day" : "days"}</small>}</div>
                <span>{p.label}</span>
              </div>
            )
          })}
        </div>
      )}
      <InMotion items={motion} today={today} />
      <div className="grid2">
        {tasks.length > 0 && (
          <Card title={listTitle} icon="flag" meta={<Link href="/os/tasks">All tasks</Link>} className="span">
            <TaskList tasks={tasks} areas={areas} today={today} />
          </Card>
        )}
        {s.length > 0 && <div className="span"><Suggestions items={s} /></div>}
        {people.length > 0 && (
          <Card title="Follow up" icon="chat" meta={people.length} className="span">
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
      </div>
    </>
  )
}
