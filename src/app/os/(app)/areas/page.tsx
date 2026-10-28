import Link from "next/link"
import type { CSSProperties } from "react"
import { getAreas, getProjects, getTasks } from "@/lib/os/data"
import { createArea, createProject } from "@/lib/os/actions"
import { fmtDate, relDue, todayISO } from "@/lib/os/dates"
import { nextUp } from "@/lib/os/focus"
import { PageHeader } from "../../_ui/ui"
import { Swatches } from "../../_ui/AreaForm"
import { Icon } from "../../_ui/icons"
import StarterAreas from "../../_ui/StarterAreas"
import Sheet from "../../_ui/Sheet"
import DateChip from "../../_ui/DateChip"

export const metadata = { title: "Areas" }

export default async function Areas() {
  const [areas, projects, tasks] = await Promise.all([getAreas(true), getProjects(), getTasks({ openOnly: true })])
  const today = todayISO()
  const live = areas.filter(a => !a.archived), archived = areas.filter(a => a.archived)
  const loose = projects.filter(p => p.status !== "done" && (!p.area_id || !areas.some(a => a.id === p.area_id)))
  const newArea = (
    <Sheet label="New area" primary icon="plus">
      <form action={createArea} className="form">
        <label className="fld"><span>Name</span><input className="in" name="name" placeholder="e.g. Health" required aria-label="Area name" /></label>
        <Swatches />
        <div><button className="btn pri">Create area</button></div>
      </form>
    </Sheet>
  )
  const newProject = live.length > 0 && (
    <Sheet label="New project" icon="flag">
      <form action={createProject} className="form">
        <label className="fld"><span>Name</span><input className="in" name="name" placeholder="e.g. Step 2 prep" required aria-label="Project name" /></label>
        <label className="fld"><span>Area</span><select className="in" name="area_id" aria-label="Area">{live.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <DateChip label="Due" name="due_date" />
        <div><button className="btn pri">Create project</button></div>
      </form>
    </Sheet>
  )
  return (
    <>
      <PageHeader title="Areas" sub="The ongoing parts of your life, and the projects inside each." actions={<>{newProject}{newArea}</>} />
      <div className="stack">
        {live.length === 0 ? <StarterAreas /> : (
          <ul className="arealist">
            {live.map(a => {
              const ps = projects.filter(p => p.area_id === a.id && p.status !== "done")
              const mine = tasks.filter(t => t.area_id === a.id)
              const nx = nextUp(mine)
              const due = nx?.due_date ? relDue(nx.due_date, today) : null
              return (
                <li key={a.id} className="card al-card" style={{ "--c": a.color } as CSSProperties}>
                  <Link href={`/os/areas/${a.id}`} className="al-head">
                    <span className="dot" style={{ margin: 0 }} />
                    <h2>{a.name}</h2>
                    <span className="meta">{mine.length} open</span>
                    <Icon name="arrow" size={16} />
                  </Link>
                  {nx ? (
                    <Link href={`/os/areas/${a.id}`} className="al-next"><small>Next</small><span className="tt">{nx.title}</span>{due && <span className={`due${due.warn ? " warn" : ""}`}>{due.label}</span>}</Link>
                  ) : <p className="al-next quiet">Nothing queued. Open it to add a next step.</p>}
                  {ps.length > 0 && (
                    <ul className="al-ps">
                      {ps.map(p => {
                        const pt = mine.filter(t => t.project_id === p.id), pn = nextUp(pt)
                        return (
                          <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row">
                            <Icon name="flag" size={14} className="muted" />
                            <span className="tt">{p.name}{pn && <small className="al-pn">{pn.title}</small>}{!pn && p.status === "active" && <small className="al-pn warn">No next step</small>}</span>
                            {p.status === "paused" && <span className="pill gray">Paused</span>}
                            {p.due_date && <span className="due">{fmtDate(p.due_date)}</span>}
                            <span className="meta">{pt.length || ""}</span>
                          </Link></li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {loose.length > 0 && (
          <section className="quiet-sec">
            <h3>Projects without an area</h3>
            <ul>{loose.map(p => <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row"><span className="tt">{p.name}</span><span className="meta">{p.status}</span></Link></li>)}</ul>
          </section>
        )}
        {archived.length > 0 && (
          <details className="quiet-sec">
            <summary>Archived · {archived.length}</summary>
            <ul>{archived.map(a => <li key={a.id}><Link href={`/os/areas/${a.id}`} className="row"><span className="dot" style={{ "--c": a.color } as CSSProperties} /><span className="tt muted">{a.name}</span></Link></li>)}</ul>
          </details>
        )}
      </div>
    </>
  )
}
