import { notFound } from "next/navigation"
import { getAreas, getProject, getTasks } from "@/lib/os/data"
import { deleteProject, setProjectStatus } from "@/lib/os/actions"
import { fmtDate, todayISO } from "@/lib/os/dates"
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
  return (
    <>
      <PageHeader back={area ? { href: `/os/areas/${area.id}`, label: area.name } : { href: "/os/areas", label: "Areas" }}
        eyebrow="Project" title={p.name} sub={[p.status[0].toUpperCase() + p.status.slice(1), p.due_date && `due ${fmtDate(p.due_date)}`].filter(Boolean).join(" · ")}
        actions={<>
          <ViewToggle base={`/os/projects/${id}`} view={view} />
          {(["active", "paused", "done"] as const).filter(s => s !== p.status).map(s => (
            <form key={s} action={setProjectStatus.bind(null, id, s)}><button className="btn sm">{s === "active" ? "Reopen" : s === "paused" ? "Pause" : "Mark done"}</button></form>
          ))}
          <Confirm action={deleteProject.bind(null, id)} label="Delete" message="Delete this project? Its tasks stay in the area." />
        </>} />
      {view === "board" ? <Board data={await getBoard()} today={today} scope={{ projectId: id }} embedded /> : (
        <Card title="Tasks" icon="tasks">
          <TaskList tasks={tasks} areas={areas} today={today} hideArea emptyTitle="No tasks yet" />
          <AddTask projectId={id} areaId={p.area_id ?? undefined} />
        </Card>
      )}
      <div style={{ marginTop: 16 }}><Related kind="project" id={id} /></div>
    </>
  )
}
