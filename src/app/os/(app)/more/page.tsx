import Link from "next/link"
import { Icon, type IconName } from "../../_ui/icons"
import { Card, PageHeader } from "../../_ui/ui"

export const metadata = { title: "More" }
const GROUPS: [string, { href: string; label: string; icon: IconName }[]][] = [
  ["Write", [{ href: "/os/drafts", label: "Drafts", icon: "drafts" }, { href: "/os/notes", label: "Notes", icon: "notes" }]],
  ["Build", [{ href: "/os/areas", label: "Areas & projects", icon: "areas" }, { href: "/os/people", label: "People", icon: "people" }, { href: "/os/inbox", label: "Inbox", icon: "inbox" }, { href: "/os/site", label: "Site", icon: "globe" }]],
  ["You", [{ href: "/os/review", label: "Weekly review", icon: "calendar" }, { href: "/os/settings", label: "Settings", icon: "info" }]],
]
export default function More() {
  return (
    <>
      <PageHeader title="More" />
      <div className="stack">{GROUPS.map(([h, links]) => (
        <Card key={h} title={h}>
          <ul style={{ padding: 6 }}>
            {links.map(l => <li key={l.href}><Link href={l.href} className="row"><Icon name={l.icon} /><span className="tt">{l.label}</span><Icon name="arrow" /></Link></li>)}
          </ul>
        </Card>
      ))}</div>
    </>
  )
}
