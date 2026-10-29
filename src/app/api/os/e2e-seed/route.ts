import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/os/db"
import { requireOwner } from "@/lib/os/auth"
import { addDays, todayISO } from "@/lib/os/dates"

export const dynamic = "force-dynamic"

/** Owner-only, test-mode only. Inserts fixtures that are slow to build through the UI.
 *  Every row lands with is_test = true (column default + row-level security). */
export async function POST(req: Request) {
  await requireOwner()
  if ((await cookies()).get("loam_test")?.value !== "1") return NextResponse.json({ error: "test mode only" }, { status: 403 })
  const { kind, prefix = "ZZT" } = await req.json().catch(() => ({})) as { kind?: string; prefix?: string }
  if (kind === "review") {
    const [r] = await db()<{ id: string; is_test: boolean }[]>`insert into loam_os.learn_items (kind, title, takeaway, review_due) values ('evidence', ${prefix + " due card"}, 'Check this today', ${todayISO()}) returning id, is_test`
    if (!r.is_test) throw new Error("not a test row")
    return NextResponse.json({ id: r.id })
  }
  if (kind !== "focus") return NextResponse.json({ error: "unknown fixture" }, { status: 400 })
  const today = todayISO()
  const out = await db().begin(async sql => {
    const [a] = await sql<{ id: string }[]>`insert into loam_os.projects (name, due_date) values (${prefix + " focusA"}, ${addDays(today, 3)}) returning id`
    for (let i = 1; i <= 5; i++) await sql`insert into loam_os.tasks (title, project_id, sort) values (${`${prefix} focus step ${i}`}, ${a.id}, ${i})`
    const [b] = await sql<{ id: string }[]>`insert into loam_os.projects (name) values (${prefix + " focusB"}) returning id`
    await sql`insert into loam_os.tasks (title, project_id, due_date, sort) values (${prefix + " focus today"}, ${b.id}, ${today}, 1)`
    const [chk] = await sql<{ t: boolean }[]>`select bool_and(is_test) t from loam_os.projects where id in (${a.id}, ${b.id})`
    if (!chk.t) throw new Error("not test rows")
    return { a: a.id, b: b.id }
  })
  return NextResponse.json(out)
}
