"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

/** On wide screens, detail pages keep the list beside them (list → detail split). Hidden on narrow screens and on the list page itself. */
export default function SplitAside({ base, title, items, children }: { base: string; title: string; items: { id: string; title: string; sub?: string }[]; children: ReactNode }) {
  const path = usePathname()
  const onDetail = path !== base && path.startsWith(base + "/") && !path.endsWith("/write")
  if (!onDetail) return <>{children}</>
  return (
    <div className="splitv">
      <nav className="splitv-l" aria-label={title}>
        <Link href={base} className="splitv-h">{title}</Link>
        <ul>{items.map(i => { const href = `${base}/${i.id}`; return (
          <li key={i.id}><Link href={href} className={path === href ? "on" : ""} aria-current={path === href ? "page" : undefined}>
            <span>{i.title || "Untitled"}</span>{i.sub && <small>{i.sub}</small>}</Link></li>) })}</ul>
      </nav>
      <div className="splitv-d">{children}</div>
    </div>
  )
}
