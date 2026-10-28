"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { marked } from "marked"
import { deleteNote, saveNote } from "@/lib/os/actions"
import { Icon } from "../../../_ui/icons"
import Confirm from "../../../_ui/Confirm"

marked.setOptions({ gfm: true, breaks: true })
const escapeHtml = (s: string) => s.replace(/</g, "&lt;")

export default function NoteEditor({ note, areas }: { note: { id: string; title: string; body: string; area_id: string | null }; areas: { id: string; name: string }[] }) {
  const [title, setTitle] = useState(note.title === "Untitled" ? "" : note.title)
  const [body, setBody] = useState(note.body)
  const [area, setArea] = useState(note.area_id ?? "")
  const [mode, setMode] = useState<"write" | "read">(note.body ? "read" : "write")
  const [status, setStatus] = useState("Saved")
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    setStatus("Saving…")
    const t = setTimeout(() => saveNote(note.id, title, body, area || null).then(() => setStatus("Saved")).catch(() => setStatus("Not saved, retrying on next edit")), 600)
    return () => clearTimeout(t)
  }, [title, body, area, note.id])

  return (
    <>
      <header className="hd">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link className="crumb" href="/os/notes"><Icon name="back" size={14} />Notes</Link>
          <input className="title-in" value={title} onChange={e => setTitle(e.target.value)} placeholder="Untitled" aria-label="Title" />
        </div>
        <div className="hd-actions">
          <span className="meta">{status}</span>
          <nav className="seg"><button className={mode === "write" ? "on" : ""} onClick={() => setMode("write")}>Write</button><button className={mode === "read" ? "on" : ""} onClick={() => setMode("read")}>Preview</button></nav>
        </div>
      </header>
      <section className="card cb" style={{ marginBottom: 16 }}>
        {mode === "write"
          ? <textarea className="editor" value={body} onChange={e => setBody(e.target.value)} placeholder="Start writing. Markdown works: # headings, - lists, **bold**, [links](https://…)" autoFocus={!note.body} />
          : body.trim() ? <div className="md" dangerouslySetInnerHTML={{ __html: marked.parse(escapeHtml(body)) as string }} /> : <p className="muted">Empty note.</p>}
      </section>
      <div className="inline">
        <select className="in" value={area} onChange={e => setArea(e.target.value)} style={{ flex: "0 1 200px" }} aria-label="Area">
          <option value="">No area</option>{areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <Confirm action={deleteNote.bind(null, note.id)} label="Delete note" message="Delete this note?" />
      </div>
    </>
  )
}
