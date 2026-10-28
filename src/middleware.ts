import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, verifyToken } from "@/lib/os/session"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === "/os/login") return NextResponse.next()
  const ok = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (ok) return NextResponse.next()
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const url = req.nextUrl.clone()
  url.pathname = "/os/login"
  // Signing in always lands in Loam OS; the site editor lives at Site in the sidebar
  url.search = pathname.startsWith("/admin") || pathname === "/os" ? "" : `?next=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(url)
}

export const config = { matcher: ["/os", "/os/:path*", "/api/os/:path*", "/admin", "/admin/:path*"] }
