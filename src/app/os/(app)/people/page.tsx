import Link from "next/link"
import { getAreas, getPeople, getSuggestedPeople } from "@/lib/os/data"
import { confirmPerson, createPerson, dismissPerson, mergePerson } from "@/lib/os/actions"
import { ago, relDue, todayISO } from "@/lib/os/dates"
import { AreaSelect, Avatar, Card, PageHeader } from "../../_ui/ui"
import Sheet from "../../_ui/Sheet"

export const metadata = { title: "People" }

const SRC: Record<string, string> = { task: "?task=", note: "/os/notes/", entry: "/os/journal/" }
const SRC_LABEL: Record<string, string> = { task: "Task", note: "Note", entry: "Journal" }

export default async function People() {
  const [people, areas, suggested] = await Promise.all([getPeople(), getAreas(), getSuggestedPeople()])
  const today = todayISO()
  const merge = async (f: FormData) => { "use server"; await mergePerson(String(f.get("id")), String(f.get("into"))) }
  return (
    <>
      <PageHeader title="People"
        actions={<Sheet label="Add person" icon="plus" iconOnly>
          <form action={createPerson} className="form">
            <label className="fld"><span>Name</span><input className="in" name="name" required aria-label="Name" autoFocus /></label>
            <label className="fld"><span>Role</span><input className="in" name="role" aria-label="Role" placeholder="Mentor, classmate, friend…" /></label>
            <label className="fld"><span>Area</span><AreaSelect areas={areas} /></label>
            <div><button className="btn pri">Add</button></div>
          </form>
        </Sheet>} />
      <div className="stack">
        {people.length === 0 ? <p className="quiet-line empty-one">No one yet.</p> : <Card title="Everyone">{(
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
          )}</Card>}
        {suggested.length > 0 && (
          <section className="quiet-sec" aria-label="From your notes">
            <h2 className="sec-h">From your notes</h2>
            <ul className="sp-list">{suggested.map(s => {
              const m = s.mentions[0]
              return (
                <li key={s.id} className="sp">
                  <Avatar name={s.name} />
                  <div className="sp-b">
                    <strong>{s.name}</strong>{s.role && <small> · {s.role}</small>}
                    {m && <p className="meta">{SRC_LABEL[m.type]}: <Link href={SRC[m.type] + m.id}>{m.snippet}</Link>{s.mentions.length > 1 && ` +${s.mentions.length - 1} more`}</p>}
                  </div>
                  <div className="sp-a">
                    <form action={confirmPerson.bind(null, s.id)}><button className="btn sm pri" aria-label={`Add ${s.name}`}>Add</button></form>
                    <details className="sp-more">
                      <summary className="btn sm ghost icon-btn" aria-label={`More for ${s.name}`}>⋯</summary>
                      <div className="sp-menu">
                    {people.length > 0 && (
                      <form action={merge} className="inline">
                        <input type="hidden" name="id" value={s.id} />
                        <select className="in sm" name="into" aria-label={`${s.name} is`} defaultValue="" required>
                          <option value="" disabled>Same as…</option>
                          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button className="btn sm">Merge</button>
                      </form>
                    )}
                    <form action={dismissPerson.bind(null, s.id)}><button className="btn sm ghost" aria-label={`${s.name} is not a person`}>Not a person</button></form>
                      </div>
                    </details>
                  </div>
                </li>
              )
            })}</ul>
          </section>
        )}
      </div>
    </>
  )
}
