"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink } from "@/types";

export default function BreadcrumbsClient({ navLinks }: { navLinks: NavLink[] }) {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-name">
        <Link href="/" className="site-header-name-link">Ali Mirza</Link>
      </div>
      <hr className="site-header-hr" />
      <nav aria-label="Site navigation" className="site-header-nav">
        {navLinks.map((link) => {
          const isActive = !link.external && (pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href)));

          if (link.external) {
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="site-header-link"
              >
                {link.name}
              </a>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`site-header-link${isActive ? " site-header-link--active" : ""}`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
      <hr className="site-header-hr" />
    </header>
  );
}
