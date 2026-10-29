import type { Pin } from "./types"
const d = (v: unknown) => !v ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)
// One name per date: a pin that shares a project's due date is called by the project's name.
export function pinName(p: Pin, projects: { name: string; due_date?: unknown; area_id?: string | null }[]) {
  return projects.find(x => d(x.due_date) === d(p.pin_date) && (!p.area_id || !x.area_id || x.area_id === p.area_id))?.name ?? p.label
}
