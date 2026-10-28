import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SESSION_COOKIE, verifyToken } from "./session"

/** Every server action and page calls this. Middleware is the first gate, not the only one. */
export async function requireOwner() {
  const jar = await cookies()
  if (!(await verifyToken(jar.get(SESSION_COOKIE)?.value))) redirect("/os/login")
}
