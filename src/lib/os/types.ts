export type Area = { id: string; name: string; color: string; archived: boolean; sort: number }
export type Project = { id: string; area_id: string | null; name: string; status: "active" | "paused" | "done"; due_date: string | null }
export type TaskStatus = "todo" | "doing" | "done"
export type Task = {
  id: string; title: string; notes: string; status: TaskStatus
  area_id: string | null; project_id: string | null
  due_date: string | null; scheduled_date: string | null; sort: number
  repeat: "daily" | "weekdays" | "weekly" | "monthly" | "yearly" | null
}
export type Person = { id: string; name: string; role: string; area_id: string | null; notes: string; follow_up: string | null }
export type Conversation = {
  id: string; person_id: string; happened_on: string; channel: string
  summary: string; their_update: string; follow_ups: string
}
export type Note = { id: string; title: string; body: string; area_id: string | null; project_id: string | null; updated_at: Date }
export type Entry = { id: string; entry_date: string; body: string; updated_at: Date }
export type Channel = "Substack" | "X" | "LinkedIn" | "Newsletter"
export type Stage = "idea" | "drafting" | "ready" | "published"
export type Draft = {
  id: string; title: string; body: string; channel: Channel; stage: Stage
  url: string | null; published_at: string | null; source_entry_id: string | null; sort: number; updated_at: Date
}
export type Pin = { id: string; label: string; pin_date: string; area_id: string | null }

export const CHANNELS: Channel[] = ["Substack", "X", "LinkedIn", "Newsletter"]
export const STAGES: { id: Stage; label: string }[] = [
  { id: "idea", label: "Idea" }, { id: "drafting", label: "Drafting" },
  { id: "ready", label: "Ready" }, { id: "published", label: "Published" },
]
export const TASK_COLS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" }, { id: "doing", label: "In progress" }, { id: "done", label: "Done" },
]
export const AREA_COLORS = ["#4f5bd5", "#3b82f6", "#10a37f", "#e0653a", "#d9443b", "#a855f7", "#0ea5e9", "#ca8a04", "#64748b"]
