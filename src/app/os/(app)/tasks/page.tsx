import FileTo from "../inbox/FileTo"
import { getAreas, getProjects, getTasks } from "@/lib/os/data"
import { todayISO } from "@/lib/os/dates"
import { Card, PageHeader, Seg } from "../../_ui/ui"
import { redirect } from "next/navigation"
import { AddTask, TaskBoard, TaskList, ViewToggle } from "../../_ui/Tasks"

export const metadata = { title: "Tasks" }

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string; area?: string; show?: string }> }) {
  const sp = await searchParams
  if (sp.view === "board") redirect(sp.area ? `/os/board?area=${encodeURIComponent(sp.area)}` : "/os/board")
  const view = "list" as "list" | "board"
  const today = todayISO()
  const [areas, projects, all] = await Promise.all([getAreas(), getProjects(), getTasks(sp.area === "none" ? { inbox: true } : { areaId: sp.area })])
  const showDone = sp.show === "done"
  const tasks = view === "list" && !showDone ? all.filter(t => t.status !== "done") : all
  const qs = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ view, area: sp.area, show: sp.show, ...o }).filter(([, v]) => v) as [string, string][])
    return `/os/tasks${p.size ? "?" + p : ""}`
  }
  const unsorted = sp.area === "none" ? all.filter(t => t.status !== "done").length : (await getTasks({ inbox: true, openOnly: true })).length
  const filters = [{ key: "all", label: "All", href: qs({ area: undefined }) }, ...areas.map(a => ({ key: a.id, label: a.name, href: qs({ area: a.id }) })), ...(unsorted || sp.area === "none" ? [{ key: "none", label: "No area", href: qs({ area: "none" }) }] : [])]
  const doneN = all.filter(t => t.status === "done").length
  const area = sp.area === "none" ? undefined : sp.area
  const base = qs({ view: undefined })
  return (
    <>
      <PageHeader title="Tasks" actions={<ViewToggle base={base} view={view} />} />
      {areas.length > 0 && <div style={{ marginBottom: 14 }}><Seg items={filters} active={sp.area ?? "all"} /></div>}
      {view === "board" ? (
        <TaskBoard tasks={tasks} areas={areas} today={today} areaId={area} />
      ) : (
        <Card>
          <TaskList tasks={tasks} areas={areas} today={today} unfiledOnly={sp.area === "none"} emptyTitle={sp.area === "none" ? "Everything has an area." : "No open tasks."} />
          {sp.area === "none" && tasks.length > 0 && areas.length > 0 && <FileTo tasks={tasks.filter(t => t.status !== "done").map(t => ({ id: t.id, title: t.title }))} areas={areas.map(a => ({ id: a.id, name: a.name }))} />}
          <AddTask areas={area ? undefined : areas} areaId={area} projects={projects.filter(p => p.status === "active" && (!area || p.area_id === area))} />
          {(doneN > 0 || showDone) && <p className="list-foot"><a href={qs({ show: showDone ? undefined : "done" })}>{showDone ? "Hide done" : `Show ${doneN} done`}</a></p>}
        </Card>
      )}
    </>
  )
}
