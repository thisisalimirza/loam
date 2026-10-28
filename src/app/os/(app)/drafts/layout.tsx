import type { ReactNode } from "react"
import { getDrafts } from "@/lib/os/data"
import SplitAside from "../../_ui/SplitAside"
export default async function L({ children }: { children: ReactNode }) {
  const ds = await getDrafts()
  return <SplitAside base="/os/drafts" title="Drafts" items={ds.map(d => ({ id: d.id, title: d.title, sub: d.channel }))}>{children}</SplitAside>
}
