import { notFound } from "next/navigation"
import { getDraftsForEntry, getEntry } from "@/lib/os/data"
import Writer from "./Writer"

export const metadata = { title: "Writing" }

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const e = await getEntry(id)
  if (!e) notFound()
  const drafts = await getDraftsForEntry(id)
  return <Writer entry={{ id: e.id, date: e.entry_date, body: e.body, updatedAt: e.updated_at.toISOString() }}
    drafts={drafts.map(d => ({ id: d.id, channel: d.channel, stage: d.stage }))} />
}
