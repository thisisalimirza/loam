import WriteSwitch from "../../_ui/WriteSwitch"
import Link from "next/link"
import { getMeta, listFiles } from "@/lib/os/site"
import { Card, Empty, PageHeader } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"
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
  const href = (o: { s?: string; q?: string }) => { const p = new URLSearchParams(); const ss = o.s ?? s, qq = o.q ?? q; if (ss) p.set("s", ss); if (qq) p.set("q", qq); const t = p.toString(); return `/os/site${t ? "?" + t : ""}` }
  return (
    <>
      <WriteSwitch /><PageHeader title="Site" actions={<><a className="btn" href="/" target="_blank" rel="noreferrer"><Icon name="link" />View site</a><Link className="btn pri" href={`/os/site/new${s && s !== "_pages" ? `?section=${s}` : ""}`}><Icon name="plus" />New post</Link></>} />
      {deleted && <p className="banner">Deleted. The site updates in about a minute.</p>}
      <nav className="chips" aria-label="Sections">
        <Link href={href({ s: "" })} className={s === "" ? "on" : ""}>All <span>{data.files.length}</span></Link>
        {sections.map(x => <Link key={x || "_pages"} href={href({ s: x || "_pages" })} className={s === (x || "_pages") ? "on" : ""}>{label(x)} <span>{counts[x]}</span></Link>)}
      </nav>
      <SearchField action="/os/site" q={q} label="Search posts" placeholder="Search posts" hidden={{ s }} />
      <Card>
        {rows.length === 0 ? <p className="quiet-line empty-line">{needle ? "No posts match." : "Nothing here yet."}</p> : (
          <ul>
            {rows.map(r => (
              <li key={r.path} className="row hov site-row">
                <Link href={`/os/site/edit?path=${encodeURIComponent(r.path)}`} className="grow" style={{ minWidth: 0 }}>
                  <div className="tt">{r.title}</div>
                  {(r.date || !r.published) && <div className="meta">{[r.date, !r.published && "Hidden"].filter(Boolean).join(" · ")}</div>}
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
