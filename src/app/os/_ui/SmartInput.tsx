"use client"
import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react"
import { parseTask, type Parsed } from "@/lib/os/parse"
import { findMentions } from "@/lib/os/mentions"
import { fmtDate, relDue, todayISO, REPEAT_LABEL } from "@/lib/os/dates"
import { useMentionIndex } from "./Mentions"
import { Icon } from "./icons"

export type SmartValue = Parsed & { raw: string; people: string[]; project: string | null }
export type SmartHandle = { clear: () => void; focus: () => void; value: () => SmartValue }

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "onSubmit"> & {
  defaultValue?: string
  onSubmit?: (v: SmartValue) => void
  onValue?: (v: SmartValue) => void
  /** Render hidden title / due_date / repeat inputs so plain forms get the parsed values. */
  names?: boolean
  /** Hide the chip row (still highlights inline). */
  noChips?: boolean
  extra?: ReactNode
  dates?: boolean
}

export function dueText(d: string, today = todayISO()) {
  const r = relDue(d, today).label
  return /^Overdue/.test(r) ? fmtDate(d) : r
}

/** A task title input that reads dates, repeats, @people and #projects as you type. */
const SmartInput = forwardRef<SmartHandle, Props>(function SmartInput({ defaultValue = "", onSubmit, onValue, names, noChips, extra, className = "", dates = true, onKeyDown, ...rest }, ref) {
  const [raw, setRaw] = useState(defaultValue)
  const [ignore, setIgnore] = useState<string[]>([])
  const inp = useRef<HTMLInputElement>(null)
  const mirror = useRef<HTMLDivElement>(null)
  const idx = useMentionIndex()
  const today = todayISO()
  const v: SmartValue = useMemo(() => {
    const p = dates ? parseTask(raw, today, ignore) : { title: raw.trim(), due: null, repeat: null, spans: [] }
    const ms = findMentions(raw, idx)
    return { ...p, raw, people: [...new Set(ms.filter(m => m.kind === "person").map(m => m.id))], project: ms.find(m => m.kind === "project")?.id ?? null }
  }, [raw, ignore, idx, today, dates])
  const marks = useMemo(() => {
    const ms = findMentions(raw, idx).map(m => ({ start: m.start, end: m.end, kind: m.kind as string }))
    return [...v.spans.map(s => ({ start: s.start, end: s.end, kind: s.kind as string })), ...ms].sort((a, b) => a.start - b.start)
  }, [raw, v.spans, idx])
  useImperativeHandle(ref, () => ({ clear: () => { setRaw(""); setIgnore([]); onValue?.({ ...parseTask(""), raw: "", people: [], project: null }) }, focus: () => inp.current?.focus(), value: () => v }), [v, onValue])
  const set = (s: string) => { setRaw(s); }
  // Tell the parent after render.
  const last = useRef("")
  const key = JSON.stringify([v.title, v.due, v.repeat, v.people, v.project, raw])
  if (onValue && key !== last.current) { last.current = key; queueMicrotask(() => onValue(v)) }

  const parts: ReactNode[] = []; let at = 0
  for (const m of marks) { if (m.start < at) continue; parts.push(raw.slice(at, m.start)); parts.push(<mark key={m.start} className={`sm-${m.kind}`}>{raw.slice(m.start, m.end)}</mark>); at = m.end }
  parts.push(raw.slice(at) + " ")
  const people = idx.people.filter(p => v.people.includes(p.id)), proj = idx.projects.find(p => p.id === v.project)
  const drop = (t: string) => setIgnore(i => [...i, t.toLowerCase()])
  const dateSpan = v.spans.find(s => s.kind === "date"), repSpan = v.spans.find(s => s.kind === "repeat")
  const chips = !noChips && (v.due || v.repeat || people.length || proj)
  return (
    <div className={`smart ${className}`}>
      <div className="sm-field">
        <div className="sm-mirror" ref={mirror} aria-hidden>{parts}</div>
        <input ref={inp} className="in" value={raw} autoComplete="off" {...rest}
          onChange={e => set(e.target.value)}
          onScroll={e => { if (mirror.current) mirror.current.scrollLeft = e.currentTarget.scrollLeft }}
          onKeyDown={e => { onKeyDown?.(e); if (!e.defaultPrevented && e.key === "Enter" && onSubmit && !names) { e.preventDefault(); if (v.title.trim()) onSubmit(v) } }} />
      </div>
      {names && <><input type="hidden" name="parsed" value="1" /><input type="hidden" name="title" value={v.title} /><input type="hidden" name="due_date" value={v.due ?? ""} /><input type="hidden" name="repeat" value={v.repeat ?? ""} />{v.project && <input type="hidden" name="mention_project" value={v.project} />}</>}
      {(chips || extra) && (
        <div className="sm-chips">
          {v.due && <span className="chip on sm-date"><Icon name="calendar" size={12} />Due {dueText(v.due, today)}{dateSpan && <button type="button" aria-label="Keep the date words in the title" onClick={() => drop(dateSpan.text)}><Icon name="x" size={11} /></button>}</span>}
          {v.repeat && <span className="chip on sm-repeat">↻ {REPEAT_LABEL[v.repeat]}{repSpan && <button type="button" aria-label="Don't repeat" onClick={() => drop(repSpan.text)}><Icon name="x" size={11} /></button>}</span>}
          {people.map(p => <span key={p.id} className="chip sm-person">@{p.name}</span>)}
          {proj && <span className="chip sm-project">#{proj.name}</span>}
          {extra}
        </div>
      )}
    </div>
  )
})
export default SmartInput
