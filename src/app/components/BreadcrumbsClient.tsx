"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NavLink } from "@/types";

export default function BreadcrumbsClient({ navLinks }: { navLinks: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Site navigation" className="site-nav">
      <Link href="/" className="site-nav-profile">
        <Image
          src="/profilepic.jpg"
          alt="Ali Mirza"
          width={40}
          height={40}
          className="site-nav-avatar"
        />
        <div className="site-nav-profile-text">
          <span className="site-nav-profile-name">Ali Mirza</span>
          <span className="site-nav-profile-tagline">Medical student. Builder. Writer.</span>
        </div>
      </Link>

      <div className="site-nav-links">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (!link.external && link.href !== "/" && pathname.startsWith(link.href));

          if (link.external) {
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="site-nav-link"
              >
                {link.name}
              </a>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`site-nav-link${isActive ? " site-nav-active" : ""}`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
