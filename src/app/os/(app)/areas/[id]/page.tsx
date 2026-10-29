import Link from "next/link"
import { notFound } from "next/navigation"
import type { CSSProperties } from "react"
import { getArea, getAreas, getNotes, getPeople, getPins, getProjects, getTasks } from "@/lib/os/data"
import { archiveArea, createProject, deleteArea, deletePin, updateArea } from "@/lib/os/actions"
import { daysBetween, fmtDate, todayISO } from "@/lib/os/dates"
import { nextUp } from "@/lib/os/focus"
import Sheet from "../../../_ui/Sheet"
import DateChip from "../../../_ui/DateChip"
import { Avatar, Card, PageHeader, Pill } from "../../../_ui/ui"
import { Swatches } from "../../../_ui/AreaForm"
import { AddTask, TaskList, ViewToggle } from "../../../_ui/Tasks"
import { Icon } from "../../../_ui/icons"
import Confirm from "../../../_ui/Confirm"
import Related from "../../../_ui/Related"
import Board from "../../board/Board"
import { getBoard } from "@/lib/os/board"

export default async function AreaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const { id } = await params
  const view = (await searchParams).view === "board" ? "board" : "list"
  const area = await getArea(id)
  if (!area) notFound()
  const today = todayISO()
  const [areas, projects, tasks, people, pins, notes] = await Promise.all([getAreas(), getProjects(id), getTasks({ areaId: id }), getPeople(), getPins(), getNotes()])
  const open = tasks.filter(t => t.status !== "done")
  const myPeople = people.filter(p => p.area_id === id)
  const myPins = pins.filter(p => p.area_id === id && p.pin_date >= today)
  const myNotes = notes.filter(n => n.area_id === id)
  const edit = (
    <Sheet label="Edit area" title="Edit area" icon="more" iconOnly>
      <form action={updateArea} className="form">
        <input type="hidden" name="id" value={id} />
        <label className="fld"><span>Name</span><input className="in" name="name" defaultValue={area.name} required aria-label="Area name" /></label>
        <Swatches value={area.color} />
        <div><button className="btn pri">Save</button></div>
      </form>
      <div className="danger-zone">
        <form action={archiveArea.bind(null, id, !area.archived)}><button className="btn sm">{area.archived ? "Restore area" : "Archive area"}</button></form>
        <Confirm action={deleteArea.bind(null, id)} label="Delete area" message="Delete this area? Its tasks, projects and people stay, but lose the link." />
      </div>
    </Sheet>
  )
  const newProject = (
    <Sheet label="New project" icon="flag">
      <form action={createProject} className="form">
        <input type="hidden" name="area_id" value={id} />
        <label className="fld"><span>Name</span><input className="in" name="name" placeholder="e.g. Step 2 prep" required aria-label="Project name" /></label>
        <DateChip label="Due" name="due_date" />
        <div><button className="btn pri">Create project</button></div>
      </form>
    </Sheet>
  )
  return (
    <>
      <PageHeader back={{ href: "/os/areas", label: "Areas" }}
        eyebrow={<span className="inline"><span className="dot" style={{ "--c": area.color, margin: 0 } as CSSProperties} />{area.archived ? "Archived area" : "Area"}</span>}
        title={area.name}
        actions={<><ViewToggle base={`/os/areas/${id}`} view={view} />{edit}</>} />
      <div className={view === "board" ? "stack" : "split"}><div className="stack">
        {view === "board" ? <Board data={await getBoard()} today={today} scope={{ areaId: id }} embedded /> : (
          <Card title="Tasks" icon="tasks" meta={open.length || undefined}>
            <AddTask areaId={id} projects={projects.filter(p => p.status === "active")} placeholder={`Add to ${area.name}. Try “… fri”`} />
            {open.length > 0 && <TaskList tasks={open} areas={areas} today={today} hideArea />}
          </Card>
        )}
        <Card title="Projects" icon="flag" meta={projects.length || undefined} actions={newProject}>
          {projects.length === 0 ? <p className="quiet-line" style={{ padding: "4px 16px 14px" }}>No projects yet. Projects have an end: a rotation, a launch, an application cycle.</p> : (
            <ul>{projects.map(p => { const pn = nextUp(open.filter(t => t.project_id === p.id)); return (
              <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row"><span className="tt">{p.name}{pn ? <small className="al-pn">{pn.title}</small> : p.status === "active" && <small className="al-pn warn">No next step</small>}</span>{p.due_date && <span className="due">{fmtDate(p.due_date)}</span>}{p.status !== "active" && <Pill gray>{p.status}</Pill>}</Link></li>
            ) })}</ul>
          )}
        </Card>
        </div><aside className="stack side-ctx">
      {myPins.length > 0 && (
        <div className="countdowns ctx-cd">
          {myPins.map(p => (
            <div key={p.id} className="cd" style={{ "--c": area.color } as CSSProperties}>
              <div className="num">{daysBetween(today, p.pin_date)}<small> days</small></div><span>{p.label}</span>
              <form action={deletePin.bind(null, p.id)}><button className="btn ghost sm" aria-label="Unpin"><Icon name="x" size={14} /></button></form>
            </div>
          ))}
        </div>
      )}
        {myPeople.length > 0 ? (
          <section className="quiet-sec"><h3>People</h3>
            <ul>{myPeople.map(p => <li key={p.id}><Link href={`/os/people/${p.id}`} className="row"><Avatar name={p.name} /><span className="tt">{p.name}</span><span className="due">{p.role}</span></Link></li>)}</ul>
          </section>
        ) : <p className="quiet-line">No people linked. Set this area on someone’s page in <Link href="/os/people">People</Link>.</p>}
        {myNotes.length > 0 && (
          <section className="quiet-sec"><h3>Notes</h3>
            <ul>{myNotes.map(n => <li key={n.id}><Link href={`/os/notes/${n.id}`} className="row"><span className="tt">{n.title}</span></Link></li>)}</ul>
          </section>
        )}
        <Related kind="area" id={id} />
      </aside></div>
    </>
  )
}
