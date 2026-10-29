import Link from "next/link"
import { notFound } from "next/navigation"
import { getArea, getAreas, getNotes, getPeople, getProjects, getTasks } from "@/lib/os/data"
import { todayISO, leftLabel } from "@/lib/os/dates"
import { nextUp } from "@/lib/os/focus"
import ProjectForm from "../../../_ui/ProjectForm"
import Sheet from "../../../_ui/Sheet"
import { Avatar, Card, PageHeader, Pill } from "../../../_ui/ui"
import AreaEdit from "../../../_ui/AreaEdit"
import { AddTask, TaskList, ViewToggle } from "../../../_ui/Tasks"
import Related from "../../../_ui/Related"
import Board from "../../board/Board"
import { getBoard } from "@/lib/os/board"

export default async function AreaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const { id } = await params
  const view = (await searchParams).view === "board" ? "board" : "list"
  const area = await getArea(id)
  if (!area) notFound()
  const today = todayISO()
  const [areas, projects, tasks, people, notes] = await Promise.all([getAreas(), getProjects(id), getTasks({ areaId: id }), getPeople(), getNotes()])
  const open = tasks.filter(t => t.status !== "done")
  const myPeople = people.filter(p => p.area_id === id)
  const myNotes = notes.filter(n => n.area_id === id)
  const edit = <AreaEdit area={area} />
  const newProject = (
    <Sheet label="New project" icon="plus" iconOnly>
      <ProjectForm areaId={id} />
    </Sheet>
  )
  return (
    <>
      <PageHeader back={{ href: "/os/areas", label: "Projects" }}
        eyebrow={area.archived ? "Archived" : undefined}
        title={area.name}
        actions={<><ViewToggle base={`/os/areas/${id}`} view={view} />{edit}</>} />
      <div className={view === "board" ? "stack" : "split"}><div className="stack">
        {view === "board" ? <Board data={await getBoard()} today={today} scope={{ areaId: id }} embedded /> : (
          <Card title="Tasks" icon="tasks">
            <TaskList tasks={open} areas={areas} today={today} hideArea emptyTitle="No open tasks." />
            <AddTask areaId={id} projects={projects.filter(p => p.status === "active")} />
          </Card>
        )}
        <Card title="Projects" icon="flag" actions={newProject}>
          {projects.length === 0 ? <p className="quiet-line" style={{ padding: "4px 16px 14px" }}>No projects yet. Projects have an end: a rotation, a launch, an application cycle.</p> : (
            <ul>{projects.map(p => { const pn = nextUp(open.filter(t => t.project_id === p.id)); return (
              <li key={p.id}><Link href={`/os/projects/${p.id}`} className="row"><span className="tt">{p.name}{!pn && p.status === "active" && <small className="al-pn warn">No next step</small>}</span>{p.due_date && <span className={`due${p.due_date < today ? " warn" : ""}`}>{leftLabel(today, p.due_date)}</span>}{p.status !== "active" && <Pill gray>{p.status}</Pill>}</Link></li>
            ) })}</ul>
          )}
        </Card>
        </div><aside className="stack side-ctx">
        {myPeople.length > 0 && (
          <section className="quiet-sec"><h3>People</h3>
            <ul>{myPeople.map(p => <li key={p.id}><Link href={`/os/people/${p.id}`} className="row"><Avatar name={p.name} /><span className="tt">{p.name}</span><span className="due">{p.role}</span></Link></li>)}</ul>
          </section>
        )}
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
