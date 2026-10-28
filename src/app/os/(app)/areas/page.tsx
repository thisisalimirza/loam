import Link from "next/link"
import type { CSSProperties } from "react"
import { getAreas, getProjects, getTasks } from "@/lib/os/data"
import { createArea, createProject } from "@/lib/os/actions"
import { fmtDate } from "@/lib/os/dates"
import { Card, PageHeader } from "../../_ui/ui"
import { Swatches } from "../../_ui/AreaForm"
import { Icon } from "../../_ui/icons"
import StarterAreas from "../../_ui/StarterAreas"

export const metadata = { title: "Areas" }

export default async function Areas() {
  const [areas, projects, tasks] = await Promise.all([getAreas(true), getProjects(), getTasks({ openOnly: true })])
  const live = areas.filter(a => !a.archived), archived = areas.filter(a => a.archived)
  const loose = projects.filter(p => !p.area_id || !areas.some(a => a.id === p.area_id))
  const openIn = (k: "area_id" | "project_id", id: string) => tasks.filter(t => t[k] === id).length
  const newArea = (
    <details className="pop-form">
      <summary className="btn pri"><Icon name="plus" />New area</summary>
      <form action={createArea} className="form cb card">
        <input className="in" name="name" placeholder="e.g. Health" required aria-label="Area name" autoFocus />
        <Swatches />
        <div><button className="btn pri sm">Create area</button></div>
      </form>
    </details>
  )
  return (
    <>
      <PageHeader title="Areas" sub="The ongoing parts of your life, and the projects inside each." actions={live.length > 0 ? newArea : undefined} />
      <div className="stack">
        {live.length === 0 ? <StarterAreas /> : (
          <ul className="arealist">
            {live.map(a => {
              const ps = projects.filter(p => p.area_id === a.id)
              const act = ps.filter(p => p.status !== "done"), done = ps.length - act.length
              const n = openIn("area_id", a.id)
              return (
                <li key={a.id} className="card" style={{ "--c": a.color } as CSSProperties}>
                  <Link href={`/os/areas/${a.id}`} className="al-head">
                    <span className="dot" style={{ margin: 0 }} />
                    <h2>{a.name}</h2>
                    <span className="meta">{n} open · {act.length} {act.length === 1 ? "project" : "projects"}</span>
                    <Icon name="arrow" size={16} />
                  </Link>
                  <ul className="al-ps">
                    {act.map(p => {
                      const k = openIn("project_id", p.id)
                      return (
                        <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row">
                          <Icon name="flag" size={14} className="muted" />
                          <span className="tt">{p.name}</span>
                          {p.status === "paused" && <span className="pill gray">Paused</span>}
                          {p.due_date && <span className="due">Due {fmtDate(p.due_date)}</span>}
                          <span className="meta">{k ? `${k} open` : "No tasks"}</span>
                        </Link></li>
                      )
                    })}
                    <li>
                      <form action={createProject} className="addrow al-add">
                        <input type="hidden" name="area_id" value={a.id} />
                        <Icon name="plus" size={14} className="muted" />
                        <input className="in bare" name="name" placeholder={act.length ? "Add a project" : "Add the first project"} required aria-label={`New project in ${a.name}`} />
                        <button className="btn sm">Add</button>
                      </form>
                    </li>
                  </ul>
                  {done > 0 && <Link href={`/os/areas/${a.id}`} className="al-done meta">{done} finished {done === 1 ? "project" : "projects"}</Link>}
                </li>
              )
            })}
          </ul>
        )}
        {loose.length > 0 && (
          <Card title="Projects without an area" icon="flag" meta={loose.length}>
            <ul>{loose.map(p => <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row"><span className="tt">{p.name}</span><span className="meta">{p.status}</span></Link></li>)}</ul>
          </Card>
        )}
        {live.length === 0 && (
          <details className="pop-form inline-form">
            <summary className="btn">Or create your own area</summary>
            <form action={createArea} className="form cb card">
              <input className="in" name="name" placeholder="e.g. Health" required aria-label="Area name" />
              <Swatches />
              <div><button className="btn pri sm">Create area</button></div>
            </form>
          </details>
        )}
        {archived.length > 0 && (
          <Card title="Archived" meta={archived.length}>
            <ul>{archived.map(a => <li key={a.id}><Link href={`/os/areas/${a.id}`} className="row"><span className="dot" style={{ "--c": a.color } as CSSProperties} /><span className="tt muted">{a.name}</span></Link></li>)}</ul>
          </Card>
        )}
      </div>
    </>
  )
}
