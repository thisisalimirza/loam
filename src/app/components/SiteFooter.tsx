import Link from "next/link"
import { siteConfig } from "@/config/site"

const explore = [
  { name: "Writing", href: "/writing" },
  { name: "Book Notes", href: "/reading" },
  { name: "Meditations", href: "/meditations" },
  { name: "Projects", href: "/projects" },
  { name: "Future", href: "/future" },
]

const elsewhere = [
  { name: "Newsletter", href: siteConfig.links.newsletter },
  { name: "Twitter", href: siteConfig.links.twitter },
  { name: "GitHub", href: siteConfig.links.github },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/thisisalimirza/" },
]

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-wordmark">
            Ali Mirza
          </Link>
          <p className="footer-blurb">
            Find me on <a href={siteConfig.links.twitter} target="_blank" rel="noopener noreferrer">Twitter</a>{" "}
            or email <a href={`mailto:${siteConfig.author.email}`}>{siteConfig.author.email}</a>.
            I try to respond to everything.
          </p>
        </div>

        <div>
          <h2 className="footer-col-title">Explore</h2>
          <ul className="footer-links">
            {explore.map(link => (
              <li key={link.href}>
                <Link href={link.href}>{link.name}</Link>
              </li>
            ))}
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/start-here">Start here</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="footer-col-title">Elsewhere</h2>
          <ul className="footer-links">
            {elsewhere.map(link => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="site-footer-base">
        <span>© {new Date().getFullYear()} Ali Mirza</span>
        <Link href="/admin">admin</Link>
      </div>
    </footer>
  )
}
