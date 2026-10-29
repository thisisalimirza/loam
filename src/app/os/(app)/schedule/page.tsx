import Link from "next/link"
import { getDrafts } from "@/lib/os/data"
import { scheduleDraft } from "@/lib/os/actions"
import { CHANNELS } from "@/lib/os/types"
import { addDays, daysBetween, fmtDate, todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../_ui/ui"
import Sheet from "../../_ui/Sheet"
import { Icon } from "../../_ui/icons"

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
            <ul>{ready.map(d => <li key={d.id}><Row d={d} today={today} /></li>)}</ul>
          </Card>
        )}
        {busy.length === 0 ? (ready.length === 0 && <p className="quiet-line empty-one">Nothing scheduled.</p>) : <Card title="Next two weeks">{(
            <ul>{busy.map(day => (
              <li key={day} className="sch-day">
                <h3 className="sch-h">{day === today ? "Today" : day === addDays(today, 1) ? "Tomorrow" : fmtDate(day, { weekday: "short", month: "short", day: "numeric" })}</h3>
                <ul>{on(day).map(d => <li key={d.id}><Row d={d} today={today} day={day} /></li>)}</ul>
              </li>))}</ul>
          )}</Card>}
      </div>
    </>
  )
}

function Row({ d, today, day }: { d: { id: string; title: string | null; channel: string }; today: string; day?: string }) {
  const title = d.title || "Untitled"
  return (
    <Sheet label={title} title={title} row={<><div style={{ flex: 1, minWidth: 0 }}><div className="tt">{title}</div><div className="meta fn">{d.channel}</div></div><Icon name="chev" size={16} /></>}>
      <form action={async (f: FormData) => { "use server"; await scheduleDraft(d.id, String(f.get("day") || "")) }} className="form">
        <label className="fld"><span>Day</span><input className="in" type="date" name="day" min={today} defaultValue={day ?? addDays(today, 1)} aria-label={`Day for ${title}`} /></label>
        <div className="inline"><button className="btn sm">Schedule</button><Link href={`/os/drafts/${d.id}`} className="btn sm ghost">Open draft</Link></div>
      </form>
      {day && <form className="danger-zone" action={async () => { "use server"; await scheduleDraft(d.id, null) }}><button className="dz-row">Unschedule</button></form>}
    </Sheet>
  )
}
