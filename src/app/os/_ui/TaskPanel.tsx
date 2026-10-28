"use client"
import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { BoardData, BoardTask } from "@/lib/os/board"
import { bData, bMove } from "@/lib/os/boardActions"
import PanelBoundary from "./PanelBoundary"
import Drawer from "../(app)/board/Drawer"

/** The one task detail. Any page opens it with ?task=<id>: side panel on wide screens, sheet on phones. */
export default function TaskPanel({ today }: { today: string }) {
  const sp = useSearchParams(), path = usePathname(), router = useRouter()
  const id = sp.get("task")
  const [data, setData] = useState<BoardData | null>(null)
  const [tasks, setTasks] = useState<BoardTask[]>([])
  const [deps, setDeps] = useState<BoardData["deps"]>([])
  useEffect(() => {
    if (!id) return
    let live = true
    bData().then(r => { if (live && r.ok) { setData(r.data); setTasks(r.data.tasks); setDeps(r.data.deps) } })
    return () => { live = false }
  }, [id])
  if (!id || !data || path.startsWith("/os/board")) return null
  const t = tasks.find(x => x.id === id)
  if (!t) return null
  const setId = (n: string | null) => {
    const q = new URLSearchParams(sp.toString()); if (n) q.set("task", n); else q.delete("task")
    router.replace(`${path}${q.size ? "?" + q : ""}`, { scroll: false })
    if (!n) router.refresh()
  }
  return (
    <PanelBoundary key={t.id} onClose={() => setId(null)}><Drawer key={t.id} task={t} data={data} cols={data.columns} tasks={tasks} deps={deps} today={today}
      onClose={() => setId(null)} onOpen={setId}
      onChange={n => setTasks(ts => ts.map(x => x.id === n.id ? n : x))} onDeps={setDeps}
      onMove={async colId => { await bMove(t.id, colId, Date.now() / -1000); setTasks(ts => ts.map(x => x.id === t.id ? { ...x, column_id: colId } : x)) }}
      onDeleted={() => { setTasks(ts => ts.filter(x => x.id !== t.id)); setId(null) }} /></PanelBoundary>
  )
}
