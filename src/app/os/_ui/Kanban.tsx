"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import ColJump from "./ColJump"
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors, closestCorners,
  useDroppable, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type KItem = { id: string; col: string; sort: number }

function Column({ id, label, count, children, footer }: { id: string; label: string; count: number; children: ReactNode; footer?: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${id}` })
  return (
    <div ref={setNodeRef} className={`col${isOver ? " over" : ""}`}>
      <div className="colh">{label}{count > 0 && <span>{count}</span>}</div>
      {children}
      {footer}
    </div>
  )
}

function SortCard({ id, children, onOpen }: { id: string; children: ReactNode; onOpen?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`kc${isDragging ? " drag" : ""}`}
      {...attributes} {...listeners} onClick={onOpen}>
      {children}
    </div>
  )
}

/** Drag cards between columns. Calls onMove(id, col, sort) once per drop. */
export default function Kanban<T extends KItem>({ cols, items: initial, render, onMove, onOpen, footer }: {
  cols: { id: string; label: string }[]
  items: T[]
  render: (item: T) => ReactNode
  onMove: (id: string, col: string, sort: number) => void
  onOpen?: (item: T) => void
  footer?: (col: string) => ReactNode
}) {
  const [items, setItems] = useState(initial)
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => setItems(initial), [initial])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const byCol = (c: string) => items.filter(i => i.col === c).sort((a, b) => a.sort - b.sort)
  const colOf = (id: string) => id.startsWith("col:") ? id.slice(4) : items.find(i => i.id === id)?.col

  function onStart(e: DragStartEvent) { setActive(String(e.active.id)) }
  function onOver(e: DragOverEvent) {
    const a = String(e.active.id), o = e.over ? String(e.over.id) : null
    if (!o) return
    const to = colOf(o), from = colOf(a)
    if (!to || to === from) return
    setItems(prev => prev.map(i => i.id === a ? { ...i, col: to } : i))
  }
  function onEnd(e: DragEndEvent) {
    setActive(null)
    const a = String(e.active.id), o = e.over ? String(e.over.id) : null
    if (!o) return
    const col = colOf(o) ?? colOf(a)!
    let list = byCol(col)
    const oldI = list.findIndex(i => i.id === a)
    const newI = o.startsWith("col:") ? list.length - 1 : list.findIndex(i => i.id === o)
    if (oldI >= 0 && newI >= 0 && oldI !== newI) list = arrayMove(list, oldI, newI)
    const idx = list.findIndex(i => i.id === a)
    const prev = list[idx - 1]?.sort, next = list[idx + 1]?.sort
    const sort = prev == null && next == null ? Date.now() / 1000 : prev == null ? next! - 1 : next == null ? prev + 1 : (prev + next) / 2
    setItems(p => p.map(i => i.id === a ? { ...i, col, sort } : i))
    onMove(a, col, sort)
  }
  const activeItem = items.find(i => i.id === active)
  const scroller = useRef<HTMLDivElement>(null)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
      <ColJump scroller={scroller} sel=".col" cols={cols.map(c => ({ id: c.id, label: c.label, count: byCol(c.id).length }))} />
      <div className="board hfade" ref={scroller}>
        {cols.map(c => {
          const list = byCol(c.id)
          return (
            <Column key={c.id} id={c.id} label={c.label} count={list.length} footer={footer?.(c.id)}>
              <SortableContext items={list.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {list.map(i => <SortCard key={i.id} id={i.id} onOpen={onOpen ? () => onOpen(i) : undefined}>{render(i)}</SortCard>)}
              </SortableContext>
            </Column>
          )
        })}
      </div>
      <DragOverlay>{activeItem ? <div className="kc overlay">{render(activeItem)}</div> : null}</DragOverlay>
    </DndContext>
  )
}
