import WriteSwitch from "../../_ui/WriteSwitch"
import Link from "next/link"
import { getMeta, listFiles } from "@/lib/os/site"
import { Card, Empty, PageHeader } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"
import { fmtDate } from "@/lib/os/dates"
import SearchField from "../../_ui/SearchField"

export const metadata = { title: "Site" }
export const dynamic = "force-dynamic"
export const maxDuration = 30

const label = (s: string) => s ? s.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase()) : "Pages"

export default async function Site({ searchParams }: { searchParams: Promise<{ q?: string; s?: string; deleted?: string }> }) {
  const { q = "", s = "", deleted } = await searchParams
  let data: Awaited<ReturnType<typeof listFiles>>
  try { data = await listFiles() } catch (e) {
    return (<><WriteSwitch /><PageHeader title="Site" /><Card><Empty icon="x" title="Couldn't load the site">{e instanceof Error ? e.message : "GitHub didn't answer."} Reload to try again.</Empty></Card></>)
  }
  const meta = await getMeta(data.files)
  const sections = ["", ...data.sections]
  const needle = q.trim().toLowerCase()
  const rows = data.files
    .map(f => ({ ...f, ...(meta[f.path] ?? { title: f.slug, date: "", published: true }) }))
    .filter(f => (s === "" || (s === "_pages" ? f.section === "" : f.section === s)))
    .filter(f => !needle || f.title.toLowerCase().includes(needle) || f.slug.toLowerCase().includes(needle))
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title))
  const counts = Object.fromEntries(sections.map(x => [x, data.files.filter(f => f.section === x).length]))
  const bySize = [...sections].sort((a, b) => counts[b] - counts[a]).filter(x => counts[x] > 0)
  const top = bySize.slice(0, 3), rest = bySize.slice(3)
  const href = (o: { s?: string; q?: string }) => { const p = new URLSearchParams(); const ss = o.s ?? s, qq = o.q ?? q; if (ss) p.set("s", ss); if (qq) p.set("q", qq); const t = p.toString(); return `/os/site${t ? "?" + t : ""}` }
  return (
    <>
      <WriteSwitch /><PageHeader title="Site" actions={<>
        <details className="sd-menu">
          <summary className="btn ghost icon-btn" aria-label="More" title="More"><Icon name="more" /></summary>
          <div className="sd-pop" role="menu"><a role="menuitem" href="/" target="_blank" rel="noreferrer">View site</a></div>
        </details>
        <Link className="btn ghost icon-btn add-btn" href={`/os/site/new${s && s !== "_pages" ? `?section=${s}` : ""}`} aria-label="New post" title="New post"><Icon name="plus" /></Link>
      </>} />
      {deleted && <p className="banner">Deleted. The site updates in about a minute.</p>}
      <div className="site-bar">
        <nav className="seg" aria-label="Sections">
          <Link href={href({ s: "" })} className={s === "" ? "on" : ""}>All</Link>
          {top.map(x => <Link key={x || "_pages"} href={href({ s: x || "_pages" })} className={s === (x || "_pages") ? "on" : ""}>{label(x)}</Link>)}
        </nav>
        {rest.length > 0 && <details className="sd-menu">
          <summary className={`btn sm${rest.some(x => s === (x || "_pages")) ? " on" : ""}`}>{rest.find(x => s === (x || "_pages")) !== undefined ? label(rest.find(x => s === (x || "_pages"))!) : "More"}<Icon name="chev" size={12} /></summary>
          <div className="sd-pop" role="menu">{rest.map(x => <Link role="menuitem" key={x || "_pages"} href={href({ s: x || "_pages" })}>{label(x)} <span className="meta">{counts[x]}</span></Link>)}</div>
        </details>}
      </div>
      <SearchField action="/os/site" q={q} label="Search posts" placeholder="Search posts" hidden={{ s }} />
      <Card>
        {rows.length === 0 ? <p className="quiet-line empty-line">{needle ? "No posts match." : "Nothing here yet."}</p> : (
          <ul>
            {rows.map(r => (
              <li key={r.path} className="row site-row">
                <Link href={`/os/site/edit?path=${encodeURIComponent(r.path)}`} className="grow" style={{ minWidth: 0 }}>
                  <div className="tt">{r.title}</div>
                  {(r.date || !r.published) && <div className="meta">{[r.date && /^\d{4}-\d\d-\d\d/.test(r.date) ? fmtDate(r.date.slice(0, 10), { month: "short", day: "numeric", year: "numeric" }) : r.date, !r.published && "Hidden"].filter(Boolean).join(" · ")}</div>}
                </Link>
                <Icon name="chev" size={14} className="muted" />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
