import type { Task } from "./types"
/** The task most worth doing next: in progress, then soonest due, then oldest. */
export function nextUp<T extends Pick<Task, "status" | "due_date" | "sort">>(ts: T[]): T | undefined {
  return ts.filter(t => t.status !== "done")
    .sort((a, b) => (a.status === "doing" ? 0 : 1) - (b.status === "doing" ? 0 : 1) || (a.due_date ?? "9").localeCompare(b.due_date ?? "9") || a.sort - b.sort)[0]
}
