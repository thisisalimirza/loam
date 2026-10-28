import { notFound } from "next/navigation"
import { getAreas, getNote } from "@/lib/os/data"
import NoteEditor from "./NoteEditor"

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [note, areas] = await Promise.all([getNote(id), getAreas()])
  if (!note) notFound()
  return <NoteEditor note={{ id: note.id, title: note.title, body: note.body, area_id: note.area_id }} areas={areas.map(a => ({ id: a.id, name: a.name }))} />
}
