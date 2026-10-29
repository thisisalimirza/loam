import Link from "next/link"
import { getDrafts } from "@/lib/os/data"
import { createDraft } from "@/lib/os/actions"
import { CHANNELS } from "@/lib/os/types"
import { PageHeader } from "../../_ui/ui"
import DraftBoard from "./DraftBoard"

export const metadata = { title: "Drafts" }

export default async function Drafts() {
  const drafts = await getDrafts()
  const use: Record<string, number> = {}; for (const d of drafts) use[d.channel] = (use[d.channel] ?? 0) + 1
  const usual = Object.entries(use).sort((a, b) => b[1] - a[1])[0]?.[0] ?? CHANNELS[0]
  return (
    <>
      <PageHeader title="Drafts" 
        actions={<><Link href="/os/drafts/schedule" className="btn">Schedule</Link><form action={createDraft} className="inline dr-add">
          <input className="in" name="title" placeholder="New idea" aria-label="Draft title" style={{ width: 160 }} />
          <select className="in" name="channel" aria-label="Channel" style={{ width: 130 }} defaultValue={usual}>{[...CHANNELS].sort((a, b) => (use[b] ?? 0) - (use[a] ?? 0)).map(c => <option key={c}>{c}</option>)}</select>
          <button className="btn pri">Add</button>
        </form></>} />
      {drafts.length === 0 ? <p className="quiet-line">No drafts yet.</p> : <div className="drafts-kb"><DraftBoard drafts={drafts.map(d => ({ id: d.id, col: d.stage, sort: Number(d.sort), title: d.title, body: (d.body ?? "").slice(0, 160), channel: d.channel, url: d.url }))} /></div>}
    </>
  )
}
