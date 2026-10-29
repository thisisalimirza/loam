import "server-only"
import { db } from "./db"
import { addDays, todayISO } from "./dates"

export type Nudge = { key: string; href: string; text: string; icon: "learn" | "send" | "journal" | "chart" }

/** Small notes from the other parts of the OS. Each one has to point at something you can do; at most 3. */
export async function getNudges(): Promise<Nudge[]> {
  const today = todayISO(), sql = db()
  const [[r]] = await Promise.all([sql<{ due: number; ready: number; next_out: string | null; last_out: string | null; last_entry: string | null; stale_metric: string | null; stale_project: string | null }[]>`
    select
      (select count(*)::int from loam_os.learn_items where review_due <= ${today}) due,
      (select count(*)::int from loam_os.drafts where stage = 'ready') ready,
      (select min(scheduled_for)::date::text from loam_os.drafts where stage <> 'published' and scheduled_for::date >= ${today}) next_out,
      (select max(published_at)::text from loam_os.drafts where stage = 'published') last_out,
      (select max(entry_date)::text from loam_os.journal_entries where length(trim(body)) > 0) last_entry,
      (select m.label from loam_os.project_metrics m join loam_os.projects p on p.id = m.project_id where p.status = 'active' and m.updated_at < now() - interval '7 days' order by m.updated_at limit 1) stale_metric,
      (select m.project_id::text from loam_os.project_metrics m join loam_os.projects p on p.id = m.project_id where p.status = 'active' and m.updated_at < now() - interval '7 days' order by m.updated_at limit 1) stale_project`])
  const out: Nudge[] = []
  if (r.due) out.push({ key: "learn", href: "/os/learn?tab=review", icon: "learn", text: `${r.due} ${r.due === 1 ? "thing" : "things"} to review in Learn` })
  if (r.ready && (!r.next_out || r.next_out > addDays(today, 7))) out.push({ key: "drafts", href: "/os/schedule", icon: "send", text: `${r.ready} ${r.ready === 1 ? "draft is" : "drafts are"} ready but nothing goes out this week` })
  if (r.stale_metric && r.stale_project) out.push({ key: "metric", href: `/os/projects/${r.stale_project}`, icon: "chart", text: `${r.stale_metric} hasn’t been updated in a week` })
  if (r.last_entry && r.last_entry < addDays(today, -3)) out.push({ key: "journal", href: "/os/journal/write", icon: "journal", text: "No journal in a few days. Five minutes is enough." })
  return out.slice(0, 3)
}
