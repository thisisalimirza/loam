export type MIndex = { people: { id: string; name: string }[]; projects: { id: string; name: string }[] }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-")

export type Hit = { kind: "person" | "project"; id: string; name: string; start: number; end: number }

/** Finds @Person (full or first name) and #Project (name or hyphen-slug) mentions. */
export function findMentions(text: string, idx: MIndex): Hit[] {
  const keys: { k: string; kind: Hit["kind"]; id: string; name: string }[] = []
  for (const p of idx.people) {
    keys.push({ k: "@" + p.name, kind: "person", id: p.id, name: p.name })
    const first = p.name.split(/\s+/)[0]
    if (first && first !== p.name) keys.push({ k: "@" + first, kind: "person", id: p.id, name: p.name })
  }
  for (const p of idx.projects) {
    keys.push({ k: "#" + p.name, kind: "project", id: p.id, name: p.name })
    if (/\s/.test(p.name)) keys.push({ k: "#" + slug(p.name), kind: "project", id: p.id, name: p.name })
  }
  if (!keys.length || !/[@#]/.test(text)) return []
  keys.sort((a, b) => b.k.length - a.k.length)
  const re = new RegExp(`(${keys.map(k => esc(k.k)).join("|")})(?![\\p{L}\\p{N}])`, "giu")
  const out: Hit[] = []
  for (const m of text.matchAll(re)) {
    const key = keys.find(k => k.k.toLowerCase() === m[0].toLowerCase())!
    out.push({ kind: key.kind, id: key.id, name: key.name, start: m.index!, end: m.index! + m[0].length })
  }
  return out
}

