import { createProject } from "@/lib/os/actions"
import DateChip from "./DateChip"

const TEMPLATES = [
  ["general", "Plain", "Just tasks and a due date."],
  ["research", "Research", "Steps from idea to paper."],
  ["business", "Business", "Tasks plus a few numbers to track."],
] as const

/** New project form: template first, then name, area and due date as one group. */
export default function ProjectForm({ areas, areaId }: { areas?: { id: string; name: string }[]; areaId?: string }) {
  return (
    <form action={createProject} className="form pform">
      <fieldset className="tpl" role="radiogroup" aria-label="Template">
        {TEMPLATES.map(([v, t, d], i) => (
          <label key={v} className="tpl-o"><input type="radio" name="kind" value={v} defaultChecked={i === 0} aria-label={t} /><span><strong>{t}</strong><small>{d}</small></span></label>
        ))}
      </fieldset>
      <div className="pf-g">
        <label className="pf-r"><span>Name</span><input className="in" name="name" placeholder="e.g. Step 2 prep" required aria-label="Project name" /></label>
        {areaId ? <input type="hidden" name="area_id" value={areaId} /> : areas && (
          <label className="pf-r"><span>Area</span><select className="in" name="area_id" aria-label="Area">{areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        )}
        <div className="pf-r"><span>Due</span><DateChip label="Due" name="due_date" /></div>
      </div>
      <div><button className="btn pri">Create project</button></div>
    </form>
  )
}
