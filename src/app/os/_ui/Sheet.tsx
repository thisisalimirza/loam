"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Icon, type IconName } from "./icons"

/** A header button that opens a sheet. Any form inside closes it on submit. */
export default function Sheet({ label, title, icon, primary, iconOnly, children }: { label: string; title?: string; icon?: IconName; primary?: boolean; iconOnly?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", k)
    setTimeout(() => box.current?.querySelector<HTMLElement>("input:not([type=hidden]):not([type=radio]),textarea")?.focus(), 20)
    return () => document.removeEventListener("keydown", k)
  }, [open])
  return (
    <>
      <button type="button" className={`btn${primary ? " pri" : ""}${iconOnly ? " ghost icon-btn" : ""}`} onClick={() => setOpen(true)} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}>
        {icon && <Icon name={icon} />}{!iconOnly && label}
      </button>
      {open && (
        <div className="modal-bg sheet-bg" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="modal sheet" role="dialog" aria-label={title ?? label} ref={box}
            onSubmit={() => setTimeout(() => setOpen(false), 0)}>
            <header className="sheet-h"><h2>{title ?? label}</h2><button type="button" className="btn ghost sm" aria-label="Close" onClick={() => setOpen(false)}><Icon name="x" size={14} /></button></header>
            <div className="sheet-b">{children}</div>
          </div>
        </div>
      )}
    </>
  )
}
