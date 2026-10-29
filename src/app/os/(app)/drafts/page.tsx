import WriteSwitch from "../../_ui/WriteSwitch"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getDrafts, getEntries } from "@/lib/os/data"
import { addDays, fmtDate, todayISO } from "@/lib/os/dates"
import { createDraft, promote } from "@/lib/os/actions"
import type { Channel } from "@/lib/os/types"
import { CHANNELS } from "@/lib/os/types"
import { PageHeader } from "../../_ui/ui"
import DraftBoard from "./DraftBoard"

export const metadata = { title: "Drafts" }

export default async function Drafts() {
  const [drafts, entries] = await Promise.all([getDrafts(), getEntries().catch(() => [])])
  const since = addDays(todayISO(), -21)
  const used = new Set(drafts.map(d => d.source_entry_id).filter(Boolean))
  const day = (v: unknown) => v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)
  const seeds = entries.filter(e => day(e.entry_date) >= since && !used.has(e.id) && e.body.trim().split(/\s+/).length >= 60).slice(0, 3)
  const use: Record<string, number> = {}; for (const d of drafts) use[d.channel] = (use[d.channel] ?? 0) + 1
  const usual = Object.entries(use).sort((a, b) => b[1] - a[1])[0]?.[0] ?? CHANNELS[0]
  return (
    <>
      <WriteSwitch /><PageHeader title="Drafts" actions={drafts.some(d => d.scheduled_for) ? <Link href="/os/schedule" className="quiet-link">Schedule</Link> : undefined} />
      {seeds.length > 0 && (
        <section className="quiet-sec seeds" aria-label="From your journal">
          <h2 className="sec-h">From your journal</h2>
          <ul>{seeds.map(e => (
            <li key={e.id} className="row">
              <span className="tt"><small className="meta">{fmtDate(day(e.entry_date))}</small> {e.body.trim().split("\n")[0].replace(/^#+\s*/, "").slice(0, 90)}</span>
              <form action={async () => { "use server"; const r = await promote(e.id, e.body, usual as Channel); redirect(`/os/drafts/${r.id}`) }}><button className="btn sm">Make a draft</button></form>
            </li>))}</ul>
        </section>
      )}
      {drafts.length === 0 && <p className="quiet-line">No drafts yet.</p>}
      <form action={createDraft} className="dr-new">
        <input className="in" name="title" placeholder="Add a draft" aria-label="Draft title" />
        <select name="channel" aria-label="Channel" defaultValue={usual}>{[...CHANNELS].sort((a, b) => (use[b] ?? 0) - (use[a] ?? 0)).map(c => <option key={c}>{c}</option>)}</select>
        <button className="btn pri sm">Add</button>
      </form>
      {drafts.length > 0 && <div className="drafts-kb"><DraftBoard drafts={drafts.map(d => ({ id: d.id, col: d.stage, sort: Number(d.sort), title: d.title, body: (d.body ?? "").slice(0, 160), channel: d.channel, url: d.url }))} /></div>}
    </>
  )
}
