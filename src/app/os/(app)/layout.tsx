import { requireOwner } from "@/lib/os/auth"
import { getMentionIndex } from "@/lib/os/graph"
import Shell from "../_ui/Shell"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOwner()
  const mentions = await getMentionIndex()
  return <Shell mentions={mentions}>{children}</Shell>
}
