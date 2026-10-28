"use client"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { deleteEntry, promote, saveEntry } from "@/lib/os/actions"
import { fmtDate } from "@/lib/os/dates"
import { CHANNELS, type Channel } from "@/lib/os/types"
import { Icon } from "../../../_ui/icons"

type Local = { body: string; at: number }

export default function Writer({ entry, drafts: initialDrafts }: {
  entry: { id: string; date: string; body: string; updatedAt: string }
  drafts: { id: string; channel: string; stage: string }[]
}) {
  const key = `loam:journal:${entry.id}`
  const [body, setBody] = useState(entry.body)
  const [status, setStatus] = useState<"saved" | "saving" | "offline">("saved")
  const [sel, setSel] = useState("")
  const [drafts, setDrafts] = useState(initialDrafts)
  const [made, setMade] = useState<{ id: string; channel: string } | null>(null)
  const [menu, setMenu] = useState(false)
  const ta = useRef<HTMLTextAreaElement>(null)
  const dirty = useRef(false)

  // A local copy survives a dropped connection; restore it if it's newer than the server's.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const l: Local = JSON.parse(raw)
        if (l.at > Date.parse(entry.updatedAt) && l.body !== entry.body) { setBody(l.body); dirty.current = true }
        else localStorage.removeItem(key)
      }
    } catch {}
    ta.current?.focus()
    const el = ta.current
    if (el) el.selectionStart = el.selectionEnd = el.value.length
  }, [key, entry.updatedAt, entry.body])

  const flush = useCallback(async (text: string) => {
    setStatus("saving")
    try {
      await saveEntry(entry.id, text)
      dirty.current = false
      localStorage.removeItem(key)
      setStatus("saved")
    } catch { setStatus("offline") }
  }, [entry.id, key])

  useEffect(() => {
    if (!dirty.current) return
    try { localStorage.setItem(key, JSON.stringify({ body, at: Date.now() } satisfies Local)) } catch {}
    const t = setTimeout(() => flush(body), 700)
    return () => clearTimeout(t)
  }, [body, flush, key])

  useEffect(() => {
    const onOnline = () => { if (dirty.current) flush(body) }
    window.addEventListener("online", onOnline)
    const beforeUnload = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault() }
    window.addEventListener("beforeunload", beforeUnload)
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("beforeunload", beforeUnload) }
  }, [body, flush])

  function readSel() {
    const el = ta.current; if (!el) return
    setSel(el.value.slice(el.selectionStart, el.selectionEnd).trim())
  }

  async function doPromote(channel: Channel, text: string) {
    if (!text.trim()) return
    if (dirty.current) await flush(body)
    const r = await promote(entry.id, text, channel)
    setDrafts(d => [...d, { id: r.id, channel, stage: "idea" }])
    setMade({ id: r.id, channel })
    setMenu(false); setSel("")
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0
  return (
    <div className="writer">
      <div className="writer-top">
        <Link href="/os/journal" className="btn ghost sm"><Icon name="back" size={14} />Journal</Link>
        <span className="grow" />
        <span className="saved">{words} {words === 1 ? "word" : "words"} · {status === "saved" ? "Saved" : status === "saving" ? "Saving…" : "Offline, kept on this device"}</span>
        <div style={{ position: "relative" }}>
          <button className="btn sm" onClick={() => setMenu(m => !m)} disabled={!body.trim()}><Icon name="drafts" size={14} />Promote</button>
          {menu && (
            <div className="card" style={{ position: "absolute", right: 0, top: 38, padding: 6, zIndex: 5, width: 200 }}>
              <div className="meta" style={{ padding: "6px 10px" }}>Turn {sel ? "the selection" : "this entry"} into a draft for</div>
              {CHANNELS.map(c => <button key={c} className="row hov" style={{ width: "100%", minHeight: 36 }} onClick={() => doPromote(c, sel || body)}>{c}</button>)}
            </div>
          )}
        </div>
        <button className="btn ghost sm" aria-label="Delete entry" onClick={async () => { if (confirm("Delete this entry?")) { localStorage.removeItem(key); dirty.current = false; await deleteEntry(entry.id) } }}><Icon name="trash" size={14} /></button>
      </div>
      <div className="writer-date">{fmtDate(entry.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
      <div className="writer-body">
        <textarea ref={ta} value={body} placeholder="What’s on your mind?" aria-label="Journal entry"
          onChange={e => { dirty.current = true; setBody(e.target.value) }}
          onSelect={readSel} onKeyUp={readSel} onMouseUp={readSel} onBlur={() => { if (dirty.current) flush(body) }} />
      </div>
      {(sel || made || drafts.length > 0) && (
        <div className="promote">
          {sel ? (<>
            <span>Make a draft from selection</span>
            {CHANNELS.map(c => <button key={c} onMouseDown={e => e.preventDefault()} onClick={() => doPromote(c, sel)}>{c}</button>)}
          </>) : made ? (<>
            <span>{made.channel} draft created</span>
            <Link href={`/os/drafts/${made.id}`}><button>Open</button></Link>
            <button onClick={() => setMade(null)} aria-label="Dismiss"><Icon name="x" size={14} /></button>
          </>) : (<>
            <span>{drafts.length} {drafts.length === 1 ? "draft" : "drafts"} from this entry</span>
            {drafts.slice(-3).map(d => <Link key={d.id} href={`/os/drafts/${d.id}`}><button>{d.channel}</button></Link>)}
          </>)}
        </div>
      )}
    </div>
  )
}
