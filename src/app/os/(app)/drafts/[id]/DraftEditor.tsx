"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { deleteDraft, moveDraft, saveDraft } from "@/lib/os/actions"
import { CHANNELS, type Channel, type Stage } from "@/lib/os/types"
import { Icon } from "../../../_ui/icons"
import Confirm from "../../../_ui/Confirm"

const STAGES: { id: Stage; label: string }[] = [{ id: "idea", label: "Idea" }, { id: "drafting", label: "Drafting" }, { id: "ready", label: "Ready" }, { id: "published", label: "Published" }]

export default function DraftEditor({ d }: { d: { id: string; title: string; body: string; channel: Channel; stage: Stage; url: string | null; entry: string | null; sort: number } }) {
  const [title, setTitle] = useState(d.title)
  const [body, setBody] = useState(d.body)
  const [channel, setChannel] = useState<Channel>(d.channel)
  const [url, setUrl] = useState(d.url ?? "")
  const [stage, setStage] = useState<Stage>(d.stage)
  const [status, setStatus] = useState("Saved")
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    setStatus("Saving…")
    const t = setTimeout(() => saveDraft(d.id, { title, body, channel, url: url.trim() || null }).then(() => setStatus("Saved")).catch(() => setStatus("Not saved")), 600)
    return () => clearTimeout(t)
  }, [title, body, channel, url, d.id])

  const n = [...body].length
  const isX = channel === "X"
  return (
    <>
      <header className="hd">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link className="crumb" href="/os/drafts"><Icon name="back" size={14} />Drafts</Link>
          <input className="title-in" value={title} onChange={e => setTitle(e.target.value)} placeholder={isX ? "Label (not posted)" : "Title"} aria-label="Title" />
        </div>
        <div className="hd-actions"><span className="meta">{status}</span></div>
      </header>
      <div className="stack">
        <div className="inline">
          <nav className="seg" aria-label="Channel">{CHANNELS.map(c => <button key={c} className={c === channel ? "on" : ""} onClick={() => setChannel(c)}>{c}</button>)}</nav>
          <nav className="seg" aria-label="Stage">{STAGES.map(s => <button key={s.id} className={s.id === stage ? "on" : ""} onClick={() => { setStage(s.id); moveDraft(d.id, s.id, d.sort, null) }}>{s.label}</button>)}</nav>
        </div>
        <section className="card cb">
          <textarea className="editor" value={body} onChange={e => setBody(e.target.value)} placeholder={isX ? "Say it in 280." : "Write the draft."} aria-label="Draft body" style={isX ? { minHeight: 180 } : undefined} />
          <div className={`counter${isX && n > 280 ? " over" : ""}`}>{isX ? `${n} / 280` : `${body.trim() ? body.trim().split(/\s+/).length : 0} words`}</div>
        </section>
        {stage === "published" && (
          <input className="in" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Published URL" aria-label="Published URL" />
        )}
        <div className="inline">
          {d.entry && <Link href={`/os/journal/${d.entry}`} className="btn sm"><Icon name="journal" size={14} />Source entry</Link>}
          {url && <a href={url} target="_blank" rel="noreferrer" className="btn sm">Open live ↗</a>}
          <Confirm action={deleteDraft.bind(null, d.id)} label="Delete draft" message="Delete this draft?" />
        </div>
      </div>
    </>
  )
}
