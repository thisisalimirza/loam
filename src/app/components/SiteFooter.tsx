import Image from "next/image"
import Link from "next/link"

import Icon from "./Icon"

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link href="/" className="footer-wordmark">
          <Image
            src="/images/am-monogram.png"
            alt=""
            width={24}
            height={24}
            className="wordmark-monogram"
          />
          <span>ALI MIRZA<span className="wordmark-dot">.</span></span>
        </Link>
        <span className="footer-tagline">Medicine · products · people</span>
        <nav className="footer-nav" aria-label="Footer navigation">
          <Link href="/meditations">Meditations</Link>
          <Link href="/writing">Archive</Link>
          <a href="https://blog.thisisalimirza.com/" target="_blank" rel="noreferrer">Inversions</a>
        </nav>
        <a href="#top" className="back-top">
          Back to top <Icon name="up" />
        </a>
        <span className="copyright">© {new Date().getFullYear()} Ali Mirza</span>
      </div>
    </footer>
  )
}
