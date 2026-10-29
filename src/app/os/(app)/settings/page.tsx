import { getAreas, getPins, getProjects } from "@/lib/os/data"
import { pinName } from "@/lib/os/pinname"
import { createArea, deletePin, logout } from "@/lib/os/actions"
import { fmtDate } from "@/lib/os/dates"
import { aiOff } from "@/lib/os/ai"
import AiSwitch from "../../_ui/AiSwitch"
import AreaEdit from "../../_ui/AreaEdit"
import { PageHeader } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"
import Sheet from "../../_ui/Sheet"
import { Swatches } from "../../_ui/AreaForm"

export const metadata = { title: "Settings" }
export const dynamic = "force-dynamic"

export default async function Settings() {
  const [areas, pins, off, projects] = await Promise.all([getAreas(true), getPins(), aiOff(), getProjects()])
  return (
    <>
      <PageHeader title="Settings" />
      <section className="grp" aria-label="Areas">
        <div className="grp-h"><h2>Areas</h2></div>
        <ul className="card grp-l">
          {areas.map(a => <li key={a.id}><AreaEdit area={a} asRow /></li>)}
          <li><Sheet label="Add area…" title="New area" row={<><Icon name="plus" /><span className="tt" style={{ color: "var(--acc)" }}>Add area…</span></>}>
            <form action={createArea} className="form">
              <label className="fld"><span>Name</span><input className="in" name="name" placeholder="e.g. Health" required aria-label="Area name" /></label>
              <Swatches />
              <div><button className="btn pri">Create area</button></div>
            </form>
          </Sheet></li>
        </ul>
      </section>
      <section className="grp" aria-label="Pinned dates">
        <div className="grp-h"><h2>Pinned dates</h2></div>
        <ul className="card grp-l">
          {pins.map(p => (
            <li key={p.id}><Sheet label={pinName(p, projects)} row={<><span className="tt">{pinName(p, projects)}</span><small className="meta">{fmtDate(p.pin_date)}</small><Icon name="chev" className="i chev" /></>}>
              <p className="meta" style={{ margin: "0 0 12px" }}>Counts down to {fmtDate(p.pin_date)} on Today.</p>
              <form action={deletePin.bind(null, p.id)}><button className="btn" style={{ color: "var(--warn)" }} aria-label={`Unpin ${pinName(p, projects)}`}>Unpin</button></form>
            </Sheet></li>
          ))}
          {!pins.length && <li className="row meta">Pin a project deadline from Today to count down to it.</li>}
        </ul>
      </section>
      <section className="grp" aria-label="Connections">
        <div className="grp-h"><h2>Connections</h2></div>
        <ul className="card grp-l">
          <li className="row"><Icon name="xlogo" /><span className="tt">X<small className="sw-sub">{process.env.X_BEARER_TOKEN ? "Pasting links and topic search work" : "Pasting links works · Topic search not set up"}</small></span></li>
          <li className="row sw-row"><Icon name="sparkle" /><span className="tt">Suggestions<small className="sw-sub">Uses AI for names it can’t match</small></span><AiSwitch on={!off} /></li>
        </ul>
      </section>
      <section className="grp" aria-label="Account">
        <ul className="card grp-l">
          <li><form action={logout}><button className="row" style={{ width: "100%", color: "var(--warn)" }}><Icon name="logout" /><span className="tt">Sign out</span></button></form></li>
        </ul>
      </section>
    </>
  )
}
