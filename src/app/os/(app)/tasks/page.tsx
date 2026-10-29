import FileTo from "../inbox/FileTo"
import { getAreas, getProjects, getTasks } from "@/lib/os/data"
import { todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"
import { redirect } from "next/navigation"
import { AddTask, TaskBoard, TaskList, ViewToggle } from "../../_ui/Tasks"

export const metadata = { title: "Tasks" }

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string; area?: string; show?: string; q?: string }> }) {
  const sp = await searchParams
  if (sp.view === "board") redirect(sp.area ? `/os/board?area=${encodeURIComponent(sp.area)}` : "/os/board")
  const view = "list" as "list" | "board"
  const today = todayISO()
  const [areas, projects, all] = await Promise.all([getAreas(), getProjects(), getTasks(sp.area === "none" ? { inbox: true } : { areaId: sp.area })])
  const showDone = sp.show === "done"
  const needle = (sp.q ?? "").trim().toLowerCase()
  const tasks = (view === "list" && !showDone ? all.filter(t => t.status !== "done") : all).filter(t => !needle || t.title.toLowerCase().includes(needle) || (t.notes ?? "").toLowerCase().includes(needle))
  const qs = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ view, area: sp.area, show: sp.show, q: sp.q, ...o }).filter(([, v]) => v) as [string, string][])
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
      <div className="bd-bar">
        <form className="bd-search sfield" action="/os/tasks" role="search"><Icon name="search" size={14} />
          {sp.area && <input type="hidden" name="area" value={sp.area} />}{sp.show && <input type="hidden" name="show" value={sp.show} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Search tasks" aria-label="Search tasks" />
        </form>
        <details className="sd-menu">
          <summary className={`btn sm${sp.area ? " on" : ""}`}><Icon name="list" size={14} />View{sp.area ? <b className="bd-n">1</b> : null}</summary>
          <div className="sd-pop" role="menu">
            <span className="pk-h">Area</span>
            {filters.map(f => <a key={f.key} role="menuitemradio" aria-checked={(sp.area ?? "all") === f.key} href={f.href}>{f.label}{(sp.area ?? "all") === f.key ? " ✓" : ""}</a>)}
            {(doneN > 0 || showDone) && <><span className="pk-h">Done</span><a role="menuitem" href={qs({ show: showDone ? undefined : "done" })}>{showDone ? "Hide done" : `Show ${doneN} done`}</a></>}
          </div>
        </details>
      </div>
      {view === "board" ? (
        <TaskBoard tasks={tasks} areas={areas} today={today} areaId={area} />
      ) : (
        <Card>
          <TaskList tasks={tasks} areas={areas} today={today} unfiledOnly={sp.area === "none"} emptyTitle={needle ? "No tasks match." : sp.area === "none" ? "Everything has an area." : "No open tasks."} />
          {sp.area === "none" && tasks.length > 0 && areas.length > 0 && <FileTo tasks={tasks.filter(t => t.status !== "done").map(t => ({ id: t.id, title: t.title }))} areas={areas.map(a => ({ id: a.id, name: a.name }))} />}
          <AddTask areas={area ? undefined : areas} areaId={area} projects={projects.filter(p => p.status === "active" && (!area || p.area_id === area))} />
          {(doneN > 0 || showDone) && <p className="list-foot"><a href={qs({ show: showDone ? undefined : "done" })}>{showDone ? "Hide done" : `Show ${doneN} done`}</a></p>}
        </Card>
      )}
    </>
  )
}
