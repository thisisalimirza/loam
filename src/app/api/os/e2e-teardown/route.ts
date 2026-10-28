import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/os/db"
import { requireOwner } from "@/lib/os/auth"

export const dynamic = "force-dynamic"

const TABLES = ["links", "mentions", "task_activity", "task_deps", "task_links", "conversations", "tasks", "drafts", "notes", "journal_entries", "pins", "people", "board_columns", "board_views", "projects", "areas"]

/** Owner-only, test-mode only. Deletes rows flagged is_test, nothing else.
 *  Row-level security already hides real rows in test mode; the explicit
 *  filter is a second lock. */
export async function POST() {
  await requireOwner()
  if ((await cookies()).get("loam_test")?.value !== "1") return NextResponse.json({ error: "test mode only" }, { status: 403 })
  const out: Record<string, number | string> = {}
  const [who] = await db()`select current_user u, current_setting('loam.test', true) t`
  out.who = `${who.u}/${who.t}`
  await db().begin(async sql => {
    for (const t of TABLES) {
      const r = await sql`delete from ${sql("loam_os." + t)} where is_test returning 1`
      if (r.length) out[t] = r.length
    }
  })
  return NextResponse.json(out)
}
