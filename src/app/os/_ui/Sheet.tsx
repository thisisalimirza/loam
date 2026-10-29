"use client"
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { Icon, type IconName } from "./icons"

/** The one sheet: Cancel · title · Done. Centred on wide screens, from the bottom on phones.
 *  Done submits the sheet's form (its own .btn.pri is hidden). Esc closes; focus goes back to the opener.
 *  keepMounted keeps children in the DOM while closed (for fields that belong to an outer form). */
export function SheetPanel({ open, onClose, title, children, keepMounted, opener, noDone }: { open: boolean; onClose: () => void; title: string; children: ReactNode; keepMounted?: boolean; opener?: RefObject<HTMLElement | null>; noDone?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const done = () => { const f = box.current?.querySelector<HTMLFormElement>("form:has(.btn.pri)") ?? box.current?.querySelector("form"); if (f) { f.requestSubmit(); setTimeout(onClose, 50) } else onClose() }
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose() }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); done() }
      if (e.key === "Tab" && box.current) {
        const f = [...box.current.querySelectorAll<HTMLElement>("button,input:not([type=hidden]),select,textarea,a[href]")].filter(x => x.offsetParent)
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    }
    const back = opener?.current ?? (document.activeElement as HTMLElement | null)
    document.addEventListener("keydown", k)
    setTimeout(() => box.current?.querySelector<HTMLElement>("input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea")?.focus(), 20)
    return () => { document.removeEventListener("keydown", k); back?.focus?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  if (!open && !keepMounted) return null
  return (
    <div className="modal-bg sheet-bg" hidden={!open} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal sheet" role="dialog" aria-label={title} ref={box}
        onSubmit={() => setTimeout(onClose, 0)}>
        <header className="sheet-h v2"><button type="button" className="btn ghost sm" onClick={onClose}>Cancel</button><h2>{title}</h2>{noDone ? <span /> : <button type="button" className="btn ghost sm done" onClick={done}>Done</button>}</header>
        <div className="sheet-b">{children}</div>
      </div>
    </div>
  )
}

/** A header button (or a row) that opens the sheet. Any form inside closes it on submit. */
export default function Sheet({ label, title, icon, primary, iconOnly, row, children }: { label: string; title?: string; icon?: IconName; primary?: boolean; iconOnly?: boolean; row?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  return (
    <>
      {row ? <button ref={opener} type="button" className="row row-btn" onClick={() => setOpen(true)} aria-label={label}>{row}</button> : <button ref={opener} type="button" className={`btn${primary ? " pri" : ""}${iconOnly ? " ghost icon-btn" : ""}${iconOnly && icon === "plus" ? " add-btn" : ""}`} onClick={() => setOpen(true)} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}>
        {icon && <Icon name={icon} />}{!iconOnly && label}
      </button>}
      <SheetPanel open={open} onClose={() => setOpen(false)} title={title ?? label} opener={opener}>{children}</SheetPanel>
    </>
  )
}
