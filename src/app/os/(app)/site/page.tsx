import Link from "next/link"
import { getMeta, listFiles, liveUrl } from "@/lib/os/site"
import { Card, Empty, PageHeader, Pill } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"

export const metadata = { title: "Site" }
export const dynamic = "force-dynamic"
export const maxDuration = 30

const label = (s: string) => s ? s.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase()) : "Pages"

export default async function Site({ searchParams }: { searchParams: Promise<{ q?: string; s?: string; deleted?: string }> }) {
  const { q = "", s = "", deleted } = await searchParams
  let data: Awaited<ReturnType<typeof listFiles>>
  try { data = await listFiles() } catch (e) {
    return (<><PageHeader title="Site" /><Card><Empty icon="x" title="Couldn't load the site">{e instanceof Error ? e.message : "GitHub didn't answer."} Reload to try again.</Empty></Card></>)
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
  const hidden = rows.filter(r => !r.published).length
  const href = (o: { s?: string; q?: string }) => { const p = new URLSearchParams(); const ss = o.s ?? s, qq = o.q ?? q; if (ss) p.set("s", ss); if (qq) p.set("q", qq); const t = p.toString(); return `/os/site${t ? "?" + t : ""}` }
  return (
    <>
      <PageHeader title="Site" sub={<>Everything on thisisalimirza.com. Saving commits to GitHub and goes live in about a minute.</>}
        actions={<><a className="btn" href="/" target="_blank" rel="noreferrer"><Icon name="link" />View site</a><Link className="btn pri" href={`/os/site/new${s && s !== "_pages" ? `?section=${s}` : ""}`}><Icon name="plus" />New post</Link></>} />
      {deleted && <p className="banner">Deleted. The site updates in about a minute.</p>}
      <nav className="chips" aria-label="Sections">
        <Link href={href({ s: "" })} className={s === "" ? "on" : ""}>All <span>{data.files.length}</span></Link>
        {sections.map(x => <Link key={x || "_pages"} href={href({ s: x || "_pages" })} className={s === (x || "_pages") ? "on" : ""}>{label(x)} <span>{counts[x]}</span></Link>)}
      </nav>
      <form className="addrow" action="/os/site" style={{ marginBottom: 12 }}>
        {s && <input type="hidden" name="s" value={s} />}
        <input className="in" name="q" defaultValue={q} placeholder="Find a post by title or slug" aria-label="Search posts" />
        <button className="btn sm"><Icon name="search" />Search</button>
      </form>
      <Card meta={`${rows.length} ${rows.length === 1 ? "item" : "items"}${hidden ? ` · ${hidden} hidden` : ""}`} title={s ? label(s === "_pages" ? "" : s) : "All posts"} icon="pen">
        {rows.length === 0 ? <Empty icon="pen" title={needle ? "Nothing matches" : "Nothing here yet"}>{needle ? "Try another word." : "Write the first one."}</Empty> : (
          <ul>
            {rows.map(r => (
              <li key={r.path} className="row hov site-row">
                <Link href={`/os/site/edit?path=${encodeURIComponent(r.path)}`} className="grow" style={{ minWidth: 0 }}>
                  <div className="tt">{r.title}</div>
                  <div className="meta ell">{liveUrl(r)}</div>
                </Link>
                {!s && <Pill gray>{label(r.section)}</Pill>}
                {!r.published && <Pill color="#b7791f">Hidden</Pill>}
                {r.date && <span className="due">{r.date}</span>}
                {r.published && <a className="btn ghost sm" href={liveUrl(r)} target="_blank" rel="noreferrer" aria-label={`Open ${r.title} on the site`}><Icon name="link" size={14} /></a>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
