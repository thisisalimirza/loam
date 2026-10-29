"use client"
import SmartInput, { type SmartHandle, type SmartValue } from "../../_ui/SmartInput"
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, closestCorners, useDroppable, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { BoardData, BoardTask } from "@/lib/os/board"
import type { BoardColumn, BoardFilters, BoardView, TaskStatus } from "@/lib/os/types"
import { bArchiveDone, bColumnDelete, bColumnOrder, bColumnSave, bCreate, bMove, bUnarchiveAll, bUpdate, bViewDelete, bViewSave } from "@/lib/os/boardActions"
import { relDue } from "@/lib/os/dates"
import ColJump from "../../_ui/ColJump"
import { Icon } from "../../_ui/icons"
import { Mentions } from "../../_ui/Mentions"
import { toast } from "../../_ui/Toast"
import PanelBoundary from "../../_ui/PanelBoundary"
import Drawer from "./Drawer"

const PRI: Record<string, { label: string; c: string }> = {
  urgent: { label: "Urgent", c: "#d9443b" }, high: { label: "High", c: "#e8833a" }, normal: { label: "Normal", c: "#8a8fa3" }, low: { label: "Low", c: "#b4b8c7" },
}
export { PRI }
const KIND_LABEL: Record<TaskStatus, string> = { todo: "To do", doing: "In progress", done: "Done" }
const NO_AREA = "none"

export function age(iso: string) {
  const ms = Date.now() - Date.parse(iso)
  const h = ms / 3600000
  if (h < 1) return "now"
  if (h < 24) return `${Math.floor(h)}h`
  const d = Math.floor(h / 24)
  return d < 60 ? `${d}d` : `${Math.floor(d / 30)}mo`
}
const ageDays = (iso: string) => (Date.now() - Date.parse(iso)) / 86400000

export type Scope = { areaId?: string; projectId?: string }

export default function Board({ data, today, scope = {}, embedded }: { data: BoardData; today: string; scope?: Scope; embedded?: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const [cols, setCols] = useState(data.columns)
  const [tasks, setTasks] = useState<BoardTask[]>(data.tasks)
  const [deps, setDeps] = useState(data.deps)
  const [views, setViews] = useState<BoardView[]>(data.views)
  const [archived, setArchived] = useState(data.archived)
  useEffect(() => { setCols(data.columns); setTasks(data.tasks); setDeps(data.deps); setViews(data.views); setArchived(data.archived) }, [data])

  const [filters, setFilters] = useState<BoardFilters>(() => ({
    areas: params.get("area") ? [params.get("area")!] : undefined, projects: params.get("project") ? [params.get("project")!] : undefined,
    tags: params.get("tag") ? [params.get("tag")!] : undefined, due: (params.get("due") as BoardFilters["due"]) || "",
  }))
  const [q, setQ] = useState("")
  const [lanes, setLanes] = useState(false)
  const [openId, setOpenId] = useState<string | null>(params.get("open"))
  const [panel, setPanel] = useState<null | "filter" | "help">(null)
  const [adding, setAdding] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const [colEdit, setColEdit] = useState<string | "new" | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { try { setLanes(localStorage.getItem("os-board-lanes") === "1") } catch {} }, [])
  const toggleLanes = useCallback(() => setLanes(v => { try { localStorage.setItem("os-board-lanes", v ? "0" : "1") } catch {}; return !v }), [])

  // Keep ?open= in the URL so a card can be linked to.
  useEffect(() => {
    const u = new URL(window.location.href)
    if (openId) u.searchParams.set("open", openId); else u.searchParams.delete("open")
    window.history.replaceState(null, "", u.toString())
  }, [openId])

  const colOf = useCallback((t: BoardTask) =>
    cols.find(c => c.id === t.column_id && c.kind === t.status) ?? cols.find(c => c.kind === t.status) ?? cols[0], [cols])

  const blockers = useMemo(() => {
    const open = new Set(tasks.filter(t => t.status !== "done").map(t => t.id))
    const waiting = new Map<string, number>(), unblocks = new Map<string, number>()
    for (const d of deps) if (open.has(d.blocked_by)) {
      waiting.set(d.task_id, (waiting.get(d.task_id) ?? 0) + 1)
      unblocks.set(d.blocked_by, (unblocks.get(d.blocked_by) ?? 0) + 1)
    }
    return { waiting, unblocks }
  }, [tasks, deps])

  const allTags = useMemo(() => [...new Set(tasks.flatMap(t => t.tags ?? []))].sort(), [tasks])
  const scoped = useMemo(() => tasks.filter(t =>
    (!scope.projectId || t.project_id === scope.projectId) && (!scope.areaId || scope.projectId || t.area_id === scope.areaId)), [tasks, scope.projectId, scope.areaId])
  const visible = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return scoped.filter(t => {
      if (filters.areas?.length && !filters.areas.includes(t.area_id ?? NO_AREA)) return false
      if (filters.projects?.length && !filters.projects.includes(t.project_id ?? NO_AREA)) return false
      if (filters.tags?.length && !filters.tags.some(x => t.tags?.includes(x))) return false
      if (filters.priorities?.length && !filters.priorities.includes(t.priority ?? "normal")) return false
      const d = t.due_date
      if (filters.due === "overdue" && !(d && d < today && t.status !== "done")) return false
      if (filters.due === "week" && !(d && d <= relWeek(today))) return false
      if (filters.due === "none" && d) return false
      if (ql && !(`${t.title} ${t.notes} ${(t.tags ?? []).join(" ")}`.toLowerCase().includes(ql))) return false
      return true
    })
  }, [scoped, filters, q, today])
  const nFilters = (filters.areas?.length ?? 0) + (filters.projects?.length ?? 0) + (filters.tags?.length ?? 0) + (filters.priorities?.length ?? 0) + (filters.due ? 1 : 0)

  const laneList = useMemo(() => {
    if (!lanes) return [{ id: "all", name: "", color: "" }]
    const used = new Set(visible.map(t => t.area_id ?? NO_AREA))
    const l = data.areas.filter(a => used.has(a.id)).map(a => ({ id: a.id, name: a.name, color: a.color }))
    if (used.has(NO_AREA)) l.push({ id: NO_AREA, name: "No area", color: "#b4b8c7" })
    return l.length ? l : [{ id: "all", name: "", color: "" }]
  }, [lanes, visible, data.areas])

  const cell = useCallback((lane: string, col: string) => visible
    .filter(t => colOf(t).id === col && (lane === "all" || (t.area_id ?? NO_AREA) === lane))
    .sort((a, b) => a.sort - b.sort), [visible, colOf])

  // ---------- mutations ----------
  const fail = (e: string) => toast({ text: e, tone: "err" })
  const patchLocal = (t: BoardTask) => setTasks(ts => ts.map(x => x.id === t.id ? t : x))

  async function moveTo(id: string, colId: string, sort: number, lane?: string) {
    const t = tasks.find(x => x.id === id); const c = cols.find(x => x.id === colId)
    if (!t || !c) return
    const wasDone = t.status === "done"
    setTasks(ts => ts.map(x => x.id === id ? { ...x, column_id: colId, status: c.kind, sort, status_changed_at: colOf(x).id === colId ? x.status_changed_at : new Date().toISOString(),
      area_id: lane && lane !== "all" ? (lane === NO_AREA ? null : lane) : x.area_id } : x))
    const r = await bMove(id, colId, sort)
    if (!r.ok) { fail(r.error); router.refresh(); return }
    if (r.data.task) patchLocal(r.data.task)
    if (r.data.spawned) { setTasks(ts => [...ts, r.data.spawned!]); toast(`Repeats: next one added for ${r.data.spawned.due_date ?? "later"}`) }
    if (lane && lane !== "all" && (t.area_id ?? NO_AREA) !== lane) {
      const u = await bUpdate(id, { area_id: lane === NO_AREA ? null : lane })
      if (u.ok) patchLocal(u.data); else fail(u.error)
    }
    if (c.kind === "done" && !wasDone) suggestNext(t)
  }

  function suggestNext(t: BoardTask) {
    const next = tasks.filter(x => x.id !== t.id && x.status !== "done" && !blockers.waiting.get(x.id) &&
      ((t.project_id && x.project_id === t.project_id) || (!t.project_id && t.area_id && x.area_id === t.area_id)))
      .sort((a, b) => (a.status === "doing" ? -1 : 0) - (b.status === "doing" ? -1 : 0) || (a.due_date ?? "9").localeCompare(b.due_date ?? "9") || a.sort - b.sort)[0]
    const freed = deps.filter(d => d.blocked_by === t.id).map(d => tasks.find(x => x.id === d.task_id)).filter(Boolean) as BoardTask[]
    if (freed.length) toast({ text: `Unblocked: ${freed[0].title}${freed.length > 1 ? ` and ${freed.length - 1} more` : ""}`, cta: "Open", onClick: () => setOpenId(freed[0].id) })
    else if (next) toast({ text: `Done. Next up: ${next.title}`, cta: "Open", onClick: () => setOpenId(next.id) })
    else toast("Done.")
  }

  function shift(id: string, dir: -1 | 1) {
    const t = tasks.find(x => x.id === id); if (!t) return
    const i = cols.findIndex(c => c.id === colOf(t).id), to = cols[i + dir]
    if (!to) return
    const top = cell(lanes ? (t.area_id ?? NO_AREA) : "all", to.id)[0]
    moveTo(id, to.id, top ? top.sort - 1 : Date.now() / 1000)
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-card="${id}"]`)?.focus())
  }

  async function quickAdd(colId: string, v: SmartValue, lane?: string) {
    const area = lane && lane !== "all" && lane !== NO_AREA ? lane : scope.areaId ?? (filters.areas?.length === 1 && filters.areas[0] !== NO_AREA ? filters.areas[0] : null)
    const project = scope.projectId ?? (filters.projects?.length === 1 && filters.projects[0] !== NO_AREA ? filters.projects[0] : null)
    const r = await bCreate(v.title, colId, { area_id: area, project_id: project ?? v.project, tags: filters.tags?.length === 1 ? filters.tags : [], due_date: v.due, repeat: v.repeat, parsed: true })
    if (!r.ok) return fail(r.error)
    setTasks(ts => [...ts, r.data])
  }

  // ---------- drag and drop ----------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const collide: CollisionDetection = args => {
    const isCol = String(args.active.id).startsWith("c:")
    const containers = args.droppableContainers.filter(c => String(c.id).startsWith("c:") === isCol)
    return isCol ? closestCenter({ ...args, droppableContainers: containers }) : closestCorners({ ...args, droppableContainers: containers })
  }
  const [drag, setDrag] = useState<{ id: string; lane: string; col: string } | null>(null)
  const where = (overId: string) => {
    if (overId.startsWith("cell:")) { const [, lane, col] = overId.split(":"); return { lane, col } }
    const t = tasks.find(x => x.id === overId); if (!t) return null
    return { lane: lanes ? (t.area_id ?? NO_AREA) : "all", col: colOf(t).id }
  }
  function onStart(e: DragStartEvent) {
    const id = String(e.active.id); setActive(id)
    const t = tasks.find(x => x.id === id)
    if (t) setDrag({ id, lane: lanes ? (t.area_id ?? NO_AREA) : "all", col: colOf(t).id })
  }
  // Moving the preview card changes the layout, which can flip `over` back and forth.
  // Ignore the card itself and apply at most one move per frame so it can't loop.
  const overFrame = useRef(0)
  function onOver(e: DragOverEvent) {
    if (!drag || !e.over || e.over.id === e.active.id) return
    const w = where(String(e.over.id)); if (!w) return
    if (w.col === drag.col && w.lane === drag.lane) return
    cancelAnimationFrame(overFrame.current)
    overFrame.current = requestAnimationFrame(() => setDrag(d => d && (d.col !== w.col || d.lane !== w.lane) ? { ...d, ...w } : d))
  }
  function onEnd(e: DragEndEvent) {
    const id = String(e.active.id); setActive(null)
    if (id.startsWith("c:")) {
      const over = e.over ? String(e.over.id) : null
      if (over && over !== id) {
        const from = cols.findIndex(c => "c:" + c.id === id), to = cols.findIndex(c => "c:" + c.id === over)
        const next = arrayMove(cols, from, to); setCols(next)
        bColumnOrder(next.map(c => c.id)).then(r => { if (!r.ok) fail(r.error) })
      }
      return
    }
    const d = drag; setDrag(null)
    if (!d || !e.over) return
    const w = where(String(e.over.id)) ?? d
    const list = cell(w.lane, w.col).filter(t => t.id !== id)
    const overIdx = list.findIndex(t => t.id === String(e.over!.id))
    const idx = overIdx < 0 ? list.length : overIdx
    const before = list[idx - 1]?.sort, after = list[idx]?.sort
    const sort = before === undefined && after === undefined ? Date.now() / 1000 : before === undefined ? after! - 1 : after === undefined ? before + 1 : (before + after) / 2
    const t = tasks.find(x => x.id === id)!
    if (colOf(t).id === w.col && t.sort === sort && (w.lane === "all" || (t.area_id ?? NO_AREA) === w.lane)) return
    moveTo(id, w.col, sort, lanes ? w.lane : undefined)
  }
  // While dragging, show the card in the column it hovers.
  const cellView = (lane: string, col: string) => {
    let list = cell(lane, col)
    if (drag) {
      const t = tasks.find(x => x.id === drag.id)
      list = list.filter(x => x.id !== drag.id)
      if (t && drag.col === col && drag.lane === lane) {
        const orig = cell(lane, col).findIndex(x => x.id === drag.id)
        list.splice(orig < 0 ? list.length : orig, 0, t)
      }
    }
    return list
  }

  // ---------- keyboard ----------
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest("input, textarea, select, [contenteditable=true]") || e.metaKey || e.ctrlKey || e.altKey) return
      if (openId || document.querySelector(".modal-bg")) return
      const card = el.closest<HTMLElement>("[data-card]")?.dataset.card
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus() }
      else if (e.key === "n") { e.preventDefault(); setAdding(cols.find(c => c.kind === "todo")?.id ?? cols[0]?.id ?? null) }
      else if (e.key === "g") { e.preventDefault(); toggleLanes() }
      else if (e.key === "f") { e.preventDefault(); setPanel(p => p === "filter" ? null : "filter") }
      else if (e.key === "?") { e.preventDefault(); setPanel(p => p === "help" ? null : "help") }
      else if (e.key === "Escape") { setPanel(null); setAdding(null) }
      else if (card && (e.key === "e" || e.key === "Enter")) { e.preventDefault(); setOpenId(card) }
      else if (card && (e.key === "[" || e.key === "]")) { e.preventDefault(); shift(card, e.key === "[" ? -1 : 1) }
      else if (card && (e.key === "j" || e.key === "k" || e.key === "ArrowDown" || e.key === "ArrowUp") && !active) {
        const all = [...document.querySelectorAll<HTMLElement>("[data-card]")]
        const i = all.findIndex(x => x.dataset.card === card)
        const nx = all[i + (e.key === "j" || e.key === "ArrowDown" ? 1 : -1)]
        if (nx) { e.preventDefault(); nx.focus() }
      }
    }
    window.addEventListener("keydown", on)
    return () => window.removeEventListener("keydown", on)
  })

  const open = openId ? tasks.find(t => t.id === openId) ?? null : null
  const doneCount = scoped.filter(t => t.status === "done").length
  const overdue = scoped.filter(t => t.status !== "done" && t.due_date && t.due_date < today).length
  const stale = scoped.filter(t => t.status === "doing" && ageDays(t.status_changed_at) > 7).length

  async function archiveDone() {
    if (!doneCount || !window.confirm(`Archive ${doneCount} done ${doneCount === 1 ? "card" : "cards"}? You can bring them back later.`)) return
    const r = await bArchiveDone()
    if (!r.ok) return fail(r.error)
    setTasks(ts => ts.filter(t => !r.data.includes(t.id))); setArchived(a => a + r.data.length)
    toast({ text: `Archived ${r.data.length}`, cta: "Undo", onClick: restore })
  }
  async function restore() {
    const r = await bUnarchiveAll()
    if (!r.ok) return fail(r.error)
    setTasks(ts => [...ts.filter(t => !r.data.some(x => x.id === t.id)), ...r.data]); setArchived(0)
  }

  return (
    <div className={`bd${embedded ? " embedded" : ""}`}>
      <div className="bd-bar">
        <label className="bd-search"><Icon name="search" size={14} />
          <input ref={searchRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search cards" aria-label="Search cards"
            onKeyDown={e => { if (e.key === "Escape") { setQ(""); e.currentTarget.blur() } }} />
          {!q && <kbd>/</kbd>}
        </label>
        <div className="bd-pop-wrap">
          <button className={`btn sm${nFilters ? " on" : ""}`} onClick={() => setPanel(p => p === "filter" ? null : "filter")} aria-expanded={panel === "filter"}>
            <Icon name="list" size={14} />Filter{nFilters ? <b className="bd-n">{nFilters}</b> : null}
          </button>
          {panel === "filter" && <FilterPanel data={data} tags={allTags} filters={filters} scope={scope} onChange={setFilters} onClose={() => setPanel(null)}
            onSave={async name => { const r = await bViewSave(name, filters); if (!r.ok) return fail(r.error); setViews(v => [...v, r.data]); toast(`Saved “${r.data.name}”`) }} />}
        </div>
        {!scope.projectId && <button className={`btn sm${lanes ? " on" : ""}`} onClick={toggleLanes} title="Group by area (g)"><Icon name="areas" size={14} />Group by area</button>}
        <span className="bd-grow" />
        {!embedded && <button className="btn sm ghost" onClick={archiveDone} disabled={!doneCount} title="Archive done cards">Archive done</button>}
        {!embedded && archived > 0 && <button className="btn sm ghost" onClick={restore} title="Bring archived cards back">Restore {archived}</button>}
        <button className="btn sm ghost bd-help" onClick={() => setPanel(p => p === "help" ? null : "help")} aria-label="Keyboard shortcuts">?</button>
      </div>

      {(views.length > 0 || nFilters > 0) && (
        <div className="bd-views">
          {nFilters > 0 && <button className="chip on" onClick={() => setFilters({ due: "" })}>Clear filters<Icon name="x" size={12} /></button>}
          {views.map(v => (
            <span key={v.id} className={`chip${JSON.stringify(v.filters) === JSON.stringify(clean(filters)) ? " on" : ""}`}>
              <button onClick={() => setFilters({ due: "", ...v.filters })}>{v.name}</button>
              <button aria-label={`Delete view ${v.name}`} onClick={async () => { if (!window.confirm(`Delete the view “${v.name}”?`)) return; const r = await bViewDelete(v.id); if (r.ok) setViews(vs => vs.filter(x => x.id !== v.id)); else fail(r.error) }}><Icon name="x" size={11} /></button>
            </span>
          ))}
        </div>
      )}

      <div className="bd-stats">
                {overdue > 0 && <button className="warn" onClick={() => setFilters(f => ({ ...f, due: "overdue" }))}><b>{overdue}</b> overdue</button>}
        {stale > 0 && <span className="warn"><b>{stale}</b> in progress for over a week</span>}
        {nFilters > 0 || q ? <span>Showing {visible.length}</span> : null}
      </div>

      {panel === "help" && <Help onClose={() => setPanel(null)} />}

      <DndContext sensors={sensors} collisionDetection={collide} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd} onDragCancel={() => { setActive(null); setDrag(null) }}>
        {!lanes && <ColJump scroller={scroller} sel=".bd-col" cols={cols.map(c => ({ id: c.id, label: c.name, count: cellView(laneList[0]?.id ?? "all", c.id).length }))} />}
        <div className="bd-scroll hfade" ref={scroller}>
          {laneList.map(lane => (
            <section key={lane.id} className="bd-lane">
              {lanes && lane.id !== "all" && <h3 className="bd-laneh"><span className="dot" style={{ "--c": lane.color } as CSSProperties} />{lane.name}<span>{visible.filter(t => (t.area_id ?? NO_AREA) === lane.id && t.status !== "done").length}</span></h3>}
              <div className="bd-cols">
                <SortableContext items={cols.map(c => "c:" + c.id)} strategy={horizontalListSortingStrategy} disabled={lanes}>
                  {cols.map(c => {
                    const list = cellView(lane.id, c.id)
                    const total = tasks.filter(t => colOf(t).id === c.id && t.status !== "done" || (c.kind === "done" && colOf(t).id === c.id)).length
                    return (
                      <Column key={c.id} col={c} lane={lane.id} showHead={!lanes || lane === laneList[0]} count={list.length} total={total}
                        onEdit={() => setColEdit(c.id)} dragDisabled={lanes}
                        footer={adding === `${lane.id}:${c.id}` || (adding === c.id && lane === laneList[0])
                          ? <QuickAdd onAdd={v => quickAdd(c.id, v, lanes ? lane.id : undefined)} onClose={() => setAdding(null)} />
                          : <button className="bd-add" onClick={() => setAdding(`${lane.id}:${c.id}`)}><Icon name="plus" size={14} />Add card</button>}>
                        <SortableContext items={list.map(t => t.id)} strategy={verticalListSortingStrategy}>
                          {list.map(t => <Card key={t.id} t={t} data={data} today={today} waiting={blockers.waiting.get(t.id) ?? 0} unblocks={blockers.unblocks.get(t.id) ?? 0}
                            kind={c.kind} onOpen={() => setOpenId(t.id)} hideArea={lanes || !!scope.areaId} hideProject={!!scope.projectId} />)}
                        </SortableContext>
                        {list.length === 0 && <div className="bd-empty">{c.kind === "done" ? "Finished cards land here" : "Drop cards here"}</div>}
                      </Column>
                    )
                  })}
                </SortableContext>
                {(!lanes || lane === laneList[0]) && !embedded && (
                  <button className="bd-newcol" onClick={() => setColEdit("new")}><Icon name="plus" size={14} />Column</button>
                )}
              </div>
            </section>
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {active && !active.startsWith("c:") && (() => { const t = tasks.find(x => x.id === active); return t ? <div className="bd-card lifted"><Mentions text={t.title} plain /></div> : null })()}
        </DragOverlay>
      </DndContext>

      {colEdit && <ColumnEditor col={colEdit === "new" ? null : cols.find(c => c.id === colEdit)!} canDelete={cols.length > 1}
        index={cols.findIndex(c => c.id === colEdit)} count={cols.length}
        onClose={() => setColEdit(null)}
        onMove={dir => { const i = cols.findIndex(c => c.id === colEdit); const next = arrayMove(cols, i, i + dir); setCols(next); bColumnOrder(next.map(c => c.id)) }}
        onSave={async v => {
          const r = await bColumnSave({ ...v, id: colEdit === "new" ? undefined : colEdit })
          if (!r.ok) return fail(r.error)
          setCols(cs => colEdit === "new" ? [...cs, r.data] : cs.map(c => c.id === r.data.id ? r.data : c))
          if (colEdit !== "new") setTasks(ts => ts.map(t => t.column_id === r.data.id ? { ...t, status: r.data.kind } : t))
          setColEdit(null)
        }}
        onDelete={async () => {
          const c = cols.find(x => x.id === colEdit)!
          const n = tasks.filter(t => colOf(t).id === c.id).length
          if (!window.confirm(n ? `Delete “${c.name}”? Its ${n} ${n === 1 ? "card moves" : "cards move"} to the next column of the same type.` : `Delete “${c.name}”?`)) return
          const r = await bColumnDelete(c.id)
          if (!r.ok) return fail(r.error)
          setColEdit(null); router.refresh()
        }} />}

      {open && <PanelBoundary key={open.id} onClose={() => setOpenId(null)}><Drawer fromBoard key={open.id} task={open} data={data} cols={cols} tasks={tasks} deps={deps} today={today}
        onClose={() => setOpenId(null)} onOpen={setOpenId}
        onChange={patchLocal} onDeps={setDeps}
        onMove={colId => { const top = cell("all", colId)[0]; return moveTo(open.id, colId, top ? top.sort - 1 : Date.now() / 1000) }}
        onDeleted={() => { setTasks(ts => ts.filter(t => t.id !== open.id)); setOpenId(null) }} /></PanelBoundary>}
    </div>
  )
}

function relWeek(today: string) {
  const d = new Date(today + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10)
}
function clean(f: BoardFilters): BoardFilters {
  const o: BoardFilters = {}
  for (const k of ["areas", "projects", "tags", "priorities"] as const) if (f[k]?.length) o[k] = f[k]
  if (f.due) o.due = f.due
  return o
}

function Column({ col, lane, showHead, count, total, children, footer, onEdit, dragDisabled }: {
  col: BoardColumn; lane: string; showHead: boolean; count: number; total: number; children: ReactNode; footer: ReactNode; onEdit: () => void; dragDisabled: boolean
}) {
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `cell:${lane}:${col.id}` })
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: "c:" + col.id, disabled: dragDisabled })
  const over = col.wip != null && col.kind !== "done" && total > col.wip
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={`bd-col k-${col.kind}${isOver ? " over" : ""}${isDragging ? " dragging" : ""}`}>
      {showHead && (
        <header className="bd-colh">
          <span className="bd-grip" {...attributes} {...listeners} aria-label={`Move column ${col.name}`} title={dragDisabled ? undefined : "Drag to reorder"}>
            <i className={`bd-kind k-${col.kind}`} />{col.name}
          </span>
          <span className={`bd-count${over ? " over" : ""}`} title={col.wip ? `Limit ${col.wip}` : undefined}>{col.wip ? `${total}/${col.wip}` : count}</span>
          <button className="bd-icon" onClick={onEdit} aria-label={`Edit column ${col.name}`}><Icon name="more" size={14} /></button>
        </header>
      )}
      <div ref={dropRef} className="bd-list">{children}</div>
      {footer}
    </div>
  )
}

function Card({ t, data, today, waiting, unblocks, kind, onOpen, hideArea, hideProject }: {
  t: BoardTask; data: BoardData; today: string; waiting: number; unblocks: number; kind: TaskStatus; onOpen: () => void; hideArea?: boolean; hideProject?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id })
  const area = !hideArea ? data.areas.find(a => a.id === t.area_id) : undefined
  const project = !hideProject ? data.projects.find(p => p.id === t.project_id) : undefined
  const due = t.due_date ? relDue(t.due_date, today) : null
  const cl = t.checklist ?? []
  const days = ageDays(t.status_changed_at)
  const stale = kind === "doing" && days > 7
  const pri = t.priority && t.priority !== "normal" ? PRI[t.priority] : null
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} data-card={t.id}
      className={`bd-card${isDragging ? " ghost" : ""}${stale ? " stale" : ""}${kind === "done" ? " done" : ""}${waiting ? " blocked" : ""}`}
      {...attributes} {...listeners} role="button" tabIndex={0} aria-label={`${t.title}. Enter to open`}
      onClick={onOpen} onKeyDown={e => { if (e.key === "Enter" && !isDragging) { e.preventDefault(); onOpen() } else listeners?.onKeyDown?.(e) }}>
      <div className="bd-t">
        {pri && <i className="bd-pri" style={{ background: pri.c }} title={pri.label} />}
        <span><Mentions text={t.title} plain /></span>
        {t.repeat && <span className="bd-rep" title={`Repeats ${t.repeat}`}>↻</span>}
      </div>
      {(area || project || (t.tags?.length ?? 0) > 0) && (
        <div className="bd-tags">
          {area && <span className="pill" style={{ "--c": area.color } as CSSProperties}>{area.name}</span>}
          {project && <span className="pill gray">{project.name}</span>}
          {t.tags?.slice(0, 3).map(x => <span key={x} className="bd-tag">#{x}</span>)}
        </div>
      )}
      <div className="bd-meta">
        {due && <span className={due.warn && kind !== "done" ? "warn" : ""}><Icon name="calendar" size={12} />{due.label}</span>}
        {cl.length > 0 && <span className={cl.every(c => c.done) ? "ok" : ""}><Icon name="check" size={12} />{cl.filter(c => c.done).length}/{cl.length}</span>}
        {waiting > 0 && <span className="warn" title="Blocked by open cards">Waiting on {waiting}</span>}
        {unblocks > 0 && kind !== "done" && <span title="Other cards wait on this">Unblocks {unblocks}</span>}
        <span className="bd-age" title="Time in this column"><Icon name="clock" size={12} />{age(t.status_changed_at)}</span>
      </div>
    </div>
  )
}

function QuickAdd({ onAdd, onClose }: { onAdd: (v: SmartValue) => Promise<void> | void; onClose: () => void }) {
  const si = useRef<SmartHandle>(null)
  const go = async () => { const v = si.current?.value(); if (!v?.title) return; si.current?.clear(); await onAdd(v) }
  return (
    <form className="bd-quick" onSubmit={e => { e.preventDefault(); go() }}>
      <SmartInput ref={si} autoFocus placeholder="Card title. Try “fri”, @person, #project" aria-label="New card title"
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); go() } if (e.key === "Escape") onClose() }}
        onBlur={e => { if (!e.currentTarget.value.trim() && !e.currentTarget.closest("form")?.contains(e.relatedTarget as Node)) onClose() }} />
      <div className="inline"><button className="btn pri sm">Add</button><button type="button" className="btn ghost sm" onClick={onClose}>Cancel</button></div>
    </form>
  )
}

function FilterPanel({ data, tags, filters, scope, onChange, onClose, onSave }: {
  data: BoardData; tags: string[]; filters: BoardFilters; scope: Scope; onChange: (f: BoardFilters) => void; onClose: () => void; onSave: (name: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const out = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest(".bd-pop-wrap")) onClose() }
    document.addEventListener("mousedown", out); return () => document.removeEventListener("mousedown", out)
  }, [onClose])
  const tog = (k: "areas" | "projects" | "tags" | "priorities", v: string) => {
    const cur = filters[k] ?? []
    onChange({ ...filters, [k]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] })
  }
  const Chip = ({ k, v, label, color }: { k: "areas" | "projects" | "tags" | "priorities"; v: string; label: string; color?: string }) => (
    <button className={`chip${filters[k]?.includes(v) ? " on" : ""}`} onClick={() => tog(k, v)}>{color && <span className="dot" style={{ "--c": color } as CSSProperties} />}{label}</button>
  )
  const [name, setName] = useState("")
  return (
    <div className="bd-pop" ref={ref} role="dialog" aria-label="Filters">
      {!scope.areaId && <><h4>Area</h4><div className="chips">{data.areas.map(a => <Chip key={a.id} k="areas" v={a.id} label={a.name} color={a.color} />)}<Chip k="areas" v={NO_AREA} label="No area" /></div></>}
      {!scope.projectId && data.projects.length > 0 && <><h4>Project</h4><div className="chips">{data.projects.filter(p => p.status !== "done" && (!scope.areaId || p.area_id === scope.areaId)).map(p => <Chip key={p.id} k="projects" v={p.id} label={p.name} />)}</div></>}
      {tags.length > 0 && <><h4>Tag</h4><div className="chips">{tags.map(t => <Chip key={t} k="tags" v={t} label={"#" + t} />)}</div></>}
      <h4>Priority</h4><div className="chips">{Object.entries(PRI).map(([k, p]) => <Chip key={k} k="priorities" v={k} label={p.label} color={p.c} />)}</div>
      <h4>Due</h4>
      <div className="seg">{([["", "Any"], ["overdue", "Overdue"], ["week", "This week"], ["none", "No date"]] as const).map(([v, l]) =>
        <button key={v} className={(filters.due ?? "") === v ? "on" : ""} onClick={() => onChange({ ...filters, due: v })}>{l}</button>)}</div>
      <form className="bd-save" onSubmit={e => { e.preventDefault(); if (name.trim()) { onSave(name); setName("") } }}>
        <input className="in" value={name} onChange={e => setName(e.target.value)} placeholder="Save these filters as…" aria-label="View name" />
        <button className="btn sm" disabled={!name.trim()}>Save view</button>
      </form>
    </div>
  )
}

function ColumnEditor({ col, canDelete, index, count, onClose, onSave, onDelete, onMove }: {
  col: BoardColumn | null; canDelete: boolean; index: number; count: number; onClose: () => void
  onSave: (v: { name: string; kind: TaskStatus; wip: number | null }) => void; onDelete: () => void; onMove: (d: -1 | 1) => void
}) {
  const [name, setName] = useState(col?.name ?? "")
  const [kind, setKind] = useState<TaskStatus>(col?.kind ?? "doing")
  const [wip, setWip] = useState(col?.wip ? String(col.wip) : "")
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k) }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <form className="modal sheet" onSubmit={e => { e.preventDefault(); onSave({ name, kind, wip: wip ? Number(wip) : null }) }}>
        <div className="sheet-h"><h2>{col ? "Edit column" : "New column"}</h2><button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" size={14} /></button></div>
        <div className="form cb">
          <label className="lbl">Name<input className="in" autoFocus value={name} onChange={e => setName(e.target.value)} required maxLength={40} /></label>
          <div className="lbl">Counts as
            <div className="seg">{(["todo", "doing", "done"] as const).map(k => <button type="button" key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{KIND_LABEL[k]}</button>)}</div>
          </div>
          <label className="lbl">Card limit<input className="in" type="number" min={0} max={99} inputMode="numeric" value={wip} onChange={e => setWip(e.target.value)} placeholder="No limit" /></label>
          <div className="inline">
            <button className="btn pri sm">Save</button>
            {col && <><button type="button" className="btn sm" disabled={index <= 0} onClick={() => onMove(-1)}>Move left</button>
              <button type="button" className="btn sm" disabled={index >= count - 1} onClick={() => onMove(1)}>Move right</button></>}
            {col && canDelete && <button type="button" className="btn sm danger" onClick={onDelete}><Icon name="trash" size={14} />Delete</button>}
          </div>
        </div>
      </form>
    </div>
  )
}

function Help({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [["n", "New card"], ["/", "Search"], ["f", "Filters"], ["g", "Group by area"], ["j / k", "Next / previous card"], ["Enter", "Open card"], ["[ / ]", "Move card left / right"], ["Space", "Pick up, arrows to move, Space to drop"], ["Esc", "Close"]]
  return (
    <div className="bd-help-panel" role="dialog" aria-label="Keyboard shortcuts">
      <div className="ch"><h2>Shortcuts</h2><button className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" size={14} /></button></div>
      <ul className="cb">{rows.map(([k, v]) => <li key={k}><kbd>{k}</kbd><span>{v}</span></li>)}</ul>
    </div>
  )
}
