import { notFound } from "next/navigation"
import { getDraft } from "@/lib/os/data"
import DraftEditor from "./DraftEditor"

export const metadata = { title: "Draft" }

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await getDraft(id)
  if (!d) notFound()
  return <DraftEditor d={{ id: d.id, title: d.title, body: d.body, channel: d.channel, stage: d.stage, url: d.url, entry: d.source_entry_id, sort: Number(d.sort) }} />
}
