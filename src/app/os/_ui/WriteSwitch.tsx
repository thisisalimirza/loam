"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { WRITE } from "./nav"

/** Phone-only switch between the four Write pages (the sidebar does this on wider screens). */
export default function WriteSwitch() {
  const path = usePathname()
  return (
    <nav className="seg wsw" aria-label="Write">
      {WRITE.map(n => <Link key={n.href} href={n.href} className={path === n.href || n.also?.includes(path) ? "on" : ""}>{n.label}</Link>)}
    </nav>
  )
}
