"use client"
import { useEffect, useState, type RefObject } from "react"
import { Icon } from "./icons"

/** Phone/tablet helper for wide boards: a segmented row of columns with counts.
 *  Tapping one scrolls it into view; the active one follows the swipe.
 *  Also marks the scroller with data-more when columns sit off-screen to the right,
 *  so CSS can show an edge fade. */
export default function ColJump({ scroller, cols, sel, onEdit }: { scroller: RefObject<HTMLElement | null>; cols: { id: string; label: string; count?: number }[]; sel: string; onEdit?: (id: string) => void }) {
  const [on, setOn] = useState(0)
  useEffect(() => {
    const el = scroller.current; if (!el) return
    const tick = () => {
      const items = [...el.querySelectorAll<HTMLElement>(sel)]
      const left = el.getBoundingClientRect().left
      let i = 0; items.forEach((c, n) => { if (c.getBoundingClientRect().left - left < c.offsetWidth / 2) i = n })
      setOn(i)
      el.dataset.more = el.scrollLeft + el.clientWidth < el.scrollWidth - 4 ? "1" : "0"
    }
    tick(); el.addEventListener("scroll", tick, { passive: true }); addEventListener("resize", tick)
    return () => { el.removeEventListener("scroll", tick); removeEventListener("resize", tick) }
  }, [scroller, sel, cols.length])
  const go = (n: number) => scroller.current?.querySelectorAll<HTMLElement>(sel)[n]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
  return (
    <div className="col-jump-row">
      <div className="seg col-jump" role="tablist" aria-label="Columns">
        {cols.map((c, n) => <button key={c.id} type="button" role="tab" aria-selected={on === n} className={on === n ? "on" : ""} onClick={() => go(n)}>{c.label}</button>)}
      </div>
      {onEdit && cols[on] && <button type="button" className="bd-icon cj-more" onClick={() => onEdit(cols[on].id)} aria-label={`Edit column ${cols[on].label}`}><Icon name="more" size={16} /></button>}
    </div>
  )
}
