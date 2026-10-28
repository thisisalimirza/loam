"use client"
import { useEffect, useState, type RefObject } from "react"

/** Phone/tablet helper for wide boards: a segmented row of columns with counts.
 *  Tapping one scrolls it into view; the active one follows the swipe.
 *  Also marks the scroller with data-more when columns sit off-screen to the right,
 *  so CSS can show an edge fade. */
export default function ColJump({ scroller, cols, sel }: { scroller: RefObject<HTMLElement | null>; cols: { id: string; label: string; count: number }[]; sel: string }) {
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
    <div className="seg col-jump" role="tablist" aria-label="Columns">
      {cols.map((c, n) => <button key={c.id} type="button" role="tab" aria-selected={on === n} className={on === n ? "on" : ""} onClick={() => go(n)}>{c.label}<span>{c.count}</span></button>)}
    </div>
  )
}
