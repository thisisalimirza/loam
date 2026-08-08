import type { Metadata } from "next"

/**
 * `robots.txt` asks crawlers not to fetch /admin, but a disallowed URL can
 * still be indexed from a link elsewhere. The header settles it.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
