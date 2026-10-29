"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const GO: Record<string, [string, string]> = {
  t: ["/os", "Today"], k: ["/os/tasks", "Tasks"], b: ["/os/board", "Board"], j: ["/os/journal", "Journal"],
  p: ["/os/people", "People"], n: ["/os/notes", "Notes"], a: ["/os/areas", "Projects"], s: ["/os/settings", "Settings"],
}
const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

/** Single-key shortcuts that never fire while typing. ? shows the list. */
export default function Shortcuts() {
  const router = useRouter()
  const [help, setHelp] = useState(false)
  const g = useRef(0)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return
      if (e.key === "Escape") { setHelp(false); return }
      if (e.key === "?") { e.preventDefault(); setHelp(h => !h); return }
      const key = e.key.toLowerCase()
      if (Date.now() - g.current < 1200 && GO[key]) { e.preventDefault(); g.current = 0; router.push(GO[key][0]); return }
      if (key === "g") { g.current = Date.now(); return }
      if (key === "n") { // focus the page's add field if it has one
        const f = document.querySelector<HTMLInputElement>("main [data-add], main input[name=title]")
        if (f) { e.preventDefault(); f.focus() }
      }
    }
    document.addEventListener("keydown", k)
    return () => document.removeEventListener("keydown", k)
  }, [router])
  if (!help) return null
  return (
    <div className="modal-bg" onMouseDown={e => { if (e.target === e.currentTarget) setHelp(false) }}>
      <div className="modal sheet" role="dialog" aria-label="Keyboard shortcuts">
        <header className="sheet-h v2"><span /><h2>Keyboard shortcuts</h2><button type="button" className="btn ghost sm done" onClick={() => setHelp(false)}>Done</button></header>
        <ul className="sheet-b kb">
          <li><kbd>⌘K</kbd><span>Search or add anything</span></li>
          <li><kbd>⌘J</kbd><span>Write in the journal</span></li>
          <li><kbd>N</kbd><span>Add on this page</span></li>
          {Object.entries(GO).map(([c, [, l]]) => <li key={c}><kbd>G</kbd> <kbd>{c.toUpperCase()}</kbd><span>Go to {l}</span></li>)}
          <li><kbd>⌘↵</kbd><span>Done in a sheet</span></li>
          <li><kbd>Esc</kbd><span>Close</span></li>
        </ul>
      </div>
    </div>
  )
}
