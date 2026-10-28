import { getAreas, getProjects, getTasks } from "@/lib/os/data"
import { todayISO } from "@/lib/os/dates"
import { Card, PageHeader, Seg } from "../../_ui/ui"
import { AddTask, TaskBoard, TaskList, ViewToggle } from "../../_ui/Tasks"

export const metadata = { title: "Tasks" }

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string; area?: string; show?: string }> }) {
  const sp = await searchParams
  const view = sp.view === "board" ? "board" : "list"
  const today = todayISO()
  const [areas, projects, all] = await Promise.all([getAreas(), getProjects(), getTasks({ areaId: sp.area })])
  const showDone = sp.show === "done"
  const tasks = view === "list" && !showDone ? all.filter(t => t.status !== "done") : all
  const qs = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ view, area: sp.area, show: sp.show, ...o }).filter(([, v]) => v) as [string, string][])
    return `/os/tasks${p.size ? "?" + p : ""}`
  }
  const filters = [{ key: "all", label: "All", href: qs({ area: undefined }) }, ...areas.map(a => ({ key: a.id, label: a.name, href: qs({ area: a.id }) }))]
  const base = qs({ view: undefined })
  return (
    <>
      <PageHeader title="Tasks" sub={`${all.filter(t => t.status !== "done").length} open`} actions={<ViewToggle base={base} view={view} />} />
      {areas.length > 0 && <div style={{ marginBottom: 14 }}><Seg items={filters} active={sp.area ?? "all"} /></div>}
      {view === "board" ? (
        <TaskBoard tasks={tasks} areas={areas} today={today} areaId={sp.area} />
      ) : (
        <Card title={showDone ? "All tasks" : "Open"} icon="tasks" meta={<a href={qs({ show: showDone ? undefined : "done" })}>{showDone ? "Hide done" : "Show done"}</a>}>
          <TaskList tasks={tasks} areas={areas} today={today} emptyTitle="No open tasks" emptyText="Add one below, or press ⌘K from anywhere." />
          <AddTask areas={sp.area ? undefined : areas} areaId={sp.area} projects={projects.filter(p => p.status === "active" && (!sp.area || p.area_id === sp.area))} />
        </Card>
      )}
    </>
  )
}
