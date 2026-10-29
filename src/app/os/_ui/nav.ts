import type { IconName } from "./icons"
export type N = { href: string; label: string; icon: IconName; also?: string[] }
export const NAV_GROUPS: [string, N[], boolean?][] = [
  ["", [
    { href: "/os", label: "Today", icon: "today" },
    { href: "/os/tasks", label: "Tasks", icon: "tasks", also: ["/os/board"] },
  ]],
  ["Write", [
    { href: "/os/journal", label: "Journal", icon: "journal" },
    { href: "/os/notes", label: "Notes", icon: "notes" },
    { href: "/os/drafts", label: "Drafts", icon: "drafts" },
    { href: "/os/site", label: "Site", icon: "globe" },
  ]],
  ["Projects", [
    { href: "/os/areas", label: "Areas & projects", icon: "areas", also: ["/os/projects"] },
  ]],
  ["Other", [
    { href: "/os/people", label: "People", icon: "people" },
    { href: "/os/review", label: "Weekly review", icon: "calendar" },
    { href: "/os/settings", label: "Settings", icon: "info" },
  ], true],
]
export const TABS: N[] = [
  { href: "/os", label: "Today", icon: "today" },
  { href: "/os/tasks", label: "Tasks", icon: "tasks", also: ["/os/board"] },
  { href: "/os/journal", label: "Write", icon: "pen", also: ["/os/notes", "/os/drafts", "/os/site"] },
  { href: "/os/areas", label: "Projects", icon: "areas", also: ["/os/projects"] },
  { href: "/os/more", label: "More", icon: "more", also: ["/os/people", "/os/review", "/os/settings", "/os/inbox"] },
]

