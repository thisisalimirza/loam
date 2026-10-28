import { notFound } from "next/navigation"
import { getAreas, getProject, getTasks } from "@/lib/os/data"
import { deleteProject, setProjectStatus, updateProject } from "@/lib/os/actions"
import { nextUp } from "@/lib/os/focus"
import Sheet from "../../../_ui/Sheet"
import DateChip from "../../../_ui/DateChip"
import { fmtDate, relDue, todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../../_ui/ui"
import { AddTask, TaskList, ViewToggle } from "../../../_ui/Tasks"
import Confirm from "../../../_ui/Confirm"
import Related from "../../../_ui/Related"
import Board from "../../board/Board"
import { getBoard } from "@/lib/os/board"

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const { id } = await params
  const view = (await searchParams).view === "list" ? "list" : "board"
  const p = await getProject(id)
  if (!p) notFound()
  const today = todayISO()
  const [areas, tasks] = await Promise.all([getAreas(true), getTasks({ projectId: id })])
  const area = areas.find(a => a.id === p.area_id)
  const nx = nextUp(tasks)
  return (
    <>
      <PageHeader back={area ? { href: `/os/areas/${area.id}`, label: area.name } : { href: "/os/areas", label: "Areas" }}
        eyebrow="Project" title={p.name} sub={[p.status[0].toUpperCase() + p.status.slice(1), p.due_date && `due ${fmtDate(p.due_date)}`].filter(Boolean).join(" · ")}
        actions={<><ViewToggle base={`/os/projects/${id}`} view={view} />
          <Sheet label="Edit project" title="Edit project" icon="more" iconOnly>
            <form action={updateProject} className="form">
              <input type="hidden" name="id" value={id} />
              <label className="fld"><span>Name</span><input className="in" name="name" defaultValue={p.name} required aria-label="Project name" /></label>
              <label className="fld"><span>Area</span><select className="in" name="area_id" defaultValue={p.area_id ?? ""} aria-label="Area"><option value="">No area</option>{areas.filter(a => !a.archived || a.id === p.area_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
              <DateChip label="Due" name="due_date" defaultValue={p.due_date} />
              <div><button className="btn pri">Save</button></div>
            </form>
            <div className="danger-zone">
              {(["active", "paused", "done"] as const).filter(s => s !== p.status).map(s => (
                <form key={s} action={setProjectStatus.bind(null, id, s)}><button className="btn sm">{s === "active" ? "Reopen" : s === "paused" ? "Pause" : "Mark done"}</button></form>
              ))}
              <Confirm action={deleteProject.bind(null, id)} label="Delete project" message="Delete this project? Its tasks stay in the area." />
            </div>
          </Sheet>
        </>} />
      {nx ? (
        <section className="card focus-card" style={{ marginBottom: 16 }}><div className="fc-b">
          <span className="eyebrow" style={{ width: "100%", margin: 0 }}>Next step</span>
          <span className="fc-t">{nx.title}</span>{nx.due_date && <span className="due">{relDue(nx.due_date, today).label}</span>}
        </div></section>
      ) : p.status === "active" && <p className="quiet-line" style={{ marginBottom: 12 }}>No next step yet. What’s the very next physical action? Add it below.</p>}
      {view === "board" ? <Board data={await getBoard()} today={today} scope={{ projectId: id }} embedded /> : (
        <Card title="Tasks" icon="tasks">
          <AddTask projectId={id} areaId={p.area_id ?? undefined} placeholder="Add a step. Try “… by friday”" />
          {tasks.length > 0 && <TaskList tasks={tasks} areas={areas} today={today} hideArea />}
        </Card>
      )}
      <div style={{ marginTop: 16 }}><Related kind="project" id={id} /></div>
    </>
  )
}
