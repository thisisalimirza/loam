"use client"
import { useState, useTransition, type CSSProperties } from "react"
import { createStarterAreas } from "@/lib/os/actions"

const STARTERS = [
  { name: "Medical school", color: "#d9443b", hint: "Clerkships, exams, research, applications", projects: ["Current clerkship", "Shelf exam prep", "Step 2 CK", "Research poster", "ERAS application"] },
  { name: "Rounds", color: "#4f5bd5", hint: "The product you run", projects: ["Next release", "Growth experiments", "Support inbox"] },
  { name: "Writing & audience", color: "#a855f7", hint: "LinkedIn, X, Substack, newsletter", projects: ["Weekly newsletter", "LinkedIn posts", "Substack essay"] },
  { name: "Ideas", color: "#ca8a04", hint: "New businesses and side bets", projects: ["Validate the next idea"] },
  { name: "Staying current", color: "#10a37f", hint: "Journals, guidelines, what changes practice", projects: ["Weekly reading"] },
]

/** Guided empty state. Nothing is created until he presses the button, and only what's ticked. */
export default function StarterAreas() {
  const [on, setOn] = useState<Record<string, string[]>>({})
  const [pending, start] = useTransition()
  const toggleArea = (n: string, ps: string[]) => setOn(o => { const c = { ...o }; if (c[n]) delete c[n]; else c[n] = ps.slice(0, 2); return c })
  const toggleP = (n: string, p: string) => setOn(o => ({ ...o, [n]: o[n].includes(p) ? o[n].filter(x => x !== p) : [...o[n], p] }))
  const count = Object.keys(on).length
  return (
    <section className="card starter">
      <div className="cb stack" style={{ gap: 6 }}>
        <h2>Set up your areas</h2>
        <p className="meta">Areas are the parts of life that don’t end. Pick the ones that fit, and the first projects you want under each. You can rename or delete anything later.</p>
      </div>
      <ul className="st-list">
        {STARTERS.map(s => {
          const sel = on[s.name]
          return (
            <li key={s.name} className={sel ? "on" : ""}>
              <label className="st-head">
                <input type="checkbox" checked={!!sel} onChange={() => toggleArea(s.name, s.projects)} />
                <span className="dot" style={{ "--c": s.color, margin: 0 } as CSSProperties} />
                <span className="st-t"><strong>{s.name}</strong><small>{s.hint}</small></span>
              </label>
              {sel && (
                <div className="st-ps" role="group" aria-label={`Projects for ${s.name}`}>
                  {s.projects.map(p => (
                    <button key={p} type="button" className={`chip${sel.includes(p) ? " on" : ""}`} aria-pressed={sel.includes(p)} onClick={() => toggleP(s.name, p)}>{p}</button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <div className="cb inline" style={{ justifyContent: "flex-end" }}>
        <button className="btn pri" disabled={!count || pending} onClick={() => start(() => createStarterAreas(STARTERS.filter(s => on[s.name]).map(s => ({ name: s.name, color: s.color, projects: on[s.name] }))))}>
          {pending ? "Creating…" : count ? `Create ${count} ${count === 1 ? "area" : "areas"}` : "Pick at least one"}
        </button>
      </div>
    </section>
  )
}
