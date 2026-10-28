"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Icon } from "./icons"

export type ToastMsg = { text: string; href?: string; cta?: string; onClick?: () => void; tone?: "err" }
type T = ToastMsg & { id: number }

export function toast(m: ToastMsg | string) {
  window.dispatchEvent(new CustomEvent("os-toast", { detail: typeof m === "string" ? { text: m } : m }))
}

export function ToastHost() {
  const [list, setList] = useState<T[]>([])
  useEffect(() => {
    const on = (e: Event) => {
      const t = { ...(e as CustomEvent<ToastMsg>).detail, id: Date.now() + Math.random() }
      setList(l => [...l.slice(-2), t])
      setTimeout(() => setList(l => l.filter(x => x.id !== t.id)), t.href || t.onClick ? 8000 : 4000)
    }
    window.addEventListener("os-toast", on)
    return () => window.removeEventListener("os-toast", on)
  }, [])
  if (!list.length) return null
  const close = (id: number) => setList(l => l.filter(x => x.id !== id))
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map(t => (
        <div key={t.id} className={`toast${t.tone === "err" ? " err" : ""}`}>
          <span>{t.text}</span>
          {t.href && <Link href={t.href} className="btn sm" onClick={() => close(t.id)}>{t.cta ?? "Open"}</Link>}
          {t.onClick && <button className="btn sm" onClick={() => { t.onClick!(); close(t.id) }}>{t.cta ?? "Do it"}</button>}
          <button className="btn ghost sm" aria-label="Dismiss" onClick={() => close(t.id)}><Icon name="x" size={14} /></button>
        </div>
      ))}
    </div>
  )
}
