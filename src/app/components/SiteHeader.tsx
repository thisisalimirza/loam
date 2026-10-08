import Image from "next/image"
import Link from "next/link"
import { NavLink } from "@/types"
import SiteNav from "./SiteNav"

const navLinks: NavLink[] = [
  { name: "Work", href: "/#work" },
  { name: "About", href: "/#about" },
  { name: "Writing", href: "/writing" },
  { name: "Meditations", href: "/meditations" },
]

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-wordmark" aria-label="Ali Mirza home">
          <Image
            src="/images/am-monogram.png"
            alt=""
            width={32}
            height={32}
            className="wordmark-monogram"
            priority
          />
          <span>ALI MIRZA<span className="wordmark-dot">.</span></span>
        </Link>
        <SiteNav navLinks={navLinks} />
      </div>
    </header>
  )
}
