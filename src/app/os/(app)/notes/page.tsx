import Link from "next/link"
import { getAreas, getNotes } from "@/lib/os/data"
import { createNote } from "@/lib/os/actions"
import { ago, todayISO } from "@/lib/os/dates"
import { Card, Empty, PageHeader, Pill } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"

export const metadata = { title: "Notes" }

export default async function Notes() {
  const [notes, areas] = await Promise.all([getNotes(), getAreas(true)])
  const today = todayISO()
  return (
    <>
      <PageHeader title="Notes" sub="Markdown. Meeting notes, plans, things to keep."
        actions={<form action={createNote}><button className="btn pri"><Icon name="plus" />New note</button></form>} />
      <Card>
        {notes.length === 0 ? <Empty icon="notes" title="No notes yet">Write one here, or type “note: title” into ⌘K.</Empty> : (
          <ul>
            {notes.map(n => {
              const a = areas.find(x => x.id === n.area_id)
              const preview = n.body.replace(/[#*_>`-]/g, "").trim().split("\n")[0]
              return (
                <li key={n.id}><Link href={`/os/notes/${n.id}`} className="row" style={{ minHeight: 58 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tt">{n.title}</div>
                    {preview && <div className="meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{preview}</div>}
                  </div>
                  {a && <Pill color={a.color}>{a.name}</Pill>}
                  <span className="due">{ago(n.updated_at.toISOString(), today)}</span>
                </Link></li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
