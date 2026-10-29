import WriteSwitch from "../../_ui/WriteSwitch"
import Link from "next/link"
import { getAreas, getNotes } from "@/lib/os/data"
import { createNote } from "@/lib/os/actions"
import { ago, todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"

export const metadata = { title: "Notes" }

export default async function Notes() {
  const [notes, areas] = await Promise.all([getNotes(), getAreas(true)])
  const today = todayISO()
  return (
    <>
      <WriteSwitch /><PageHeader title="Notes"
        actions={<form action={createNote}><button className="btn ghost icon-btn" aria-label="New note" title="New note"><Icon name="plus" /></button></form>} />
      {notes.length === 0 ? <p className="quiet-line empty-one">No notes yet.</p> : <Card>{(
          <ul>
            {notes.map(n => {
              const a = areas.find(x => x.id === n.area_id)
              const preview = n.body.replace(/[#*_>`-]/g, "").trim().split("\n")[0]
              return (
                <li key={n.id}><Link href={`/os/notes/${n.id}`} className="row" style={{ minHeight: 58 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tt">{n.title}</div>
                    {preview && <div className="meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{preview}</div>}
                    <div className="meta fn">{[a?.name, ago(n.updated_at.toISOString(), today)].filter(Boolean).join(" · ")}</div>
                  </div>
                </Link></li>
              )
            })}
          </ul>
        )}</Card>}
    </>
  )
}
