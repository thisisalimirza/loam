import { requireOwner } from "@/lib/os/auth"
import { countInbox, getAreas } from "@/lib/os/data"
import Shell from "../_ui/Shell"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOwner()
  const [areas, inbox] = await Promise.all([getAreas(), countInbox()])
  return <Shell areas={areas.map(a => ({ id: a.id, name: a.name, color: a.color }))} inbox={inbox}>{children}</Shell>
}
