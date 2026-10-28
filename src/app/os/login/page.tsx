import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SESSION_COOKIE, verifyToken } from "@/lib/os/session"
import LoginForm from "./LoginForm"

export const metadata = { title: "Sign in" }
export const dynamic = "force-dynamic"
export const maxDuration = 30

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; out?: string }> }) {
  const { next, out } = await searchParams
  const dest = next && /^\/(os|admin)(\/|$|\?)/.test(next) ? next : "/os"
  if (await verifyToken((await cookies()).get(SESSION_COOKIE)?.value)) redirect(dest)
  return (
    <div className="login">
      <div className="card">
        <div className="brand" style={{ padding: "0 0 18px" }}>
          <span className="logo">L</span>
          <div><strong>Loam OS</strong><small>{dest.startsWith("/admin") ? "Sign in to publish" : "Private"}</small></div>
        </div>
        {out && <p className="meta" style={{ marginBottom: 12 }}>You’re signed out.</p>}
        <LoginForm next={dest} />
      </div>
    </div>
  )
}
