import Link from "next/link"
import { getWeek } from "@/lib/os/review"
import { fmtDate, relDue, todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../_ui/ui"

export const metadata = { title: "Weekly review" }

/** A short Sunday look back and ahead. Every list links to the thing itself. */
export default async function Review() {
  const today = todayISO()
  const w = await getWeek(today)
  return (
    <>
      <PageHeader eyebrow="Weekly review" title={`${fmtDate(w.from)} – ${fmtDate(today)}`}
        sub={`${w.done.length} done · ${w.words.days} journal ${w.words.days === 1 ? "day" : "days"}${w.published ? ` · ${w.published} published` : ""}`} />
      <div className="split"><div className="stack">
        <Card title="Needs a decision" icon="flag" meta={w.overdue.length + w.stuck.length || undefined}>
          {w.overdue.length + w.stuck.length === 0 ? <p className="quiet-line" style={{ padding: "4px 16px 14px" }}>Nothing overdue and every project has a next step.</p> : <ul>
            {w.overdue.map(t => <li key={t.id}><Link href={`/os/review?task=${t.id}`} scroll={false} className="row"><span className="tt">{t.title}</span><span className="due warn">{relDue(t.due_date, today).label}</span></Link></li>)}
            {w.stuck.map(p => <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row"><span className="tt">{p.name}</span><span className="due warn">No next step</span></Link></li>)}
          </ul>}
        </Card>
        <Card title="Coming up" icon="calendar" meta={w.upcoming.length || undefined}>
          {w.upcoming.length === 0 ? <p className="quiet-line" style={{ padding: "4px 16px 14px" }}>Nothing dated for the next 7 days.</p> : <ul>
            {w.upcoming.map(t => <li key={t.id}><Link href={`/os/review?task=${t.id}`} scroll={false} className="row"><span className="tt">{t.title}</span><span className="due">{relDue(t.due_date, today).label}</span></Link></li>)}
          </ul>}
        </Card>
      </div><aside className="stack side-ctx">
        <Card title="Done this week" icon="check" meta={w.done.length || undefined}>
          {w.done.length === 0 ? <p className="quiet-line" style={{ padding: "4px 16px 14px" }}>Nothing marked done yet.</p> : <ul>{w.done.slice(0, 12).map(t => <li key={t.id}><Link href={`/os/review?task=${t.id}`} scroll={false} className="row"><span className="tt struck">{t.title}</span></Link></li>)}</ul>}
        </Card>
        {w.quiet.length > 0 && <Card title="Haven’t talked in a while" icon="chat" meta={w.quiet.length}>
          <ul>{w.quiet.map(p => <li key={p.id}><Link href={`/os/people/${p.id}`} className="row"><span className="tt">{p.name}</span><span className="due">{p.last_on ? fmtDate(p.last_on) : "Never logged"}</span></Link></li>)}</ul>
        </Card>}
        <p className="quiet-line">{w.words.n.toLocaleString()} words in the journal this week. <Link href="/os/journal">Read back</Link></p>
      </aside></div>
    </>
  )
}
