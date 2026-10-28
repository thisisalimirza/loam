import { Suspense } from "react"
import { getBoard } from "@/lib/os/board"
import { todayISO } from "@/lib/os/dates"
import { PageHeader } from "../../_ui/ui"
import Board from "./Board"

export const metadata = { title: "Board" }

export default async function BoardPage() {
  const data = await getBoard()
  return (
    <>
      <PageHeader eyebrow="All work" title="Board" sub="Every task across areas and projects. Press ? for shortcuts." />
      <Suspense><Board data={data} today={todayISO()} /></Suspense>
    </>
  )
}
