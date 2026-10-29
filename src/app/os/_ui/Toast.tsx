"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Icon } from "./icons"

export type ToastMsg = { text: string; href?: string; cta?: string; onClick?: () => void; tone?: "err"; ttl?: number }
type T = ToastMsg & { id: number }

export function toast(m: ToastMsg | string) {
  window.dispatchEvent(new CustomEvent("os-toast", { detail: typeof m === "string" ? { text: m } : m }))
}

/** Do something now on screen, commit it after a few seconds unless "Undo" is pressed (Undo over confirm). */
export function undoable(text: string, commit: () => unknown, onUndo?: () => void, ms = 6000) {
  let undone = false, done = false
  const run = () => { if (undone || done) return; done = true; window.removeEventListener("pagehide", run); Promise.resolve(commit()).catch(() => toast({ text: "Couldn’t finish that. Try again.", tone: "err" })) }
  window.addEventListener("pagehide", run)
  toast({ text, cta: "Undo", ttl: ms, onClick: () => { if (done) return; undone = true; window.removeEventListener("pagehide", run); onUndo?.() } })
  setTimeout(run, ms)
}

type Ask = { title?: string; message: string; confirm: string; danger?: boolean; resolve: (ok: boolean) => void }
/** An in-app action sheet (red button + Cancel) for the few things that can't be undone. */
export function ask(o: Omit<Ask, "resolve">): Promise<boolean> {
  return new Promise(resolve => window.dispatchEvent(new CustomEvent("os-ask", { detail: { ...o, resolve } })))
}

function AskHost() {
  const [q, setQ] = useState<Ask | null>(null)
  useEffect(() => {
    const on = (e: Event) => setQ((e as CustomEvent<Ask>).detail)
    window.addEventListener("os-ask", on); return () => window.removeEventListener("os-ask", on)
  }, [])
  useEffect(() => {
    if (!q) return
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { q.resolve(false); setQ(null) } }
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k)
  }, [q])
  if (!q) return null
  const end = (ok: boolean) => { q.resolve(ok); setQ(null) }
  return (
    <div className="modal-bg sheet-bg askbg" onMouseDown={e => { if (e.target === e.currentTarget) end(false) }}>
      <div className="asksheet" role="alertdialog" aria-label={q.title ?? q.message}>
        <div className="ask-g">
          <p className="ask-m">{q.title && <strong>{q.title}</strong>}{q.message}</p>
          <button className={`ask-b${q.danger === false ? "" : " red"}`} onClick={() => end(true)}>{q.confirm}</button>
        </div>
        <button autoFocus className="ask-b ask-c" onClick={() => end(false)}>Cancel</button>
      </div>
    </div>
  )
}

export function ToastHost() {
  const [list, setList] = useState<T[]>([])
  useEffect(() => {
    const on = (e: Event) => {
      const t = { ...(e as CustomEvent<ToastMsg>).detail, id: Date.now() + Math.random() }
      setList(l => [...l.slice(-2), t])
      setTimeout(() => setList(l => l.filter(x => x.id !== t.id)), t.ttl ?? (t.href || t.onClick ? 8000 : 4000))
    }
    window.addEventListener("os-toast", on)
    return () => window.removeEventListener("os-toast", on)
  }, [])
  const close = (id: number) => setList(l => l.filter(x => x.id !== id))
  return (<><AskHost />{list.length > 0 && (
    <div className="toasts" role="status" aria-live="polite">
      {list.map(t => (
        <div key={t.id} className={`toast${t.tone === "err" ? " err" : ""}`}>
          <span>{t.text}</span>
          {t.href && <Link href={t.href} className="btn sm" onClick={() => close(t.id)}>{t.cta ?? "Open"}</Link>}
          {t.onClick && <button className="btn sm" onClick={() => { t.onClick!(); close(t.id) }}>{t.cta ?? "Do it"}</button>}
          <button className="btn ghost sm" aria-label="Dismiss" onClick={() => close(t.id)}><Icon name="x" size={14} /></button>
        </div>
      ))}
    </div>)}</>
  )
}
