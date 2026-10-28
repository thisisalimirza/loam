import Link from "next/link"
import type { CSSProperties } from "react"
import { getAreas, getProjects, getTasks } from "@/lib/os/data"
import { createArea, createProject } from "@/lib/os/actions"
import { AreaSelect, Card, Empty, PageHeader, Pill } from "../../_ui/ui"
import { Swatches } from "../../_ui/AreaForm"
import { Icon } from "../../_ui/icons"

export const metadata = { title: "Areas" }

export default async function Areas() {
  const [areas, projects, tasks] = await Promise.all([getAreas(true), getProjects(), getTasks({ openOnly: true })])
  const live = areas.filter(a => !a.archived), archived = areas.filter(a => a.archived)
  return (
    <>
      <PageHeader title="Areas & projects" sub="Areas are the ongoing parts of your life. Projects end." />
      <div className="stack">
        {live.length === 0 ? (
          <Card><Empty icon="areas" title="No areas yet">Start with the big buckets, like school, a product you run, or health.</Empty></Card>
        ) : (
          <div className="grid-even">
            {live.map(a => {
              const ps = projects.filter(p => p.area_id === a.id && p.status === "active")
              const n = tasks.filter(t => t.area_id === a.id).length
              return (
                <Link key={a.id} href={`/os/areas/${a.id}`} className="card cb" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="inline"><span className="dot" style={{ "--c": a.color } as CSSProperties} /><h2 style={{ flex: 1 }}>{a.name}</h2><Icon name="arrow" /></div>
                  <div className="meta">{n} open {n === 1 ? "task" : "tasks"} · {ps.length} {ps.length === 1 ? "project" : "projects"}</div>
                  {ps.length > 0 && <div className="inline">{ps.slice(0, 4).map(p => <Pill key={p.id} color={a.color}>{p.name}</Pill>)}</div>}
                </Link>
              )
            })}
          </div>
        )}
        <div className="grid2">
          <Card title="New area" icon="plus">
            <form action={createArea} className="form cb">
              <input className="in" name="name" placeholder="e.g. School" required aria-label="Area name" />
              <Swatches />
              <div><button className="btn pri">Create area</button></div>
            </form>
          </Card>
          <Card title="New project" icon="flag">
            <form action={createProject} className="form cb">
              <input className="in" name="name" placeholder="e.g. Surgery clerkship" required aria-label="Project name" />
              <div className="frow"><AreaSelect areas={live} /><input className="in" type="date" name="due_date" aria-label="Due date" /></div>
              <div><button className="btn pri">Create project</button></div>
            </form>
          </Card>
        </div>
        {projects.length > 0 && (
          <Card title="All projects" icon="flag" meta={projects.length}>
            <ul>
              {projects.map(p => {
                const a = areas.find(x => x.id === p.area_id)
                return (
                  <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row">
                    <span className="tt">{p.name}</span>
                    {a && <Pill color={a.color}>{a.name}</Pill>}
                    <Pill gray>{p.status}</Pill>
                  </Link></li>
                )
              })}
            </ul>
          </Card>
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
