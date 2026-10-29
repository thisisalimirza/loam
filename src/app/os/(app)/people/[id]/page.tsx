import { notFound } from "next/navigation"
import { getAreas, getPerson } from "@/lib/os/data"
import { deleteConversation, deletePerson, logConversation, setFollowUp, updatePerson } from "@/lib/os/actions"
import { addDays, ago, fmtDate, relDue, todayISO } from "@/lib/os/dates"
import { AreaSelect, Avatar, Card, Empty, PageHeader, Pill } from "../../../_ui/ui"
import { Icon } from "../../../_ui/icons"
import DateChip from "../../../_ui/DateChip"
import Sheet from "../../../_ui/Sheet"
import Confirm from "../../../_ui/Confirm"
import Related from "../../../_ui/Related"
import FollowUps from "../../../_ui/FollowUps"
import { extractActions } from "@/lib/os/graph"

const CH = ["In person", "Call", "Video", "Text", "Email", "DM"]

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [r, areas] = await Promise.all([getPerson(id), getAreas()])
  if (!r) notFound()
  const { person: p, convos } = r
  const today = todayISO()
  const last = convos[0]
  const area = areas.find(a => a.id === p.area_id)
  return (
    <>
      <PageHeader back={{ href: "/os/people", label: "People" }}
        title={<span className="inline" style={{ gap: 14 }}><Avatar name={p.name} lg />{p.name}</span>}
        sub={[p.role, area?.name].filter(Boolean).join(" · ") || undefined}
        actions={<><a href="#log" className="btn pri"><Icon name="plus" />Log a conversation</a>
          <Sheet label="Edit person" title={`Edit ${p.name}`} icon="more" iconOnly>
            <form action={updatePerson} className="form">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="follow_up" value={p.follow_up ?? ""} />
              <label className="fld"><span>Name</span><input className="in" name="name" defaultValue={p.name} required aria-label="Name" /></label>
              <label className="fld"><span>Who they are to you</span><input className="in" name="role" defaultValue={p.role} aria-label="Role" /></label>
              <AreaSelect areas={areas} value={p.area_id ?? undefined} />
              <textarea className="in" name="notes" rows={6} defaultValue={p.notes} placeholder="Family, interests, how you met, anything worth remembering" aria-label="Notes" />
              <div><button className="btn pri">Save</button></div>
            </form>
            <div className="danger-zone"><Confirm action={deletePerson.bind(null, p.id)} label="Delete person" message={`Delete ${p.name} and every logged conversation?`} /></div>
          </Sheet></>} />
      <div className="pgrid">
        <div className="stack">
          {last ? (
            <Card title="Last time" icon="clock" meta={`${fmtDate(last.happened_on)} · ${last.channel}`} className="recap">
              <div className="cb stack" style={{ gap: 10 }}>
                <p>{last.summary}</p>
                {last.their_update && <p><span className="meta">What they’re up to · </span>{last.their_update}</p>}
                {last.follow_ups && <p><span className="meta">Follow up on · </span>{last.follow_ups}</p>}
              </div>
            </Card>
          ) : <Card><Empty icon="people" title="No conversations yet">Log the first one below so next time you remember where you left off.</Empty></Card>}

          {last && <FollowUps personId={p.id} convoId={last.id} items={extractActions(`${last.follow_ups}\n${last.summary}`)} />}
          <Card title="Log a conversation" icon="plus" style={{ scrollMarginTop: 20 }}>
            <form id="log" action={logConversation} className="form cb">
              <input type="hidden" name="person_id" value={p.id} />
              <div className="frow">
                <DateChip label="When" name="happened_on" defaultValue={today} clearable={false} quick={[["Today", 0], ["Yesterday", -1]]} />
                <select className="in" name="channel" aria-label="Channel">{CH.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <textarea className="in" name="summary" rows={3} placeholder="What you talked about" required aria-label="Summary" />
              <textarea className="in" name="their_update" rows={2} placeholder="What they’re up to" aria-label="What they're up to" />
              <textarea className="in" name="follow_ups" rows={2} placeholder="Things to follow up on" aria-label="Follow-ups" />
              <div className="frow">
                <DateChip label="Check back" name="next_follow_up" defaultValue={addDays(today, 30)} quick={[["In 2 weeks", 14], ["In a month", 30], ["In 3 months", 91]]} />
                <span className="grow" />
                <button className="btn pri">Save</button>
              </div>
            </form>
          </Card>

          <Card title="History" icon="journal">
            {convos.length === 0 ? <div className="cb meta">Nothing logged.</div> : convos.map(c => (
              <div key={c.id} className="convo">
                <div className="inline"><b>{fmtDate(c.happened_on, { month: "short", day: "numeric", year: "numeric" })}</b><Pill gray>{c.channel}</Pill><span className="meta grow">{ago(c.happened_on, today)}</span>
                  <form action={deleteConversation.bind(null, c.id)}><button className="btn ghost sm" aria-label="Delete conversation"><Icon name="trash" size={14} /></button></form></div>
                <p>{c.summary}</p>
                {c.their_update && <p className="muted">They’re up to: {c.their_update}</p>}
                {c.follow_ups && <p className="muted">Follow up: {c.follow_ups}</p>}
              </div>
            ))}
          </Card>
        </div>
        <div className="stack">
          <Card title="Follow up" icon="clock">
            <div className="cb stack" style={{ gap: 10 }}>
              <div>{p.follow_up ? <span className={`due${p.follow_up <= today ? " warn" : ""}`} style={{ fontSize: 15 }}>{relDue(p.follow_up, today).label} · {fmtDate(p.follow_up)}</span> : <span className="meta">No date set</span>}</div>
              <div className="inline">
                {[7, 14, 30, 90].map(n => <form key={n} action={setFollowUp.bind(null, p.id, addDays(today, n))}><button className="btn sm">{n < 30 ? `${n}d` : `${n / 30}mo`}</button></form>)}
                {p.follow_up && <form action={setFollowUp.bind(null, p.id, null)}><button className="btn ghost sm">Clear</button></form>}
              </div>
            </div>
          </Card>
          {p.notes ? <section className="quiet-sec"><h3>About</h3><p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{p.notes}</p></section>
            : <p className="quiet-line">No notes on {p.name.split(" ")[0]} yet. Add family, interests or how you met from the ⋯ menu.</p>}
        </div>
      </div>
      <div style={{ marginTop: 16 }}><Related kind="person" id={p.id} /></div>
    </>
  )
}
