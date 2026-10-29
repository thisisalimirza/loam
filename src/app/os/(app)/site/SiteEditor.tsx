"use client"
import Link from "next/link"
import { useActionState, useEffect, useRef, useState } from "react"
import { marked } from "marked"
import { deleteSitePost, saveSitePost, type SaveState } from "@/lib/os/siteActions"
import { Icon } from "../../_ui/icons"
import DateChip from "../../_ui/DateChip"
import Confirm from "../../_ui/Confirm"
import { SheetPanel } from "../../_ui/Sheet"

marked.setOptions({ gfm: true, breaks: false })
const esc = (s: string) => s.replace(/</g, "&lt;")
type Post = { path: string; sha: string; section: string; slug: string; title: string; body: string; date: string; summary: string; tags: string[]; published: boolean; url: string }
const label = (s: string) => s.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase())

export default function SiteEditor({ post, sections, defaultSection, created }: { post: Post; sections: string[]; defaultSection?: string; created?: boolean }) {
  const isNew = !post.path
  const [state, action, pending] = useActionState<SaveState, FormData>(saveSitePost, created ? { ok: "Created. It'll be live in about a minute." } : undefined)
  const [sha, setSha] = useState(post.sha)
  const [title, setTitle] = useState(post.title)
  const [body, setBody] = useState(post.body)
  const [mode, setMode] = useState<"write" | "preview">("write")
  const [section, setSection] = useState(defaultSection ?? post.section)
  const [published, setPublished] = useState(post.published)
  const [dirty, setDirty] = useState(false)
  const [details, setDetails] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const more = useRef<HTMLElement>(null)

  useEffect(() => { if (state?.sha) { setSha(state.sha); setDirty(false) } }, [state])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault() } }
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); form.current?.requestSubmit() } }
    window.addEventListener("beforeunload", warn); window.addEventListener("keydown", key)
    return () => { window.removeEventListener("beforeunload", warn); window.removeEventListener("keydown", key) }
  }, [dirty])

  const words = body.trim() ? body.trim().split(/\s+/).length : 0
  return (
    <form ref={form} action={action} onChange={() => setDirty(true)} className="site-ed">
      <input type="hidden" name="path" value={post.path} />
      <input type="hidden" name="sha" value={sha} />
      <header className="hd">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link className="crumb" href="/os/site"><Icon name="back" size={14} />Site</Link>
          <input className="title-in" name="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" aria-label="Title" required autoFocus={isNew} />
        </div>
        <div className="hd-actions">
          <span className="meta">{pending ? "Saving…" : dirty ? "Unsaved changes" : ""}</span>
          <details className="sd-menu">
            <summary ref={more} className="btn ghost sm" aria-label="More"><Icon name="more" size={16} /></summary>
            <div className="sd-pop" role="menu">
              <button type="button" role="menuitem" onClick={e => { (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; setDetails(true) }}>Details</button>
              {!isNew && <div className="sd-path meta ell">{post.url}</div>}
              {!isNew && post.published && <a role="menuitem" href={post.url} target="_blank" rel="noreferrer">View live</a>}
              {!isNew && <div className="sd-del"><Confirm action={deleteSitePost.bind(null, post.path)} label="Delete post" message={`Delete “${post.title}” from the site? This commits a deletion to GitHub.`} /></div>}
            </div>
          </details>
          <button className="btn pri" disabled={pending} title="⌘S">{pending ? "Saving…" : isNew ? (published ? "Publish" : "Save hidden") : "Save"}</button>
        </div>
      </header>
      {state?.error && <p className="err banner-err" role="alert">{state.error}</p>}
      {state?.ok && !dirty && <p className="banner" role="status">{state.ok}</p>}
      <div className="sd-wrap">
        <section className="sd-body stack" style={{ gap: 10 }}>
          <nav className="seg" style={{ alignSelf: "flex-start" }}>
            <button type="button" className={mode === "write" ? "on" : ""} onClick={() => setMode("write")}>Edit</button>
            <button type="button" className={mode === "preview" ? "on" : ""} onClick={() => setMode("preview")}>Preview</button>
          </nav>
          <textarea className="editor" name="body" value={body} onChange={e => setBody(e.target.value)} aria-label="Post body"
            placeholder="Markdown. # headings, **bold**, [links](https://…)" hidden={mode !== "write"} />
          {mode === "preview" && (body.trim()
            ? <article className="md">{title && <h1>{title}</h1>}<div dangerouslySetInnerHTML={{ __html: marked.parse(esc(body)) as string }} /></article>
            : <p className="muted">Nothing to preview yet.</p>)}
          {words >= 50 && <span className="meta">{words} words · about {Math.max(1, Math.round(words / 230))} min read</span>}
        </section>
        <SheetPanel open={details} onClose={() => setDetails(false)} title="Details" keepMounted opener={more}>
          <div className="form">
          {isNew && (<>
            <label className="fld"><span>Section</span>
              <select className="in" name="section" value={section} onChange={e => setSection(e.target.value)}>
                {sections.map(s => <option key={s} value={s}>{label(s)}</option>)}
                <option value="_pages">Top-level page</option>
                <option value="_new">New section…</option>
              </select>
            </label>
            {section === "_new" && <label className="fld"><span>New section name</span><input className="in" name="new_section" placeholder="e.g. letters" /></label>}
            <label className="fld"><span>Slug</span><input className="in" name="slug" placeholder={title ? title.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") : "from the title"} /></label>
          </>)}
          <div className="fld"><span>Date</span><div><DateChip label="Published" name="date" defaultValue={post.date || null} clearable={false} quick={[["Today", 0], ["Yesterday", -1]]} /></div></div>
          <label className="fld"><span>Summary</span><textarea className="in" name="summary" rows={3} defaultValue={post.summary} placeholder="One line for lists and link previews" /></label>
          <label className="fld"><span>Tags</span><input className="in" name="tags" defaultValue={post.tags.join(", ")} placeholder="comma, separated" /></label>
          <div className="sw-row"><span className="tt">Visible</span><input type="hidden" name="published" value={published ? "on" : ""} disabled={!published} /><button type="button" role="switch" aria-checked={published} aria-label="Visible on the site" className="switch" onClick={() => { setPublished(!published); setDirty(true) }}><i /></button></div>
          </div>
        </SheetPanel>
      </div>
    </form>
  )
}
