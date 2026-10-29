import Link from "next/link"
import { getWeek } from "@/lib/os/review"
import { fmtDate, relDue, todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../_ui/ui"

export const metadata = { title: "Weekly review" }

/** A short Sunday look back and ahead. Every list links to the thing itself. */
export default async function Review() {
  const today = todayISO()
  const w = await getWeek(today)
  const upcoming = w.upcoming.filter(t => t.due_date && t.due_date > today)
  const sum = [w.done.length && `${w.done.length} done`, w.words.days && `${w.words.days} journal ${w.words.days === 1 ? "day" : "days"}`, w.words.n && `${w.words.n.toLocaleString()} words`, w.published && `${w.published} published`].filter(Boolean).join(" · ")
  return (
    <>
      <PageHeader eyebrow="Weekly review" title={`${fmtDate(w.from)} – ${fmtDate(today)}`}
        sub={sum || "Nothing done or written yet this week."} />
      <div className="split"><div className="stack">
        {w.overdue.length + w.stuck.length > 0 && <Card title="Needs a decision" icon="flag" meta={w.overdue.length + w.stuck.length}>
          <ul>
            {w.overdue.map(t => <li key={t.id}><Link href={`/os/review?task=${t.id}`} scroll={false} className="row"><span className="tt">{t.title}</span><span className="due warn">{relDue(t.due_date, today).label}</span></Link></li>)}
            {w.stuck.map(p => <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row"><span className="tt">{p.name}</span><span className="due warn">No next step</span></Link></li>)}
          </ul>
        </Card>}
        {upcoming.length > 0 && <Card title="Next 7 days" icon="calendar">
          <ul>
            {upcoming.map(t => <li key={t.id}><Link href={`/os/review?task=${t.id}`} scroll={false} className="row"><span className="tt">{t.title}</span><span className="due">{relDue(t.due_date, today).label}</span></Link></li>)}
          </ul>
        </Card>}
      </div><aside className="stack side-ctx">
        {w.done.length > 0 && <Card title="Done this week" icon="check">
          <ul>{w.done.slice(0, 12).map(t => <li key={t.id}><Link href={`/os/review?task=${t.id}`} scroll={false} className="row"><span className="tt struck">{t.title}</span></Link></li>)}</ul>
        </Card>}
        {w.quiet.length > 0 && <Card title="Haven’t talked in a while" icon="chat">
          <ul>{w.quiet.map(p => <li key={p.id}><Link href={`/os/people/${p.id}`} className="row"><span className="tt">{p.name}</span><span className="due">{p.last_on ? fmtDate(p.last_on) : "Never logged"}</span></Link></li>)}</ul>
        </Card>}
        {w.words.n > 0 && <p className="quiet-line"><Link href="/os/journal">Read back this week’s journal</Link></p>}
      </aside></div>
    </>
  )
}
