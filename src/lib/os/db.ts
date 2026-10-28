import "server-only"
import { cache } from "react"
import { after } from "next/server"
import postgres from "postgres"
import { AsyncLocalStorage } from "node:async_hooks"
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
    idle_timeout: 60, // must outlive slow background work: a reconnect would drop the role and test mode
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

type Job = () => unknown | Promise<unknown>
const perRequest = cache(() => {
  const sql = make() as ReturnType<typeof make> & { jobs: Job[]; mode: string }
  sql.jobs = []
  // max: 1 → one connection, queries run in order, so this lands first.
  const mode = `set role loam_app; select set_config('loam.test', '${testMode() ? "on" : "off"}', false)`
  sql.mode = mode
  sql.unsafe(mode).execute()
  // Background work (later()) runs first, on this same connection and mode; only then is it closed.
  try { after(async () => { for (let j; (j = sql.jobs.shift());) { try { await j() } catch (e) { console.error("later", e) } } await sql.unsafe("reset role; reset loam.test").catch(() => {}); await sql.end({ timeout: 2 }) }) } catch { /* outside a request: idle_timeout closes it */ }
  return sql
})

// Inside a later() job, db() is pinned to the connection (and test/real mode) of the request that queued it.
const pinned = new AsyncLocalStorage<ReturnType<typeof perRequest>>()

export function db() {
  return pinned.getStore() ?? perRequest()
}

/** Run work after the response, before this request's connection closes, in the same test/real mode.
 *  Use this instead of next/server after() for anything that touches the database. */
export function later(fn: Job) {
  const sql = db()
  sql.jobs.push(async () => { await sql.unsafe(sql.mode); return pinned.run(sql, fn) })  // re-assert mode in case the socket reconnected
}
