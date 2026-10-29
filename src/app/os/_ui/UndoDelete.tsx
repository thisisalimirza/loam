"use client"
import { useRef } from "react"
import { useRouter } from "next/navigation"
import { undoable } from "./Toast"

/** × button that hides its row at once and deletes after the Undo toast runs out. */
export default function UndoDelete({ action, label, toast, className = "btn ghost sm lrn-x" }: { action: () => Promise<unknown>; label: string; toast: string; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  return (
    <button ref={ref} type="button" className={className} aria-label={label} onClick={() => {
      const li = ref.current?.closest("li")
      if (li) li.hidden = true
      undoable(toast, async () => { await action(); router.refresh() }, () => { if (li) li.hidden = false })
    }}>×</button>
  )
}
