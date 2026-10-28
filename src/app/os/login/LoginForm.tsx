"use client"
import { useActionState } from "react"
import { login } from "@/lib/os/actions"

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(async (prev: { error?: string } | undefined, f: FormData) => {
    try { return await login(prev, f) } catch (e) {
      // redirect() surfaces as a thrown control-flow error; let it through
      if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e
      return { error: "Couldn't reach the server. Check your connection and try again." }
    }
  }, undefined)
  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <label className="f">Password
        <input className="in" type="password" name="password" autoComplete="current-password" autoFocus required />
      </label>
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn pri" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button>
    </form>
  )
}
