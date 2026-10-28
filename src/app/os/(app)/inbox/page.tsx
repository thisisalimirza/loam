import { getAreas, getTasks } from "@/lib/os/data"
import { todayISO } from "@/lib/os/dates"
import { Card, PageHeader } from "../../_ui/ui"
import { AddTask, TaskList } from "../../_ui/Tasks"
import FileTo from "./FileTo"

export const metadata = { title: "Inbox" }

export default async function Inbox() {
  const [areas, tasks] = await Promise.all([getAreas(), getTasks({ inbox: true, openOnly: true })])
  return (
    <>
      <PageHeader title="Inbox" sub="Everything captured without a home. File it into an area or just get it done." />
      <Card title="Unfiled" icon="inbox" meta={`${tasks.length}`}>
        <TaskList tasks={tasks} areas={areas} today={todayISO()} emptyTitle="Nothing to sort" emptyText="Anything you add with ⌘K and don’t give an area shows up here." />
        {tasks.length > 0 && areas.length > 0 && <FileTo tasks={tasks.map(t => ({ id: t.id, title: t.title }))} areas={areas.map(a => ({ id: a.id, name: a.name }))} />}
        <AddTask />
      </Card>
    </>
  )
}
