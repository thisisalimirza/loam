import type { ReactNode } from "react"
import { getEntries } from "@/lib/os/data"
import { fmtDate } from "@/lib/os/dates"
import SplitAside from "../../_ui/SplitAside"
export default async function L({ children }: { children: ReactNode }) {
  const es = await getEntries()
  return <SplitAside base="/os/journal" title="Journal" items={es.slice(0, 60).map(e => ({ id: e.id, title: e.body.trim().split("\n")[0].slice(0, 60), sub: fmtDate(String(e.entry_date).slice(0, 10)) }))}>{children}</SplitAside>
}
