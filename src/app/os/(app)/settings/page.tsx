import Link from "next/link"
import type { CSSProperties } from "react"
import { getAreas, getPins } from "@/lib/os/data"
import { createArea, deletePin, logout } from "@/lib/os/actions"
import { fmtDate } from "@/lib/os/dates"
import { PageHeader } from "../../_ui/ui"
import { Icon } from "../../_ui/icons"
import Sheet from "../../_ui/Sheet"
import { Swatches } from "../../_ui/AreaForm"

export const metadata = { title: "Settings" }
export const dynamic = "force-dynamic"

export default async function Settings() {
  const [areas, pins] = await Promise.all([getAreas(true), getPins()])
  return (
    <>
      <PageHeader title="Settings" />
      <section className="grp" aria-label="Areas">
        <div className="grp-h"><h2>Areas</h2>
          <Sheet label="New area" icon="plus">
            <form action={createArea} className="form">
              <label className="fld"><span>Name</span><input className="in" name="name" placeholder="e.g. Health" required aria-label="Area name" /></label>
              <Swatches />
              <div><button className="btn pri">Create area</button></div>
            </form>
          </Sheet>
        </div>
        <ul className="card grp-l">
          {areas.map(a => (
            <li key={a.id}><Link href={`/os/areas/${a.id}`} className="row">
              <span className="dot" style={{ "--c": a.color } as CSSProperties} /><span className="tt">{a.name}</span>
              {a.archived && <small className="meta">Archived</small>}<Icon name="arrow" />
            </Link></li>
          ))}
          {!areas.length && <li className="row meta">No areas yet.</li>}
        </ul>
        <p className="grp-f">Rename, recolor or archive an area from its page.</p>
      </section>
      <section className="grp" aria-label="Pinned dates">
        <div className="grp-h"><h2>Pinned dates</h2></div>
        <ul className="card grp-l">
          {pins.map(p => (
            <li key={p.id} className="row"><span className="tt">{p.label}</span><small className="meta">{fmtDate(p.pin_date)}</small>
              <form action={deletePin.bind(null, p.id)}><button className="btn ghost sm" aria-label={`Unpin ${p.label}`}>Unpin</button></form></li>
          ))}
          {!pins.length && <li className="row meta">Pin a project deadline from Today to count down to it.</li>}
        </ul>
      </section>
      <section className="grp" aria-label="Connections">
        <div className="grp-h"><h2>Connections</h2></div>
        <ul className="card grp-l">
          <li><Link href="/os/site" className="row"><Icon name="globe" /><span className="tt">Website</span><Icon name="arrow" /></Link></li>
          <li className="row"><Icon name="calendar" /><span className="tt">Google Calendar</span><small className="meta">Not connected</small></li>
          <li className="row"><Icon name="sparkle" /><span className="tt">Smart suggestions</span><small className="meta">On</small></li>
        </ul>
        <p className="grp-f">Suggestions find people and dates in what you write. They run on the server and never touch the public site.</p>
      </section>
      <section className="grp" aria-label="Account">
        <ul className="card grp-l">
          <li><form action={logout}><button className="row" style={{ width: "100%", color: "var(--warn)" }}><Icon name="logout" /><span className="tt">Sign out</span></button></form></li>
        </ul>
      </section>
    </>
  )
}
