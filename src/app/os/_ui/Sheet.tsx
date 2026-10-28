"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Icon, type IconName } from "./icons"

/** A header button that opens a sheet. Any form inside closes it on submit. */
export default function Sheet({ label, title, icon, primary, iconOnly, children }: { label: string; title?: string; icon?: IconName; primary?: boolean; iconOnly?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const done = () => { const f = box.current?.querySelector<HTMLFormElement>("form:has(.btn.pri)") ?? box.current?.querySelector("form"); if (f) { f.requestSubmit(); setTimeout(() => setOpen(false), 50) }; else setOpen(false) }
  useEffect(() => {
    if (!open) { return }
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); done() }
      if (e.key === "Tab" && box.current) { // keep focus inside the sheet
        const f = [...box.current.querySelectorAll<HTMLElement>("button,input:not([type=hidden]),select,textarea,a[href]")].filter(x => x.offsetParent)
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    }
    const back = opener.current
    document.addEventListener("keydown", k)
    setTimeout(() => box.current?.querySelector<HTMLElement>("input:not([type=hidden]):not([type=radio]),textarea")?.focus(), 20)
    return () => { document.removeEventListener("keydown", k); back?.focus() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  return (
    <>
      <button ref={opener} type="button" className={`btn${primary ? " pri" : ""}${iconOnly ? " ghost icon-btn" : ""}`} onClick={() => setOpen(true)} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}>
        {icon && <Icon name={icon} />}{!iconOnly && label}
      </button>
      {open && (
        <div className="modal-bg sheet-bg" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="modal sheet" role="dialog" aria-label={title ?? label} ref={box}
            onSubmit={() => setTimeout(() => setOpen(false), 0)}>
            <header className="sheet-h v2"><button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button><h2>{title ?? label}</h2><button type="button" className="btn ghost sm done" onClick={done}>Done</button></header>
            <div className="sheet-b">{children}</div>
          </div>
        </div>
      )}
    </>
  )
}
