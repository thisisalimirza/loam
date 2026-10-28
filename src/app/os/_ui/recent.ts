"use client"
/** Small local memory of what was recently opened, so pickers never start empty. */
const KEY = "loam.recent"
type R = { kind: string; id: string; at: number }
export function remember(kind: string, id: string) {
  try { const l: R[] = JSON.parse(localStorage.getItem(KEY) || "[]").filter((r: R) => !(r.kind === kind && r.id === id)); l.unshift({ kind, id, at: Date.now() }); localStorage.setItem(KEY, JSON.stringify(l.slice(0, 60))) } catch {}
}
export function recent(kind: string): string[] {
  try { return (JSON.parse(localStorage.getItem(KEY) || "[]") as R[]).filter(r => r.kind === kind).map(r => r.id) } catch { return [] }
}
