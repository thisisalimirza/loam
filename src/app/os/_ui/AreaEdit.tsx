import type { CSSProperties } from "react"
import { archiveArea, deleteArea, updateArea } from "@/lib/os/actions"
import type { Area } from "@/lib/os/types"
import Sheet from "./Sheet"
import Confirm from "./Confirm"
import { Swatches } from "./AreaForm"
import { Icon } from "./icons"

/** The one Edit area sheet: from the area page's ⋯ and from Settings → Areas. */
export default function AreaEdit({ area, asRow }: { area: Area; asRow?: boolean }) {
  return (
    <Sheet label={asRow ? area.name : "Edit area"} title="Edit area" icon="more" iconOnly={!asRow}
      row={asRow ? <><span className="dot" style={{ "--c": area.color } as CSSProperties} /><span className="tt">{area.name}</span>{area.archived && <small className="meta">Archived</small>}<Icon name="chev" className="i chev" /></> : undefined}>
      <form action={updateArea} className="form">
        <input type="hidden" name="id" value={area.id} />
        <label className="fld"><span>Name</span><input className="in" name="name" defaultValue={area.name} required aria-label="Area name" /></label>
        <Swatches value={area.color} />
        <div><button className="btn pri">Save</button></div>
      </form>
      <div className="danger-zone">
        <form action={archiveArea.bind(null, area.id, !area.archived)}><button className="dz-row">{area.archived ? "Restore area" : "Archive area"}</button></form>
        <Confirm action={deleteArea.bind(null, area.id)} label="Delete area" message="Delete this area? Its tasks, projects and people stay, but lose the link." />
      </div>
    </Sheet>
  )
}
