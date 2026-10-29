import WriteSwitch from "../../_ui/WriteSwitch"
import Link from "next/link"
import { getEntries, getOnThisDay } from "@/lib/os/data"
import { fmtDate, todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"
import SearchField from "../../_ui/SearchField"

export const metadata = { title: "Journal" }

function snippet(body: string, q?: string) {
  if (!q) return body.slice(0, 600)
  const i = body.toLowerCase().indexOf(q.toLowerCase())
  const start = Math.max(0, i - 120)
  return (start > 0 ? "…" : "") + body.slice(start, start + 600)
}
function Hl({ text, q }: { text: string; q?: string }) {
  if (!q) return <>{text}</>
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"))
  return <>{parts.map((p, i) => i % 2 ? <mark key={i}>{p}</mark> : p)}</>
}

export default async function Journal({ searchParams }: { searchParams: Promise<{ q?: string; gone?: string }> }) {
  const sp = await searchParams
  const q = sp.q?.trim() || undefined
  const today = todayISO()
  const [all, otd] = await Promise.all([getEntries(q), q ? Promise.resolve([]) : getOnThisDay(today)])
  const entries = all.filter(e => e.id !== sp.gone)
  const write = <Link href="/os/journal/write" className="btn ghost icon-btn add-btn" aria-label="Write" title="Write"><Icon name="plus" /></Link>
  if (!q && entries.length === 0) return (<><WriteSwitch /><PageHeader title="Journal" actions={write} /><p className="quiet-line empty-one">Nothing written yet. It stays private.</p></>)
  return (
    <>
      <WriteSwitch /><PageHeader title="Journal"
        actions={write} />
      <div className="stack">
        <SearchField action="/os/journal" q={q} label="Search journal" placeholder="Search your journal" />
        {otd.length > 0 && (
          <Card title="On this day" icon="clock" className="recap">
            {otd.map(e => (
              <Link key={e.id} href={`/os/journal/${e.id}`} className="entry">
                <div className="d">{fmtDate(e.entry_date, { month: "long", day: "numeric", year: "numeric" })}</div>
                <p>{e.body.slice(0, 400)}</p>
              </Link>
            ))}
          </Card>
        )}
        <Card>
          {entries.length === 0 ? <p className="quiet-line empty-line">Nothing matched. Try a different word.</p> : entries.map(e => (
            <Link key={e.id} href={`/os/journal/${e.id}`} className="entry">
              <div className="d">{fmtDate(e.entry_date, { weekday: "long", month: "long", day: "numeric", year: e.entry_date.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric" })}</div>
              <p><Hl text={snippet(e.body, q)} q={q} /></p>
            </Link>
          ))}
        </Card>
      </div>
    </>
  )
}
