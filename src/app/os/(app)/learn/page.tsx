import Link from "next/link"
import { getDue, getLearn, type LearnItem } from "@/lib/os/learn"
import { addEdge, addEvidence, deleteLearn, reviewLearn } from "@/lib/os/actions"
import { fmtDate } from "@/lib/os/dates"
import { PageHeader } from "../../_ui/ui"

export const metadata = { title: "Learn" }
const TABS = [["evidence", "Evidence"], ["edges", "Edges"], ["review", "Review"]] as const

function Item({ it, review }: { it: LearnItem; review?: boolean }) {
  const points = it.kind === "edge" ? it.summary.split("\n").filter(Boolean).map(l => { const [c, n] = l.split("|"); return { c, n: (n ?? "").split(",").filter(Boolean).map(Number) } }) : []
  return (
    <li className="lrn" aria-label={it.title}>
      <div className="lrn-h">
        <h3>{it.url ? <a href={it.url} target="_blank" rel="noreferrer">{it.title}</a> : it.title}</h3>
        {!review && <form action={deleteLearn.bind(null, it.id)}><button className="btn ghost sm" aria-label={`Delete ${it.title}`}>×</button></form>}
      </div>
      {it.kind === "evidence" && it.summary && <p className="sum">{it.summary}</p>}
      {points.length > 0 && <ul className="pts">{points.map((p, i) => <li key={i}>{p.c} {p.n.map(n => it.sources[n - 1] && <a key={n} className="cite" href={it.sources[n - 1].url} target="_blank" rel="noreferrer">[{n}]</a>)}</li>)}</ul>}
      {it.takeaway && <p className="take"><b>Keep:</b> {it.takeaway}</p>}
      {it.kind === "edge" && (
        <details className="srcs"><summary>{it.sources.length} {it.sources.length === 1 ? "post" : "posts"}</summary>
          <ol>{it.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.author ? s.author + ": " : ""}{s.title}</a></li>)}</ol>
        </details>
      )}
      <p className="meta">{[it.source, fmtDate(new Date(it.created_at).toISOString().slice(0, 10)), !review && it.review_due && `review ${fmtDate(it.review_due)}`].filter(Boolean).join(" · ")}</p>
      {review && (
        <div className="rv-btns">
          <form action={reviewLearn.bind(null, it.id, false)}><button className="btn sm">Again tomorrow</button></form>
          <form action={reviewLearn.bind(null, it.id, true)}><button className="btn sm pri">I remember</button></form>
        </div>
      )}
    </li>
  )
}

export default async function Learn({ searchParams }: { searchParams: Promise<{ tab?: string; err?: string }> }) {
  const sp = await searchParams
  const tab = TABS.some(t => t[0] === sp.tab) ? sp.tab! : "evidence"
  const due = await getDue()
  const items = tab === "review" ? due : await getLearn(tab === "edges" ? "edge" : "evidence")
  return (
    <>
      <PageHeader title="Learn" sub={due.length ? `${due.length} to review` : undefined} />
      <nav className="seg" aria-label="Learn sections" style={{ marginBottom: 14, width: "fit-content" }}>
        {TABS.map(([k, l]) => <Link key={k} href={`/os/learn?tab=${k}`} className={tab === k ? "on" : ""}>{l}{k === "review" && due.length ? ` ${due.length}` : ""}</Link>)}
      </nav>
      {tab === "evidence" && (
        <form action={addEvidence} className="card lrn-add">
          <input className="in" name="url" type="url" placeholder="Link to a paper or article (optional)" aria-label="Link" />
          <textarea className="in" name="note" rows={2} placeholder="What did you learn from it?" aria-label="What you learned" />
          <div><button className="btn pri sm">Save</button></div>
        </form>
      )}
      {tab === "edges" && (
        <form action={addEdge} className="card lrn-add">
          <input className="in" name="topic" placeholder="Topic to look up on X, e.g. residency interviews" aria-label="Topic" />
          <textarea className="in" name="links" rows={2} placeholder="Or paste links to X posts, one per line" aria-label="X post links" />
          <p className="meta">Reads public posts only. Nothing is posted.{!process.env.X_BEARER_TOKEN && " Topic search needs an X API read token on the server; pasted links work now."}</p>
          {sp.err && <p className="err">{sp.err === "search" ? "Topic search isn’t connected yet. Paste post links instead." : "Couldn’t read those posts. Check the links."}</p>}
          <div><button className="btn pri sm">Summarize</button></div>
        </form>
      )}
      {tab === "review" && !items.length && <p className="quiet-line">Nothing to review today.</p>}
      {tab !== "review" && !items.length && <p className="quiet-line">{tab === "edges" ? "No edges yet." : "Nothing saved yet."}</p>}
      <ul className="lrn-list">{items.map(it => <Item key={it.id} it={it} review={tab === "review"} />)}</ul>
    </>
  )
}
