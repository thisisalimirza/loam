"use client"
/** Small local memory of what was recently opened, so pickers never start empty. */
const KEY = "loam.recent"
export type Recent = { kind: string; id: string; title?: string; at: number; n?: number }
function all(): Recent[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]") } catch { return [] } }
export function remember(kind: string, id: string, title?: string) {
  try {
    const l = all(); const old = l.find(r => r.kind === kind && r.id === id)
    const rest = l.filter(r => r !== old)
    rest.unshift({ kind, id, title: title ?? old?.title, at: Date.now(), n: (old?.n ?? 0) + 1 })
    localStorage.setItem(KEY, JSON.stringify(rest.slice(0, 80)))
  } catch {}
}
export function recent(kind: string): string[] { return all().filter(r => r.kind === kind).map(r => r.id) }
export function recentItems(n = 6): Recent[] { return all().filter(r => r.title).slice(0, n) }
/** ids ordered by how often they were used */
export function frequent(kind: string): string[] { return all().filter(r => r.kind === kind).sort((a, b) => (b.n ?? 0) - (a.n ?? 0)).map(r => r.id) }
