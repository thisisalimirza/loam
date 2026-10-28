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
  url.search = `?next=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(url)
}

export const config = { matcher: ["/os", "/os/:path*", "/api/os/:path*", "/admin", "/admin/:path*"] }
