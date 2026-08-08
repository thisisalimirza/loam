import Link from "next/link"
import { NavLink } from "@/types"
import SiteNav from "./SiteNav"

/**
 * Six destinations, sticky, on every page. "Book Notes" is the label for
 * /reading — the route stays put so existing links and the 70-odd generated
 * source pages under it keep working.
 */
const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Book Notes", href: "/reading" },
  { name: "Writing", href: "/writing" },
  { name: "Meditations", href: "/meditations" },
  { name: "Projects", href: "/projects" },
  { name: "Future", href: "/future" },
]

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-wordmark">
          Ali Mirza
        </Link>
        <SiteNav navLinks={navLinks} />
      </div>
    </header>
  )
}
