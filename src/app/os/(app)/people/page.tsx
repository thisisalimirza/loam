import Link from "next/link"
import { getAreas, getPeople } from "@/lib/os/data"
import { createPerson } from "@/lib/os/actions"
import { ago, relDue, todayISO } from "@/lib/os/dates"
import { AreaSelect, Avatar, Card, Empty, PageHeader } from "../../_ui/ui"

export const metadata = { title: "People" }

export default async function People() {
  const [people, areas] = await Promise.all([getPeople(), getAreas()])
  const today = todayISO()
  return (
    <>
      <PageHeader title="People" sub="Who you talk to, what they said, when to check back." />
      <div className="stack">
        <Card title="Add someone" icon="plus">
          <form action={createPerson} className="frow cb">
            <input className="in" name="name" placeholder="Name" required aria-label="Name" />
            <input className="in" name="role" placeholder="Who they are to you" aria-label="Role" />
            <AreaSelect areas={areas} />
            <button className="btn pri">Add</button>
          </form>
        </Card>
        <Card meta={people.length} title="Everyone" icon="people">
          {people.length === 0 ? <Empty icon="people" title="No one yet">Add a mentor, a friend, a collaborator. Log what you talk about.</Empty> : (
            <ul>{people.map(p => {
              const due = p.follow_up && p.follow_up <= today
              return (
                <li key={p.id}><Link href={`/os/people/${p.id}`} className="row" style={{ minHeight: 60 }}>
                  <Avatar name={p.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tt">{p.name}</div>
                    <div className="meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.last_summary ? `${ago(p.last_on!, today)}: ${p.last_summary}` : p.role || "No conversations logged"}</div>
                  </div>
                  {p.follow_up && <span className={`due${due ? " warn" : ""}`}>{relDue(p.follow_up, today).label}</span>}
                </Link></li>
              )
            })}</ul>
          )}
        </Card>
      </div>
    </>
  )
}
