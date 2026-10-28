import type { ReactNode } from "react"
import { getPeople } from "@/lib/os/data"
import SplitAside from "../../_ui/SplitAside"
export default async function L({ children }: { children: ReactNode }) {
  const ps = await getPeople()
  return <SplitAside base="/os/people" title="People" items={ps.map(p => ({ id: p.id, title: p.name, sub: p.role ?? undefined }))}>{children}</SplitAside>
}
