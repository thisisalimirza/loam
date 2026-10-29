"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { Icon } from "./icons"
import { NAV_GROUPS, TABS, type N } from "./nav"
import Capture from "./Capture"
import Shortcuts from "./Shortcuts"
import TaskPanel from "./TaskPanel"
import { Suspense } from "react"
import { todayISO } from "@/lib/os/dates"
import { ToastHost } from "./Toast"
import { MentionProvider, type MIndex } from "./Mentions"

export function isOn(path: string, href: string) {
  return href === "/os" ? path === "/os" : path === href || path.startsWith(href + "/")
}

const on = (path: string, n: N) => isOn(path, n.href) || !!n.also?.some(h => isOn(path, h))

export default function Shell({ mentions, children }: { mentions: MIndex; children: ReactNode }) {
  const path = usePathname()
  return (
    <MentionProvider value={mentions}>
    <div className="app">
      <aside className="side">
        <div className="brand"><span className="logo">L</span><div><strong>Loam OS</strong><small>Private</small></div></div>
        <Capture.Trigger />
        {NAV_GROUPS.map(([g, items, quiet], gi) => (
          <div key={gi} className={quiet ? "ngrp quiet" : "ngrp"}>
            {g && !quiet && <div className="sect">{g}</div>}
            {items.map(n => (
              <Link key={n.href} href={n.href} className={`nav${on(path, n) ? " on" : ""}`}>
                <Icon name={n.icon} /><span>{n.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </aside>
      <div className="m">{children}</div>
      <Capture />
      <Shortcuts />
      <Suspense fallback={null}><TaskPanel today={todayISO()} /></Suspense>
      <ToastHost />
      <nav className="tabs">
        {TABS.map(t => (
          <Link key={t.href} href={t.href} className={on(path, t) ? "on" : ""}>
            <Icon name={t.icon} /><span>{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
    </MentionProvider>
  )
}
