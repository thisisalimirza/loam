import type { ReactNode } from "react"
import { getNotes } from "@/lib/os/data"
import SplitAside from "../../_ui/SplitAside"
export default async function L({ children }: { children: ReactNode }) {
  const ns = await getNotes()
  return <SplitAside base="/os/notes" title="Notes" items={ns.map(n => ({ id: n.id, title: n.title }))}>{children}</SplitAside>
}
