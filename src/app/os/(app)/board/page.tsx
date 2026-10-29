import { Suspense } from "react"
import { getBoard } from "@/lib/os/board"
import { todayISO } from "@/lib/os/dates"
import { PageHeader } from "../../_ui/ui"
import { ViewToggle } from "../../_ui/Tasks"
import Board from "./Board"

export const metadata = { title: "Board" }

export default async function BoardPage() {
  const data = await getBoard()
  return (
    <>
      <PageHeader title="Tasks" actions={<ViewToggle base="/os/tasks" view="board" />} />
      <Suspense><Board data={data} today={todayISO()} /></Suspense>
    </>
  )
}
