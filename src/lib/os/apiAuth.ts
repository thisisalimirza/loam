import "server-only"
import { createHash, timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifyToken } from "./session"

/** Admin API access: a valid owner session, or the admin password (older clients). */
export async function isAdmin(req: NextRequest, password?: unknown) {
  if (await verifyToken(req.cookies.get(SESSION_COOKIE)?.value)) return true
  const real = process.env.ADMIN_PASSWORD
  if (!real || typeof password !== "string" || !password) return false
  const a = createHash("sha256").update(password).digest()
  const b = createHash("sha256").update(real).digest()
  return timingSafeEqual(a, b)
}
