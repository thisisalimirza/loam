"use client"
import { updateTask } from "@/lib/os/actions"

export default function FileTo({ tasks, areas }: { tasks: { id: string; title: string }[]; areas: { id: string; name: string }[] }) {
  return (
    <form className="addrow" action={async f => {
      const id = String(f.get("id")), t = tasks.find(x => x.id === id)
      if (!t) return
      const g = new FormData(); g.set("id", id); g.set("title", t.title); g.set("area_id", String(f.get("area_id") ?? ""))
      await updateTask(g)
    }}>
      <select className="in" name="id" aria-label="Task" style={{ flex: "2 1 180px" }}>{tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
      <select className="in" name="area_id" aria-label="Area">{areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <button className="btn sm">File</button>
    </form>
  )
}
