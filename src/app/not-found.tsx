import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="page-layout">
      <div className="page-head">
        <p className="eyebrow">404</p>
        <h1 className="page-title">There&apos;s nothing at this address</h1>
        <p className="page-intro">
          The page you were after has either moved or never existed. Try the{" "}
          <Link href="/writing">writing archive</Link>, the{" "}
          <Link href="/reading">book notes</Link>, or start from the{" "}
          <Link href="/">homepage</Link>.
        </p>
      </div>
    </div>
  )
}
