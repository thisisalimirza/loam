import Link from "next/link"
import { getRelated, type RelItem } from "@/lib/os/graph"
import { Card } from "./ui"

const GROUPS: [keyof Awaited<ReturnType<typeof getRelated>>, string][] = [
  ["tasks", "Tasks"], ["people", "People"], ["projects", "Projects"], ["notes", "Notes"], ["entries", "Journal"], ["drafts", "Drafts"],
]

/** "Connected" card: what other parts of the OS point at this thing. Renders nothing when empty. */
export default async function Related({ kind, id, title = "Connected" }: { kind: Parameters<typeof getRelated>[0]; id: string; title?: string }) {
  const r = await getRelated(kind, id).catch(e => { console.error("related failed", kind, e?.message); return null })
  if (!r) return null
  const groups = GROUPS.filter(([k]) => r[k].length > 0)
  if (!groups.length) return null
  return (
    <Card title={title} icon="link" className="span">
      <div className="rel">
        {groups.map(([k, label]) => (
          <div key={k}>
            <h4>{label}</h4>
            {(r[k] as RelItem[]).map(i => <Link key={i.id} href={i.href}><span>{i.title}</span>{i.meta && <small>{i.meta}</small>}</Link>)}
          </div>
        ))}
      </div>
    </Card>
  )
}
