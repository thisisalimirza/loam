import Link from "next/link"
import { getEntries, getOnThisDay } from "@/lib/os/data"
import { fmtDate, todayISO } from "@/lib/os/dates"
import { Card, Empty, PageHeader } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"

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

export default async function Journal({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() || undefined
  const today = todayISO()
  const [entries, otd] = await Promise.all([getEntries(q), q ? Promise.resolve([]) : getOnThisDay(today)])
  return (
    <>
      <PageHeader title="Journal" sub="Private. Most of it goes nowhere, and that’s fine."
        actions={<>
          <Link href="/os/journal/write" className="btn pri"><Icon name="pen" />Write</Link>
        </>} />
      <div className="stack">
        <form className="inline" action="/os/journal">
          <input className="in" name="q" defaultValue={q} placeholder="Search everything you’ve written" aria-label="Search journal" type="search" />
          <button className="btn"><Icon name="search" />Search</button>
          {q && <Link href="/os/journal" className="btn ghost">Clear</Link>}
        </form>
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
        <Card title={q ? `Results for “${q}”` : "Entries"} icon="journal" meta={entries.length || undefined}>
          {entries.length === 0 ? (
            q ? <Empty icon="search" title="Nothing matched">Try a different word.</Empty>
              : <Empty icon="journal" title="Nothing written yet">Press ⌘J from anywhere to open today’s page.</Empty>
          ) : entries.map(e => (
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
