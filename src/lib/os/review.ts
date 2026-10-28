import "server-only"
import { db } from "./db"
import { requireOwner } from "./auth"
import { addDays } from "./dates"

export async function getWeek(today: string) {
  await requireOwner()
  const sql = db(); const from = addDays(today, -6), next = addDays(today, 7)
  const [done, overdue, upcoming, stuck, quiet, words, published] = await Promise.all([
    sql<{ id: string; title: string }[]>`select id, title from loam_os.tasks where status = 'done' and done_at >= ${from}::date order by done_at desc limit 50`,
    sql<{ id: string; title: string; due_date: string }[]>`select id, title, due_date::text from loam_os.tasks where status <> 'done' and archived_at is null and due_date < ${today}::date order by due_date limit 20`,
    sql<{ id: string; title: string; due_date: string }[]>`select id, title, due_date::text from loam_os.tasks where status <> 'done' and archived_at is null and due_date between ${today}::date and ${next}::date order by due_date limit 20`,
    sql<{ id: string; name: string }[]>`select p.id, p.name from loam_os.projects p where p.status = 'active' and not exists (select 1 from loam_os.tasks t where t.project_id = p.id and t.status <> 'done') order by p.name`,
    sql<{ id: string; name: string; last_on: string | null }[]>`select p.id, p.name, max(c.happened_on)::text last_on from loam_os.people p left join loam_os.conversations c on c.person_id = p.id where p.status = 'active' group by p.id, p.name having max(c.happened_on) is null or max(c.happened_on) < ${addDays(today, -30)}::date order by max(c.happened_on) nulls first limit 8`,
    sql<{ n: number; days: number }[]>`select coalesce(sum(array_length(regexp_split_to_array(trim(body), '\\s+'), 1)), 0)::int n, count(*)::int days from loam_os.journal_entries where entry_date >= ${from}::date and length(trim(body)) > 0`,
    sql<{ n: number }[]>`select count(*)::int n from loam_os.drafts where stage = 'published' and updated_at >= ${from}::date`,
  ])
  return { from, done, overdue, upcoming, stuck, quiet, words: words[0], published: published[0].n }
}
