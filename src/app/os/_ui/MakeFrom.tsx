"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { makeTask, promote } from "@/lib/os/actions"
import { CHANNELS, type Channel } from "@/lib/os/types"
import { toast } from "./Toast"

/** Turns a piece of text into a task, a follow-up, or a draft. Shown as a small floating bar. */
export default function MakeFrom({ text, source, entryId, onDone, label = "Selection" }: {
  text: string; source: { type: "entry" | "note"; id: string }; entryId?: string | null; onDone?: () => void; label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const router = useRouter()
  if (!text.trim()) return null
  const run = async (f: () => Promise<void>) => { if (busy) return; setBusy(true); try { await f() } finally { setBusy(false) } }
  const task = (followUp: boolean) => run(async () => {
    const t = await makeTask(text, { followUp, source })
    if (t) toast({ text: `${followUp ? "Follow-up" : "Task"} added: ${t.title}`, href: `?task=${t.id}`, cta: "Open" })
    onDone?.()
  })
  const draft = (c: Channel) => run(async () => {
    const r = await promote(entryId ?? null, text, c)
    toast({ text: `${c} draft started`, href: `/os/drafts/${r.id}`, cta: "Open" }); setDrafting(false); onDone?.()
  })
  return (
    <div className="promote" role="toolbar" aria-label="Make something from this">
      <span>{label}</span>
      {drafting ? (<>
        {CHANNELS.map(c => <button key={c} onMouseDown={e => e.preventDefault()} onClick={() => draft(c)} disabled={busy}>{c}</button>)}
        <button onMouseDown={e => e.preventDefault()} onClick={() => setDrafting(false)}>Back</button>
      </>) : (<>
        <button onMouseDown={e => e.preventDefault()} onClick={() => task(false)} disabled={busy}>Task</button>
        <button onMouseDown={e => e.preventDefault()} onClick={() => task(true)} disabled={busy}>Follow-up</button>
        <button onMouseDown={e => e.preventDefault()} onClick={() => setDrafting(true)} disabled={busy}>Draft</button>
      </>)}
      {busy && <span>Saving…</span>}
      <button aria-hidden style={{ display: "none" }} onClick={() => router.refresh()} />
    </div>
  )
}
