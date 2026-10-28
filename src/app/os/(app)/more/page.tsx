import Link from "next/link"
import { Icon, type IconName } from "../../_ui/icons"
import { Card, PageHeader } from "../../_ui/ui"
import { logout } from "@/lib/os/actions"

export const metadata = { title: "More" }
const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/os/people", label: "People", icon: "people" },
  { href: "/os/inbox", label: "Inbox", icon: "inbox" },
  { href: "/os/drafts", label: "Drafts", icon: "drafts" },
  { href: "/os/notes", label: "Notes", icon: "notes" },
  { href: "/os/areas", label: "Areas & projects", icon: "areas" },
  { href: "/os/site", label: "Site", icon: "globe" },
  { href: "/os/settings", label: "Settings", icon: "info" },
]
export default function More() {
  return (
    <>
      <PageHeader title="More" />
      <Card>
        <ul style={{ padding: 6 }}>
          {LINKS.map(l => <li key={l.href}><Link href={l.href} className="row"><Icon name={l.icon} /><span className="tt">{l.label}</span><Icon name="arrow" /></Link></li>)}
        </ul>
      </Card>
      <form action={logout} style={{ marginTop: 16 }}><button className="btn"><Icon name="logout" />Sign out</button></form>
    </>
  )
}
