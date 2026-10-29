"use client"
import { useRef } from "react"
import { setMetric } from "@/lib/os/actions"
import { toast } from "./Toast"

/** A metric's number; saves when you leave the field (Enter also leaves it). */
export default function MetricValue({ id, label, value }: { id: string; label: string; value: string }) {
  const last = useRef(value)
  return (
    <input className="in mv-in" defaultValue={value} inputMode="decimal" aria-label={`${label} value`}
      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur() } }}
      onBlur={async e => {
        const v = e.currentTarget.value.trim(); if (v === last.current) return
        last.current = v; const fd = new FormData(); fd.set("value", v)
        try { await setMetric(id, fd); toast("Saved") } catch { toast({ text: "Couldn’t save that number", tone: "err" }) }
      }} />
  )
}
