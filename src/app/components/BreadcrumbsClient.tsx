"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink } from "@/types";

export default function BreadcrumbsClient({ navLinks }: { navLinks: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Site navigation" className="site-nav">
      {navLinks.map((link, i) => {
        const isFirst = i === 0;
        const isActive = !isFirst && (pathname === link.href || (!link.external && link.href !== "/" && pathname.startsWith(link.href)));

        if (link.external) {
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`site-nav-link${isFirst ? " site-nav-home" : ""}`}
            >
              {link.name}
            </a>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`site-nav-link${isFirst ? " site-nav-home" : ""}${isActive ? " site-nav-active" : ""}`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
