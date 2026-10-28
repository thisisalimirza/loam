import "server-only"
import { cache } from "react"
import { after } from "next/server"
import postgres from "postgres"
import { cookies, type UnsafeUnwrappedCookies } from "next/headers"

// One short-lived connection per request. A pool kept on globalThis goes stale
// when Vercel freezes the function between requests, and queries on the dead
// socket hang until the function times out.
function make() {
  const url = process.env.LOAM_DATABASE_URL
  if (!url) throw new Error("LOAM_DATABASE_URL is missing")
  // Session mode (5432). Transaction mode (6543) deadlocks when postgres.js
  // pipelines the parallel queries a page makes.
  return postgres(url.replace(":6543/", ":5432/"), {
    prepare: false,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 6,
    ssl: { rejectUnauthorized: false },
    connection: { statement_timeout: 8000 },
    types: {
      // keep `date` columns as YYYY-MM-DD strings
      date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x },
    },
  })
}

/** End-to-end runs send the loam_test cookie. Row-level security then shows
 *  them only rows flagged is_test, and everything they create gets the flag,
 *  so a test can never see, change, or delete Ali's real data. */
function testMode() {
  try { return (cookies() as unknown as UnsafeUnwrappedCookies).get("loam_test")?.value === "1" } catch { return false }
}

const perRequest = cache(() => {
  const sql = make()
  // max: 1 → one connection, queries run in order, so this lands first.
  sql.unsafe(`set role loam_app; select set_config('loam.test', '${testMode() ? "on" : "off"}', false)`).execute()
  try { after(async () => { await sql.unsafe("reset role; reset loam.test").catch(() => {}); await sql.end({ timeout: 2 }) }) } catch { /* outside a request: idle_timeout closes it */ }
  return sql
})

export function db() {
  return perRequest()
}
