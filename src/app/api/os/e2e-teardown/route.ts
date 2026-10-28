import { NextResponse } from "next/server"
import { db } from "@/lib/os/db"
import { requireOwner } from "@/lib/os/auth"

export const dynamic = "force-dynamic"

/** Owner-only. Removes rows created by end-to-end test runs (anything prefixed "ZZT" + digits). */
export async function POST() {
  await requireOwner()
  const p = "^ZZT[0-9]"
  const out = await db().begin(async sql => {
    const tasks = await sql`delete from loam_os.tasks where title ~ ${p} or project_id in (select id from loam_os.projects where name ~ ${p}) or area_id in (select id from loam_os.areas where name ~ ${p}) returning id`
    const convos = await sql`delete from loam_os.conversations where person_id in (select id from loam_os.people where name ~ ${p}) returning id`
    const people = await sql`delete from loam_os.people where name ~ ${p} returning id`
    const notes = await sql`delete from loam_os.notes where title ~ ${p} returning id`
    const ents = await sql`select id from loam_os.journal_entries where body ~ ${p}`
    const drafts = await sql`delete from loam_os.drafts where title ~ ${p} or body ~ ${p} or source_entry_id in ${sql(ents.length ? ents.map(e => e.id) : ["00000000-0000-0000-0000-000000000000"])} returning id`
    const entries = await sql`delete from loam_os.journal_entries where body ~ ${p} returning id`
    const pins = await sql`delete from loam_os.pins where label ~ ${p} returning id`
    const projects = await sql`delete from loam_os.projects where name ~ ${p} or area_id in (select id from loam_os.areas where name ~ ${p}) returning id`
    const cols = await sql`delete from loam_os.board_columns where name ~ ${p} returning id`
    const views = await sql`delete from loam_os.board_views where name ~ ${p} returning id`
    await sql`update loam_os.people set area_id = null where area_id in (select id from loam_os.areas where name ~ ${p})`
    await sql`update loam_os.notes set area_id = null where area_id in (select id from loam_os.areas where name ~ ${p})`
    await sql`delete from loam_os.pins where area_id in (select id from loam_os.areas where name ~ ${p})`
    const areas = await sql`delete from loam_os.areas where name ~ ${p} returning id`
    const ids = [...tasks, ...people, ...notes, ...drafts, ...entries, ...projects, ...areas].map(r => r.id)
    if (ids.length) await sql`delete from loam_os.links where from_id in ${sql(ids)} or to_id in ${sql(ids)}`
    return { tasks: tasks.length, convos: convos.length, people: people.length, notes: notes.length, drafts: drafts.length, entries: entries.length, pins: pins.length, projects: projects.length, cols: cols.length, views: views.length, areas: areas.length }
  })
  return NextResponse.json(out)
}
