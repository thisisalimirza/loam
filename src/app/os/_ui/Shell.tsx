"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"
import { Icon, type IconName } from "./icons"
import Capture from "./Capture"
import { logout } from "@/lib/os/actions"

type A = { id: string; name: string; color: string }
const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/os", label: "Today", icon: "today" },
  { href: "/os/inbox", label: "Inbox", icon: "inbox" },
  { href: "/os/tasks", label: "Tasks", icon: "tasks" },
  { href: "/os/journal", label: "Journal", icon: "journal" },
  { href: "/os/drafts", label: "Drafts", icon: "drafts" },
  { href: "/os/people", label: "People", icon: "people" },
  { href: "/os/notes", label: "Notes", icon: "notes" },
  { href: "/os/areas", label: "Areas", icon: "areas" },
]
const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/os", label: "Today", icon: "today" },
  { href: "/os/tasks", label: "Tasks", icon: "tasks" },
  { href: "/os/journal", label: "Journal", icon: "journal" },
  { href: "/os/people", label: "People", icon: "people" },
  { href: "/os/more", label: "More", icon: "more" },
]

export function isOn(path: string, href: string) {
  return href === "/os" ? path === "/os" : path === href || path.startsWith(href + "/")
}

export default function Shell({ areas, inbox, children }: { areas: A[]; inbox: number; children: ReactNode }) {
  const path = usePathname()
  const moreOn = ["/os/more", "/os/inbox", "/os/drafts", "/os/notes", "/os/areas", "/os/projects"].some(h => isOn(path, h))
  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><span className="logo">L</span><div><strong>Loam OS</strong><small>Private</small></div></div>
        <Capture.Trigger />
        {NAV.map(n => (
          <Link key={n.href} href={n.href} className={`nav${isOn(path, n.href) ? " on" : ""}`}>
            <Icon name={n.icon} /><span>{n.label}</span>
            {n.href === "/os/inbox" && inbox > 0 && <em>{inbox}</em>}
          </Link>
        ))}
        {areas.length > 0 && <div className="sect">Areas</div>}
        {areas.map(a => (
          <Link key={a.id} href={`/os/areas/${a.id}`} className={`nav${isOn(path, `/os/areas/${a.id}`) ? " on" : ""}`}>
            <span className="dot" style={{ "--c": a.color } as CSSProperties} /><span>{a.name}</span>
          </Link>
        ))}
        <div className="me">
          <span className="av">A</span>
          <div><strong>Ali</strong><small>Signed in</small></div>
          <form action={logout}><button className="btn ghost sm" title="Sign out" aria-label="Sign out"><Icon name="logout" /></button></form>
        </div>
      </aside>
      <main className="m">{children}</main>
      <Capture />
      <nav className="tabs">
        {TABS.map(t => (
          <Link key={t.href} href={t.href} className={(t.href === "/os/more" ? moreOn : isOn(path, t.href)) ? "on" : ""}>
            <Icon name={t.icon} /><span>{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
