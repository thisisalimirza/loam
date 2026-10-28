"use client"
import { useState } from "react"
import { createPin } from "@/lib/os/actions"
import DateChip from "./DateChip"
import { Icon } from "./icons"

export default function PinForm({ areas, compact }: { areas: { id: string; name: string }[]; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  if (!open) return (
    <button className="cd add" onClick={() => setOpen(true)} style={compact ? undefined : { gridColumn: "1 / -1" }}>
      <Icon name="pin" />{compact ? "Pin a date" : "Pin a date to count down to: an exam, a launch, a deadline"}
    </button>
  )
  return (
    <form className="cd" style={{ gridColumn: "1 / -1", flexWrap: "wrap", gap: 8 }} action={async f => { await createPin(f); setOpen(false) }}>
      <input className="in" name="label" placeholder="What’s happening" required style={{ flex: "2 1 160px" }} autoFocus />
      <DateChip label="Date" name="pin_date" required quick={[["Next week", 7], ["In a month", 30], ["In 3 months", 91]]} />
      <select className="in" name="area_id" defaultValue="" style={{ flex: "1 1 120px" }}>
        <option value="">No area</option>
        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <button className="btn pri sm">Pin</button>
      <button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  )
}
