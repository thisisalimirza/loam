import type { IconName } from "./icons"
export type N = { href: string; label: string; icon: IconName; also?: string[] }
export const NAV_GROUPS: [string, N[], boolean?][] = [
  ["", [
    { href: "/os", label: "Today", icon: "today" },
    { href: "/os/tasks", label: "Tasks", icon: "tasks", also: ["/os/board"] },
    { href: "/os/areas", label: "Projects", icon: "areas", also: ["/os/projects"] },
  ]],
  ["Write", [
    { href: "/os/journal", label: "Journal", icon: "journal" },
    { href: "/os/notes", label: "Notes", icon: "notes" },
    { href: "/os/drafts", label: "Drafts", icon: "drafts", also: ["/os/schedule"] },
    { href: "/os/site", label: "Site", icon: "globe" },
  ]],
  ["", [
    { href: "/os/learn", label: "Learn", icon: "learn" },
    { href: "/os/people", label: "People", icon: "people" },
    { href: "/os/review", label: "Weekly review", icon: "review" },
  ]],
  ["", [
    { href: "/os/settings", label: "Settings", icon: "gear" },
  ], true],
]
export const WRITE: N[] = NAV_GROUPS[1][1]
export const MORE: N[] = [...NAV_GROUPS[2][1], ...NAV_GROUPS[3][1]]
export const TABS: N[] = [
  { href: "/os", label: "Today", icon: "today" },
  { href: "/os/tasks", label: "Tasks", icon: "tasks", also: ["/os/board"] },
  { href: "/os/journal", label: "Write", icon: "pen", also: ["/os/notes", "/os/drafts", "/os/site", "/os/schedule"] },
  { href: "/os/areas", label: "Projects", icon: "areas", also: ["/os/projects"] },
  { href: "/os/more", label: "More", icon: "more", also: ["/os/people", "/os/review", "/os/settings", "/os/inbox", "/os/learn"] },
]
