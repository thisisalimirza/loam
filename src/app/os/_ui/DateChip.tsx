"use client"
import { useEffect, useRef, useState } from "react"
import { addDays, fmtDate, parseDate, relDue, todayISO } from "@/lib/os/dates"
import { Icon } from "./icons"

/**
 * A labeled date button ("Due", "Deadline", …) that opens a small picker with quick picks and
 * a type-a-date field. Works inside plain forms through a hidden input, or controlled via onChange.
 */
export default function DateChip({ label = "Due", name, value: controlled, defaultValue = null, onChange, required, clearable = true, quick, size = "sm" }: {
  label?: string; name?: string; value?: string | null; defaultValue?: string | null; onChange?: (v: string | null) => void
  required?: boolean; clearable?: boolean; quick?: [string, number][]; size?: "sm" | "md"
}) {
  const [inner, setInner] = useState<string | null>(defaultValue)
  const v = controlled !== undefined ? controlled : inner
  const [open, setOpen] = useState(false)
  const [txt, setTxt] = useState("")
  const box = useRef<HTMLSpanElement>(null)
  const today = todayISO()
  const guess = txt ? parseDate(txt, today) : null
  const set = (d: string | null) => { setInner(d); onChange?.(d); setOpen(false); setTxt("") }

  useEffect(() => {
    if (!open) return
    const out = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false) } }
    document.addEventListener("mousedown", out); window.addEventListener("keydown", esc, true)
    return () => { document.removeEventListener("mousedown", out); window.removeEventListener("keydown", esc, true) }
  }, [open])
  // Reset with the form.
  useEffect(() => {
    const f = box.current?.closest("form"); if (!f || controlled !== undefined) return
    const r = () => setInner(defaultValue); f.addEventListener("reset", r); return () => f.removeEventListener("reset", r)
  }, [defaultValue, controlled])

  const picks = quick ?? [["Today", 0], ["Tomorrow", 1], ["Next week", 7 - ((new Date(today + "T12:00:00Z").getUTCDay() + 6) % 7)]]
  const shown = v ? (v.slice(0, 4) === today.slice(0, 4) ? relDue(v, today).label.replace(/^Overdue \d+d$/, fmtDate(v)) : fmtDate(v, { month: "short", day: "numeric", year: "numeric" })) : null
  return (
    <span className={`dchip-wrap${size === "md" ? " md" : ""}`} ref={box}>
      {name && <input type="hidden" name={name} value={v ?? ""} />}
      {required && !v && <input tabIndex={-1} aria-hidden className="dchip-req" required value="" onChange={() => {}} onFocus={() => setOpen(true)} />}
      <button type="button" className={`dchip${v ? " set" : ""}`} onClick={() => setOpen(o => !o)} aria-haspopup="dialog" aria-expanded={open}
        aria-label={v ? `${label}: ${fmtDate(v, { weekday: "long", month: "long", day: "numeric" })}. Change` : `Set ${label.toLowerCase()} date`}>
        <Icon name="calendar" size={14} /><span className="dchip-l">{label}</span>{shown && <b>{shown}</b>}
      </button>
      {open && (
        <div className="dpop" role="dialog" aria-label={`${label} date`}>
          <input className="in" autoFocus value={txt} onChange={e => setTxt(e.target.value)} placeholder="Type: fri, next week, nov 4"
            aria-label={`Type a ${label.toLowerCase()} date`} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (guess) set(guess) } }} />
          {txt && <button type="button" className={`dpop-guess${guess ? "" : " no"}`} disabled={!guess} onClick={() => guess && set(guess)}>
            {guess ? fmtDate(guess, { weekday: "short", month: "short", day: "numeric", year: guess.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric" }) : "Not a date I know"}</button>}
          <div className="dpop-q">{picks.map(([l, n]) => <button type="button" key={l} className={v === addDays(today, n) ? "on" : ""} onClick={() => set(addDays(today, n))}>{l}<small>{fmtDate(addDays(today, n), { weekday: "short" })}</small></button>)}</div>
          <label className="dpop-cal"><span>Pick</span><input className="in" type="date" value={v ?? ""} onChange={e => e.target.value && set(e.target.value)} aria-label="Pick from calendar" /></label>
          {clearable && v && <button type="button" className="btn ghost sm" onClick={() => set(null)}>Clear date</button>}
        </div>
      )}
    </span>
  )
}
