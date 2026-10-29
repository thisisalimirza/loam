import Link from "next/link"
import { getDue, getLearn, type LearnItem } from "@/lib/os/learn"
import { addEdge, addEvidence, deleteLearn, reviewLearn, toggleTopic } from "@/lib/os/actions"
import { getReading } from "@/lib/os/data"
import Sheet from "../../_ui/Sheet"
import UndoDelete from "../../_ui/UndoDelete"
import Reading, { AddReading } from "./Reading"
import { fmtDate } from "@/lib/os/dates"
import { PageHeader } from "../../_ui/ui"

export const metadata = { title: "Learn" }
const TABS = [["evidence", "Evidence"], ["edges", "Debates"], ["reading", "Reading"], ["review", "Review"]] as const
const SUGGESTED = ["Internal medicine", "Medical education", "AI in medicine", "Consumer health apps", "Startups"]

function Item({ it, review }: { it: LearnItem; review?: boolean }) {
  const points = it.kind === "edge" ? it.summary.split("\n").filter(Boolean).map(l => { const [c, n] = l.split("|"); return { c, n: (n ?? "").split(",").filter(Boolean).map(Number) } }) : []
  return (
    <li className="lrn" aria-label={it.title}>
      <div className="lrn-h">
        <h3>{it.url ? <a href={it.url} target="_blank" rel="noreferrer">{it.title}</a> : it.title}</h3>
        {!review && <UndoDelete action={deleteLearn.bind(null, it.id)} label={`Delete ${it.title}`} toast="Deleted" />}
      </div>
      {it.kind === "evidence" && it.summary && <p className="sum">{it.summary}</p>}
      {points.length > 0 && <ul className="pts">{points.map((p, i) => <li key={i}>{p.c} {p.n.map(n => it.sources[n - 1] && <a key={n} className="cite" href={it.sources[n - 1].url} target="_blank" rel="noreferrer">[{n}]</a>)}</li>)}</ul>}
      {it.takeaway && it.takeaway !== it.title && <p className="take"><b>Keep:</b> {it.takeaway}</p>}
      {it.kind === "edge" && (
        <details className="srcs"><summary>{it.sources.length} {it.sources.length === 1 ? "post" : "posts"}</summary>
          <ol>{it.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.author ? s.author + ": " : ""}{s.title}</a></li>)}</ol>
        </details>
      )}
      <p className="meta">{[it.source, fmtDate(new Date(it.created_at).toISOString().slice(0, 10)), !review && it.review_due && `Review ${fmtDate(it.review_due)}`].filter(Boolean).map(x => String(x).charAt(0).toUpperCase() + String(x).slice(1)).join(" · ")}</p>
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
  const items = tab === "review" ? due : tab === "reading" ? [] : await getLearn(tab === "edges" ? "edge" : "evidence")
  const reading = tab === "reading" ? await getReading() : []
  const kept = tab === "edges" ? (await getLearn("topic")).map(t => t.title) : []
  const topics = [...kept.filter(t => !SUGGESTED.includes(t)), ...SUGGESTED]
  const add = tab === "evidence" ? (
    <Sheet label="Add evidence" icon="plus" iconOnly>
      <form action={addEvidence} className="form">
        <label className="fld"><span>Link</span><input className="in" name="url" type="url" placeholder="Paper or article (optional)" aria-label="Link" /></label>
        <label className="fld"><span>What you learned</span><textarea className="in" name="note" rows={3} aria-label="What you learned" /></label>
        <div><button className="btn pri sm">Save</button></div>
      </form>
    </Sheet>
  ) : tab === "edges" ? (
    <Sheet label="New debate" icon="plus" iconOnly>
      <form action={addEdge} className="form">
        <label className="fld"><span>Topic</span><input className="in" name="topic" list="kept-topics" placeholder="e.g. residency interviews" aria-label="Topic" /></label>
        <datalist id="kept-topics">{kept.map(t => <option key={t} value={t} />)}</datalist>
        <label className="fld"><span>Posts on X</span><textarea className="in" name="links" rows={3} placeholder="Paste links, one per line" aria-label="X post links" /></label>
        <p className="meta">Reads public posts. Nothing is posted.</p>
        <div><button className="btn pri sm">Summarize</button></div>
      </form>
    </Sheet>
  ) : tab === "reading" ? <Sheet label="Add to reading" icon="plus" iconOnly><AddReading /></Sheet> : null
  return (
    <>
      <PageHeader title="Learn" actions={add} />
      <nav className="seg" aria-label="Learn sections" style={{ marginBottom: 14, width: "fit-content", maxWidth: "100%" }}>
        {TABS.map(([k, l]) => <Link key={k} href={`/os/learn?tab=${k}`} className={tab === k ? "on" : ""}>{l}{k === "review" && due.length ? ` ${due.length}` : ""}</Link>)}
      </nav>
      {tab === "edges" && (
        <div className="tchips" aria-label="Topics">
          {topics.map(t => <form key={t} action={toggleTopic.bind(null, t)}><button className={`chip${kept.includes(t) ? " on" : ""}`} aria-pressed={kept.includes(t)}>{t}</button></form>)}
        </div>
      )}
      {tab === "edges" && sp.err && <p className="err">{sp.err === "search" ? "Searching X by topic isn’t set up yet. Paste post links instead." : "Couldn’t read those posts. Check the links."}</p>}
      {tab === "review" && !items.length && <p className="quiet-line">Nothing to review today.</p>}
      {tab === "reading" && (reading.length ? <div className="card"><Reading items={reading} /></div> : <p className="quiet-line">Nothing to read yet.</p>)}
      {(tab === "evidence" || tab === "edges") && !items.length && <p className="quiet-line">{tab === "edges" ? "No debates yet. Keep a few topics above, or add posts." : "Nothing saved yet."}</p>}
      <ul className="lrn-list">{items.map(it => <Item key={it.id} it={it} review={tab === "review"} />)}</ul>
    </>
  )
}
