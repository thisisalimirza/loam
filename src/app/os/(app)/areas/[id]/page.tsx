import Link from "next/link"
import { notFound } from "next/navigation"
import type { CSSProperties } from "react"
import { getArea, getAreas, getNotes, getPeople, getPins, getProjects, getTasks } from "@/lib/os/data"
import { archiveArea, createProject, deleteArea, deletePin, updateArea } from "@/lib/os/actions"
import { daysBetween, fmtDate, todayISO } from "@/lib/os/dates"
import { Avatar, Card, Empty, PageHeader, Pill } from "../../../_ui/ui"
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
  return (
    <>
      <PageHeader back={{ href: "/os/areas", label: "Areas" }}
        eyebrow={<span className="inline"><span className="dot" style={{ "--c": area.color, margin: 0 } as CSSProperties} />{area.archived ? "Archived area" : "Area"}</span>}
        title={area.name} sub={`${open.length} open ${open.length === 1 ? "task" : "tasks"} · ${projects.filter(p => p.status === "active").length} active projects`}
        actions={<ViewToggle base={`/os/areas/${id}`} view={view} />} />
      {myPins.length > 0 && (
        <div className="countdowns">
          {myPins.map(p => (
            <div key={p.id} className="cd" style={{ "--c": area.color } as CSSProperties}>
              <div className="num">{daysBetween(today, p.pin_date)}<small>days</small></div><span>{p.label}</span>
              <form action={deletePin.bind(null, p.id)}><button className="btn ghost sm" aria-label="Unpin"><Icon name="x" size={14} /></button></form>
            </div>
          ))}
        </div>
      )}
      <div className="stack">
        {view === "board" ? <Board data={await getBoard()} today={today} scope={{ areaId: id }} embedded /> : (
          <Card title="Tasks" icon="tasks" meta={open.length}>
            <TaskList tasks={open} areas={areas} today={today} hideArea emptyTitle="No open tasks here" />
            <AddTask areaId={id} projects={projects.filter(p => p.status === "active")} />
          </Card>
        )}
        <div className="grid2">
          <Card title="Projects" icon="flag" meta={projects.length}>
            {projects.length === 0 ? <Empty icon="flag" title="No projects">Projects have an end: a rotation, a launch, an application cycle.</Empty> : (
              <ul>{projects.map(p => <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row"><span className="tt">{p.name}</span>{p.due_date && <span className="due">{fmtDate(p.due_date)}</span>}<Pill gray>{p.status}</Pill></Link></li>)}</ul>
            )}
            <form action={createProject} className="addrow">
              <input type="hidden" name="area_id" value={id} />
              <input className="in" name="name" placeholder="New project" required aria-label="Project name" />
              <button className="btn sm">Add</button>
            </form>
          </Card>
          <Card title="People" icon="people" meta={myPeople.length}>
            {myPeople.length === 0 ? <Empty icon="people" title="No one linked">Set this area on a person’s page to list them here.</Empty> : (
              <ul>{myPeople.map(p => <li key={p.id}><Link href={`/os/people/${p.id}`} className="row"><Avatar name={p.name} /><span className="tt">{p.name}</span><span className="due">{p.role}</span></Link></li>)}</ul>
            )}
          </Card>
          {myNotes.length > 0 && (
            <Card title="Notes" icon="notes" className="span">
              <ul>{myNotes.map(n => <li key={n.id}><Link href={`/os/notes/${n.id}`} className="row"><span className="tt">{n.title}</span></Link></li>)}</ul>
            </Card>
          )}
          <Related kind="area" id={id} />
          <Card title="Settings" className="span">
            <form action={updateArea} className="form cb">
              <input type="hidden" name="id" value={id} />
              <div className="frow"><input className="in" name="name" defaultValue={area.name} required aria-label="Area name" /></div>
              <Swatches value={area.color} />
              <div className="inline">
                <button className="btn pri sm">Save</button>
                <button className="btn sm" formAction={archiveArea.bind(null, id, !area.archived)}>{area.archived ? "Restore" : "Archive"}</button>
                <Confirm action={deleteArea.bind(null, id)} label="Delete area" message="Delete this area? Its tasks, projects and people stay, but lose the link." />
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}
