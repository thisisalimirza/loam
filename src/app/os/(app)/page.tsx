import Link from "next/link"
import type { CSSProperties } from "react"
import { getAreas, getEntryForDay, getFollowUps, getPins, getTasksForDay } from "@/lib/os/data"
import { ago, daysBetween, fmtDate, todayISO } from "@/lib/os/dates"
import { Avatar, Card, PageHeader } from "../_ui/ui"
import { Icon } from "../_ui/icons"
import { TaskList } from "../_ui/Tasks"
import PinForm from "../_ui/PinForm"
import { InMotion, PinIdeas, RollOver } from "../_ui/InMotion"
import { focusLine, getInMotion, getPinIdeas, getRollover } from "@/lib/os/motion"
import Suggestions from "../_ui/Suggestions"
import { getSuggestions } from "@/lib/os/graph"

export const metadata = { title: "Today" }

export default async function Today() {
  const today = todayISO()
  const [areas, tasks, pins, people, entry, sugg, motion, ideas, roll] = await Promise.all([
    getAreas(), getTasksForDay(today), getPins(), getFollowUps(today), getEntryForDay(today), getSuggestions().catch(() => []),
    getInMotion().catch(() => []), getPinIdeas().catch(() => []), getRollover().catch(() => []),
  ])
  const focus = focusLine(motion)
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(new Date()))
  const late = hour >= 17
  const upcoming = pins.filter(p => p.pin_date >= today)
  const open = tasks.filter(t => t.status !== "done").length
  const words = entry ? entry.body.trim().split(/\s+/).filter(Boolean).length : 0
  const areaColor = (id: string | null) => areas.find(a => a.id === id)?.color

  return (
    <>
      <PageHeader
        eyebrow={fmtDate(today, { weekday: "long" })}
        title={fmtDate(today, { month: "long", day: "numeric" })}
        sub={`${open} ${open === 1 ? "task" : "tasks"} · ${people.length} ${people.length === 1 ? "person" : "people"} to follow up with`}
        actions={
          <Link href="/os/journal/write" className="jr">
            <Icon name="pen" className="ic" />
            <div><strong>Today’s journal</strong><small>{words ? `${words} words so far` : "Not started"}</small></div>
            <Icon name="arrow" className="i go" />
          </Link>
        }
      />

      {focus && <p className="focus-line" title="Picked from the top project in motion">{focus}</p>}
      {late && <RollOver items={roll} />}
      {upcoming.length > 0 && (
        <div className="countdowns">
          {upcoming.map(p => {
            const n = daysBetween(today, p.pin_date)
            return (
              <div key={p.id} className="cd" style={{ "--c": areaColor(p.area_id) } as CSSProperties} title={fmtDate(p.pin_date, { month: "long", day: "numeric", year: "numeric" })}>
                <div className="num">{n === 0 ? "Today" : n}{n !== 0 && <small>{n === 1 ? "day" : "days"}</small>}</div>
                <span>{p.label}</span>
              </div>
            )
          })}
          <PinForm areas={areas.map(a => ({ id: a.id, name: a.name }))} compact />
        </div>
      )}
      <PinIdeas ideas={ideas} />
      <InMotion items={motion} today={today} />

      <div className="grid2">
        {sugg.length > 0 && <div className="span"><Suggestions items={sugg.filter(s => s.kind !== "followup")} /></div>}
        <Card title="Tasks" icon="flag" meta={<Link href="/os/tasks">All tasks</Link>} className="span">
          <TaskList tasks={tasks} areas={areas} today={today} emptyTitle="Nothing due today" emptyText="Tasks with a due or planned date of today or earlier land here." />
        </Card>
        {people.length > 0 ? (
          <Card title="Follow up" icon="chat" meta={`${people.length} ${people.length === 1 ? "person" : "people"}`} className="span">
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
        ) : <p className="quiet-line span">No one to follow up with today.</p>}
      </div>
    </>
  )
}
