"use client"
import { useRouter } from "next/navigation"
import { useRef } from "react"
import { Icon } from "./icons"

/** White search field that filters as you type (no button). */
export default function SearchField({ action, q, label, placeholder, hidden }: { action: string; q?: string; label: string; placeholder: string; hidden?: Record<string, string | undefined> }) {
  const router = useRouter()
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  const go = (v: string) => {
    const p = new URLSearchParams()
    for (const [k, x] of Object.entries(hidden ?? {})) if (x) p.set(k, x)
    if (v.trim()) p.set("q", v)
    const s = p.toString()
    router.replace(`${action}${s ? "?" + s : ""}`, { scroll: false })
  }
  return (
    <form className="sfield" action={action} role="search" onSubmit={e => { e.preventDefault(); clearTimeout(t.current); go(new FormData(e.currentTarget).get("q") as string ?? "") }}>
      <Icon name="search" size={14} />
      {Object.entries(hidden ?? {}).map(([k, v]) => v ? <input key={k} type="hidden" name={k} value={v} /> : null)}
      <input type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label={label} onChange={e => { const v = e.target.value; clearTimeout(t.current); t.current = setTimeout(() => go(v), 250) }} />
    </form>
  )
}
