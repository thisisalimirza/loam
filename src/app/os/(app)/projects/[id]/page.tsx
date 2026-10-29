import { notFound } from "next/navigation"
import { getAreas, getPins, getProject, getTasks } from "@/lib/os/data"
import { deletePin, deleteProject, pinDate, setProjectStatus, updateProject } from "@/lib/os/actions"
import { nextUp } from "@/lib/os/focus"
import Sheet from "../../../_ui/Sheet"
import DateChip from "../../../_ui/DateChip"
import { fmtDate, todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../../_ui/ui"
import { AddTask, TaskList, ViewToggle } from "../../../_ui/Tasks"
import Confirm from "../../../_ui/Confirm"
import Related from "../../../_ui/Related"
import Board from "../../board/Board"
import { getBoard } from "@/lib/os/board"

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const { id } = await params
  const view = (await searchParams).view === "board" ? "board" : "list"
  const p = await getProject(id)
  if (!p) notFound()
  const today = todayISO()
  const [areas, tasks, pins] = await Promise.all([getAreas(true), getTasks({ projectId: id }), getPins()])
  const pin = pins.find(x => x.pin_date >= today && (x.label.toLowerCase() === p.name.toLowerCase() || x.pin_date === p.due_date))
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
              {p.due_date && p.due_date >= today && (pin
                ? <form action={async () => { "use server"; await deletePin(pin.id) }}><button className="btn sm">Unpin countdown</button></form>
                : <form action={async () => { "use server"; await pinDate(p.name, p.due_date!, p.area_id) }}><button className="btn sm">Pin countdown</button></form>)}
              {(["active", "paused", "done"] as const).filter(s => s !== p.status).map(s => (
                <form key={s} action={setProjectStatus.bind(null, id, s)}><button className="btn sm">{s === "active" ? "Reopen" : s === "paused" ? "Pause" : "Mark done"}</button></form>
              ))}
              <Confirm action={deleteProject.bind(null, id)} label="Delete project" message="Delete this project? Its tasks stay in the area." />
            </div>
          </Sheet>
        </>} />
      {view === "board" && !nx && p.status === "active" && <p className="quiet-line" style={{ marginBottom: 12 }}>No next step yet. What’s the very next physical action? Add it below.</p>}
      {view === "board" ? <div className="in-project"><Board data={await getBoard()} today={today} scope={{ projectId: id }} embedded /></div> : (
        <Card title="Tasks" icon="tasks">
          <AddTask projectId={id} areaId={p.area_id ?? undefined} placeholder="Add a step. Try “… by friday”" />
          {tasks.length > 0 && <TaskList tasks={tasks} areas={areas} today={today} hideArea />}
        </Card>
      )}
      <div style={{ marginTop: 16 }}><Related kind="project" id={id} /></div>
    </>
  )
}
