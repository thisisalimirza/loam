"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavLink } from "@/types"
import Icon from "./Icon"

export default function SiteNav({ navLinks }: { navLinks: NavLink[] }) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav aria-label="Primary">
      <ul className="site-nav-list">
        {navLinks.map(link => {
          const active = !link.external && isActive(link.href)

          return (
            <li key={link.href}>
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-nav-link"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className={`site-nav-link${active ? " site-nav-link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.name}
                </Link>
              )}
            </li>
          )
        })}
        <li>
          <a href="mailto:ali@braskgroup.com" className="site-nav-link nav-contact">
            Say hello <Icon name="external" className="nav-contact-arrow" />
          </a>
        </li>
      </ul>
    </nav>
  )
}
