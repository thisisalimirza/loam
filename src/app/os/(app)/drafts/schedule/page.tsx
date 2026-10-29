import Link from "next/link"
import { getDrafts } from "@/lib/os/data"
import { scheduleDraft } from "@/lib/os/actions"
import { CHANNELS } from "@/lib/os/types"
import { addDays, daysBetween, fmtDate, todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../../_ui/ui"

export const metadata = { title: "Schedule" }

const iso = (v: unknown) => !v ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)

export default async function Schedule() {
  const today = todayISO()
  const drafts = await getDrafts()
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))
  const on = (d: string) => drafts.filter(x => iso(x.scheduled_for) === d && x.stage !== "published")
  const ready = drafts.filter(x => x.stage === "ready" && !iso(x.scheduled_for))
  const gaps = CHANNELS.map(c => {
    const dates = drafts.filter(x => x.channel === c).map(x => iso(x.published_at) ?? iso(x.scheduled_for)).filter((d): d is string => !!d && d <= addDays(today, 13))
    if (!dates.length) return null
    const last = dates.sort().at(-1)!
    const n = last < today ? daysBetween(last, today) : 0
    return n >= 7 ? `Nothing on ${c} for ${n} days` : null
  }).filter(Boolean) as string[]
  const busy = days.filter(d => on(d).length)
  return (
    <>
      <PageHeader back={{ href: "/os/drafts", label: "Drafts" }} title="Schedule" />
      <div className="stack">
        {gaps.length > 0 && <p className="quiet-line">{gaps.join(" · ")}</p>}
        {ready.length > 0 && (
          <Card title="Ready to go out">
            <ul>{ready.map(d => (
              <li key={d.id} className="row sch-row">
                <Link href={`/os/drafts/${d.id}`} className="tt">{d.title || "Untitled"}</Link>
                <span className="pill gray">{d.channel}</span>
                <form action={async (f: FormData) => { "use server"; await scheduleDraft(d.id, String(f.get("day") || "")) }} className="inline">
                  <input className="in" type="date" name="day" min={today} defaultValue={addDays(today, 1)} aria-label={`Day for ${d.title}`} />
                  <button className="btn sm">Schedule</button>
                </form>
              </li>))}</ul>
          </Card>
        )}
        <Card title="Next two weeks">
          {busy.length === 0 ? <p className="quiet-line" style={{ padding: "12px 16px" }}>Nothing scheduled.</p> : (
            <ul>{busy.map(day => (
              <li key={day} className="sch-day">
                <h3 className="sch-h">{day === today ? "Today" : day === addDays(today, 1) ? "Tomorrow" : fmtDate(day, { weekday: "short", month: "short", day: "numeric" })}</h3>
                <ul>{on(day).map(d => (
                  <li key={d.id} className="row sch-row">
                    <Link href={`/os/drafts/${d.id}`} className="tt">{d.title || "Untitled"}</Link>
                    <span className="pill gray">{d.channel}</span>
                    <form action={async () => { "use server"; await scheduleDraft(d.id, null) }}><button className="btn ghost sm" aria-label={`Unschedule ${d.title}`}>Unschedule</button></form>
                  </li>))}</ul>
              </li>))}</ul>
          )}
        </Card>
      </div>
    </>
  )
}
