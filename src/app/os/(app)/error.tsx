"use client"
import { useEffect } from "react"

export default function OsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.warn("loam os:", error.digest ?? error.message) }, [error])
  return (
    <div className="card cb" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
      <h2 style={{ marginBottom: 6 }}>Something didn’t load</h2>
      <p className="muted" style={{ marginBottom: 16 }}>Usually the database is waking up. Try again in a moment.</p>
      <button className="btn pri" onClick={reset}>Try again</button>
    </div>
  )
}
