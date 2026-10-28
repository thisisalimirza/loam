import Link from "next/link"
export default function NotFound() {
  return (
    <div className="card cb" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
      <h2 style={{ marginBottom: 6 }}>Not here</h2>
      <p className="muted" style={{ marginBottom: 16 }}>It may have been deleted.</p>
      <Link className="btn pri" href="/os">Back to Today</Link>
    </div>
  )
}
