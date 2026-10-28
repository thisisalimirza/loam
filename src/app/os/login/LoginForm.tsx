"use client"
import { useActionState } from "react"
import { login } from "@/lib/os/actions"

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined)
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
