import { getDrafts } from "@/lib/os/data"
import { createDraft } from "@/lib/os/actions"
import { CHANNELS } from "@/lib/os/types"
import { PageHeader } from "../../_ui/ui"
import DraftBoard from "./DraftBoard"

export const metadata = { title: "Drafts" }

export default async function Drafts() {
  const drafts = await getDrafts()
  return (
    <>
      <PageHeader title="Drafts" sub="Ideas on their way out. Drag a card to move it along."
        actions={<form action={createDraft} className="inline">
          <input className="in" name="title" placeholder="New idea" aria-label="Draft title" style={{ width: 180 }} />
          <select className="in" name="channel" aria-label="Channel" style={{ width: 130 }}>{CHANNELS.map(c => <option key={c}>{c}</option>)}</select>
          <button className="btn pri">Add</button>
        </form>} />
      <DraftBoard drafts={drafts.map(d => ({ id: d.id, col: d.stage, sort: Number(d.sort), title: d.title, body: (d.body ?? "").slice(0, 160), channel: d.channel, url: d.url }))} />
    </>
  )
}
