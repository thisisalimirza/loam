import "server-only"
import postgres from "postgres"

declare global {
  var __loamSql: ReturnType<typeof postgres> | undefined
}

function make() {
  const url = process.env.LOAM_DATABASE_URL
  if (!url) throw new Error("LOAM_DATABASE_URL is missing")
  return postgres(url, {
    prepare: false, // transaction pooler
    max: 3,
    idle_timeout: 20,
    ssl: { rejectUnauthorized: false },
    types: {
      // keep `date` columns as YYYY-MM-DD strings
      date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x },
    },
  })
}

export function db() {
  globalThis.__loamSql ??= make()
  return globalThis.__loamSql
}
