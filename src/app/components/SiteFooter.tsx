import Link from "next/link"

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link href="/" className="footer-wordmark">
          <span className="wordmark-mark" aria-hidden="true">A</span>
          <span>ALI MIRZA<span className="wordmark-dot">.</span></span>
        </Link>
        <span className="footer-tagline">Medicine · products · people</span>
        <nav className="footer-nav" aria-label="Footer navigation">
          <Link href="/meditations">Meditations</Link>
          <Link href="/writing">Archive</Link>
          <a href="https://blog.thisisalimirza.com/" target="_blank" rel="noreferrer">Inversions</a>
        </nav>
        <a href="#top" className="back-top">Back to top ↑</a>
        <span className="copyright">© {new Date().getFullYear()} Ali Mirza</span>
      </div>
    </footer>
  )
}
