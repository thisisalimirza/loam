import { notFound } from "next/navigation"
import MetricValue from "../../../_ui/MetricValue"
import { getAreas, getMetrics, getPins, getProject, getTasks } from "@/lib/os/data"
import { RESEARCH_STAGES } from "@/lib/os/types"
import { addMetric, deleteMetric, setProjectStage, deletePin, deleteProject, pinDate, setProjectStatus, updateProject } from "@/lib/os/actions"
import { nextUp } from "@/lib/os/focus"
import Sheet from "../../../_ui/Sheet"
import DateChip from "../../../_ui/DateChip"
import { todayISO, leftLabel } from "@/lib/os/dates"
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
  const kind = p.kind ?? "general"
  const metrics = kind === "business" ? await getMetrics(id) : []
  const si = RESEARCH_STAGES.indexOf((p.stage ?? "Idea") as typeof RESEARCH_STAGES[number])
  const fmt = (n: number, u: string) => (u === "$" ? "$" : "") + n.toLocaleString("en-US") + (u && u !== "$" ? " " + u : "")
  const pin = pins.find(x => x.pin_date >= today && (x.label.toLowerCase() === p.name.toLowerCase() || x.pin_date === p.due_date))
  const area = areas.find(a => a.id === p.area_id)
  const nx = nextUp(tasks)
  return (
    <>
      <PageHeader back={area ? { href: `/os/areas/${area.id}`, label: area.name } : { href: "/os/areas", label: "Projects" }}
        title={p.name} sub={[p.status !== "active" && p.status[0].toUpperCase() + p.status.slice(1), p.due_date && p.status !== "done" && leftLabel(today, p.due_date)].filter(Boolean).join(" · ") || undefined}
        actions={<><ViewToggle base={`/os/projects/${id}`} view={view} />
          <Sheet label="Edit project" title="Edit project" icon="more" iconOnly>
            <form action={updateProject} className="form">
              <input type="hidden" name="id" value={id} />
              <label className="fld"><span>Name</span><input className="in" name="name" defaultValue={p.name} required aria-label="Project name" /></label>
              <label className="fld"><span>Area</span><select className="in" name="area_id" defaultValue={p.area_id ?? ""} aria-label="Area"><option value="">No area</option>{areas.filter(a => !a.archived || a.id === p.area_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
              <label className="fld"><span>Template</span><select className="in" name="kind" defaultValue={kind} aria-label="Template"><option value="general">Plain</option><option value="research">Research</option><option value="business">Business</option></select></label>
              <div className="sw-row"><span className="tt">Due</span><DateChip bare label="Due" name="due_date" defaultValue={p.due_date} /></div>
              <div><button className="btn pri">Save</button></div>
            </form>
            <div className="lbl">Status
              <div className="seg" role="group" aria-label="Status">{(["active", "paused", "done"] as const).map(s => (
                <form key={s} action={setProjectStatus.bind(null, id, s)} style={{ display: "contents" }}><button className={p.status === s ? "on" : ""} aria-pressed={p.status === s}>{s === "active" ? "Active" : s === "paused" ? "Paused" : "Done"}</button></form>
              ))}</div>
            </div>
            {p.due_date && p.due_date >= today && (
              <form action={pin ? async () => { "use server"; await deletePin(pin.id) } : async () => { "use server"; await pinDate(p.name, p.due_date!, p.area_id) }} className="sw-row">
                <span className="tt">Countdown on Today</span>
                <button role="switch" aria-checked={!!pin} aria-label="Countdown on Today" className="switch"><i /></button>
              </form>)}
            <div className="danger-zone">
              <Confirm action={deleteProject.bind(null, id)} label="Delete project" message="Delete this project? Its tasks stay in the area." />
            </div>
          </Sheet>
        </>} />
      {kind === "research" && (
        <nav className="stages" aria-label="Research stage">
          {RESEARCH_STAGES.map((st, i) => (
            <form key={st} action={setProjectStage.bind(null, id, st)}>
              <button className={i < si ? "past" : i === si ? "on" : ""} aria-pressed={i === si} aria-label={`Stage ${st}`}>{st}</button>
            </form>
          ))}
        </nav>
      )}
      {kind === "business" && (
        <section className="metrics" aria-label="Numbers">
          {metrics.map(m => (
            <div className="metric" key={m.id}>
              <span className="k">{m.label}</span>
              <div className="mv"><MetricValue id={m.id} label={m.label} value={String(m.value)} /></div>
              <span className="meta">{m.target != null ? `${fmt(m.value, m.unit)} of ${fmt(m.target, m.unit)}` : fmt(m.value, m.unit)}</span>
              {m.target ? <span className="bar"><i style={{ width: `${Math.min(100, Math.round((m.value / m.target) * 100))}%` }} /></span> : null}
              <form action={deleteMetric.bind(null, m.id)}><button className="btn ghost sm x" aria-label={`Remove ${m.label}`}>×</button></form>
            </div>
          ))}
          <form action={addMetric.bind(null, id)} className="metric add">
            <input className="in" name="label" placeholder="Number to track" aria-label="Number to track" required />
            <input className="in" name="target" placeholder="Goal" aria-label="Goal" inputMode="decimal" />
            <button className="btn sm">Add</button>
          </form>
        </section>
      )}
      {view === "board" && !nx && p.status === "active" && <p className="quiet-line" style={{ marginBottom: 12 }}>No next step yet.</p>}
      {view === "board" ? <div className="in-project"><Board data={await getBoard()} today={today} scope={{ projectId: id }} embedded /></div> : (
        <Card title="Tasks" icon="tasks">
          <TaskList tasks={tasks} areas={areas} today={today} hideArea emptyTitle="No next step yet." />
          <AddTask projectId={id} areaId={p.area_id ?? undefined} />
        </Card>
      )}
      <div style={{ marginTop: 16 }}><Related kind="project" id={id} /></div>
    </>
  )
}
