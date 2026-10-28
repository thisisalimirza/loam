"use client"
import { useRef, useState } from "react"
import type { CheckItem } from "@/lib/os/types"
import { Icon } from "../../_ui/icons"

/** Inline-editable checklist: click text to edit, Enter saves (on the last item adds one), Esc cancels,
 *  Backspace on an empty item deletes it, drag or Alt+↑/↓ to reorder, swipe left on touch to delete. */
export default function Checklist({ items, onSave, onPromote }: {
  items: CheckItem[]; onSave: (next: CheckItem[]) => void; onPromote: (i: number) => void
}) {
  const [edit, setEdit] = useState<number | null>(null)
  const [draft, setDraft] = useState("")
  const [newItem, setNewItem] = useState("")
  const [drag, setDrag] = useState<number | null>(null)
  const addRef = useRef<HTMLInputElement>(null)
  const touch = useRef<{ x: number; i: number } | null>(null)
  const [swiped, setSwiped] = useState<number | null>(null)

  const start = (i: number) => { setEdit(i); setDraft(items[i].text) }
  const remove = (i: number) => { onSave(items.filter((_, j) => j !== i)); setEdit(null) }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return
    const n = [...items]; const [x] = n.splice(from, 1); n.splice(to, 0, x); onSave(n)
  }
  const commit = (i: number, next?: "add") => {
    const v = draft.trim()
    if (!v) remove(i)
    else if (v !== items[i].text) onSave(items.map((x, j) => j === i ? { ...x, text: v } : x))
    setEdit(null)
    if (next === "add") setTimeout(() => addRef.current?.focus(), 0)
  }

  return (
    <>
      <ul className="dr-check">
        {items.map((c, i) => (
          <li key={i + c.text} className={`cl-row${drag === i ? " dragging" : ""}${swiped === i ? " swiped" : ""}`}
            draggable={edit !== i} onDragStart={e => { setDrag(i); e.dataTransfer.effectAllowed = "move" }}
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (drag != null) move(drag, i); setDrag(null) }} onDragEnd={() => setDrag(null)}
            onTouchStart={e => { touch.current = { x: e.touches[0].clientX, i } }}
            onTouchMove={e => { const t = touch.current; if (t && t.x - e.touches[0].clientX > 50) setSwiped(t.i) }}
            onTouchEnd={() => { touch.current = null }}>
            <span className="cl-grip" aria-hidden><Icon name="more" size={12} /></span>
            <input type="checkbox" checked={c.done} aria-label={`Done: ${c.text}`}
              onChange={() => onSave(items.map((x, j) => j === i ? { ...x, done: !x.done } : x))} />
            {edit === i ? (
              <input className="in cl-in" autoFocus value={draft} aria-label="Edit checklist item"
                onChange={e => setDraft(e.target.value)} onBlur={() => edit === i && commit(i)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); commit(i, i === items.length - 1 ? "add" : undefined); if (i < items.length - 1) start(i + 1) }
                  else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setEdit(null) }
                  else if (e.key === "Backspace" && draft === "") { e.preventDefault(); remove(i) }
                }} />
            ) : (
              <button type="button" className={`cl-t${c.done ? " struck" : ""}`} onClick={() => start(i)} aria-label={`Edit ${c.text}`}
                onKeyDown={e => { if (e.altKey && e.key === "ArrowUp") { e.preventDefault(); move(i, i - 1) } if (e.altKey && e.key === "ArrowDown") { e.preventDefault(); move(i, i + 1) } }}>{c.text}</button>
            )}
            <span className="cl-act">
              <button type="button" className="bd-icon" aria-label={`Make "${c.text}" its own task`} title="Make it a task" onClick={() => onPromote(i)}><Icon name="tasks" size={12} /></button>
              <button type="button" className="bd-icon" aria-label="Remove item" onClick={() => remove(i)}><Icon name="x" size={12} /></button>
            </span>
            {swiped === i && <button type="button" className="cl-swipe" onClick={() => { setSwiped(null); remove(i) }}>Delete</button>}
          </li>
        ))}
      </ul>
      <form className="inline" onSubmit={e => { e.preventDefault(); if (newItem.trim()) { onSave([...items, { text: newItem.trim(), done: false }]); setNewItem("") } }}>
        <input ref={addRef} className="in" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add an item" aria-label="New checklist item" />
      </form>
    </>
  )
}
