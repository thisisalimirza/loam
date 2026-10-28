"use client"
import { useRouter } from "next/navigation"
import Kanban from "../../_ui/Kanban"
import { moveDraft } from "@/lib/os/actions"
import type { Stage } from "@/lib/os/types"

type D = { id: string; col: string; sort: number; title: string; body: string; channel: string; url: string | null }
const COLS = [{ id: "idea", label: "Idea" }, { id: "drafting", label: "Drafting" }, { id: "ready", label: "Ready" }, { id: "scheduled", label: "Scheduled" }, { id: "published", label: "Published" }]

export default function DraftBoard({ drafts }: { drafts: D[] }) {
  const router = useRouter()
  return (
    <Kanban cols={COLS} items={drafts}
      onOpen={d => router.push(`/os/drafts/${d.id}`)}
      onMove={(id, col, sort) => {
        const d = drafts.find(x => x.id === id)
        let url: string | null = null
        if (col === "published" && d && !d.url) url = window.prompt("Where did it go live? Paste the URL (optional)")?.trim() || null
        moveDraft(id, col as Stage, sort, url)
      }}
      render={d => (
        <>
          <div className="tt">{d.title || d.body.split("\n")[0] || "Untitled"}</div>
          <div className="inline meta" style={{ marginTop: 6 }}>
            <span className="pill gray">{d.channel}</span>
            {d.url && <a href={d.url} target="_blank" rel="noreferrer" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>Live ↗</a>}
          </div>
        </>
      )} />
  )
}
