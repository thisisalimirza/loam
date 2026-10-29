import "server-only"
import { z } from "zod"
import { db } from "./db"
import { aiObject } from "./ai"
import { requireOwner } from "./auth"
import { todayISO } from "./dates"

export type Source = { url: string; title: string; author?: string }
export type LearnItem = {
  id: string; kind: "evidence" | "edge"; title: string; url: string | null; source: string; summary: string; takeaway: string
  sources: Source[]; query: string | null; review_due: string | null; review_step: number; created_at: Date
}
export const STEPS = [1, 3, 7, 21, 60]

export async function getLearn(kind?: "evidence" | "edge") {
  await requireOwner()
  const sql = db()
  return kind
    ? sql<LearnItem[]>`select id, kind, title, url, source, summary, takeaway, sources, query, review_due::text review_due, review_step, created_at from loam_os.learn_items where kind = ${kind} order by created_at desc limit 100`
    : sql<LearnItem[]>`select id, kind, title, url, source, summary, takeaway, sources, query, review_due::text review_due, review_step, created_at from loam_os.learn_items order by created_at desc limit 100`
}
export async function getDue() {
  await requireOwner()
  return db()<LearnItem[]>`select id, kind, title, url, source, summary, takeaway, sources, query, review_due::text review_due, review_step, created_at from loam_os.learn_items where review_due <= ${todayISO()} order by review_due, created_at limit 50`
}

const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "’").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim()

/** Reads a public page. Never sends anything; GET only, short timeout. */
export async function readPage(url: string): Promise<{ title: string; text: string; host: string } | null> {
  try {
    const u = new URL(url); if (!/^https?:$/.test(u.protocol)) return null
    const host = u.hostname.replace(/^www\./, "")
    if (/^(x|twitter)\.com$/.test(host)) {
      const p = await readPost(url); return p ? { title: `${p.author} on X`, text: p.text, host } : null
    }
    const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 LoamOS reader" }, signal: AbortSignal.timeout(6000), redirect: "follow" })
    if (!r.ok) return { title: host, text: "", host }
    const h = (await r.text()).slice(0, 400_000)
    const title = strip((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? "") || host
    const desc = (h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) ?? [])[1] ?? ""
    return { title: title.slice(0, 200), text: (desc + " " + strip(h)).slice(0, 12000), host }
  } catch { return null }
}

/** One public X post through X's own read-only embed endpoint. No account, nothing posted. */
export async function readPost(url: string): Promise<{ url: string; author: string; text: string } | null> {
  try {
    const r = await fetch(`https://publish.x.com/oembed?omit_script=1&url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(6000) })
    if (!r.ok) return null
    const j = await r.json() as { html?: string; author_name?: string; url?: string }
    const text = strip((j.html ?? "").replace(/<a[^>]*>(pic\.twitter\.com[^<]*)<\/a>/g, "").split("&mdash;")[0])
    return text ? { url: j.url ?? url, author: j.author_name ?? "", text } : null
  } catch { return null }
}

/** Read-only X recent search. Only runs when an X API read token is set on the server. */
export async function searchX(q: string): Promise<{ url: string; author: string; text: string }[] | null> {
  const tok = process.env.X_BEARER_TOKEN
  if (!tok) return null
  try {
    const r = await fetch(`https://api.x.com/2/tweets/search/recent?max_results=15&expansions=author_id&user.fields=username&query=${encodeURIComponent(q + " -is:retweet lang:en")}`,
      { headers: { authorization: `Bearer ${tok}` }, signal: AbortSignal.timeout(8000) })
    if (!r.ok) return []
    const j = await r.json() as { data?: { id: string; text: string; author_id: string }[]; includes?: { users?: { id: string; username: string }[] } }
    const users = new Map((j.includes?.users ?? []).map(u => [u.id, u.username]))
    return (j.data ?? []).map(t => { const u = users.get(t.author_id) ?? "i"; return { url: `https://x.com/${u}/status/${t.id}`, author: "@" + u, text: t.text } })
  } catch { return [] }
}

const one = z.object({ summary: z.string(), takeaway: z.string() })
export async function summarizeOne(title: string, text: string) {
  if (!text.trim()) return null
  return aiObject(one, "You summarize a source for a medical student's notes. Plain words, no hype. summary: two sentences on what it says, only claims the text supports. takeaway: one sentence on what to do or remember. If the text is too thin, say so in summary.",
    `Title: ${title}\n\n${text.slice(0, 10000)}`, 12000)
}

const many = z.object({ title: z.string(), points: z.array(z.object({ claim: z.string(), sources: z.array(z.number()) })).max(5), takeaway: z.string() })
/** Every point must cite at least one numbered source; uncited points are dropped. */
export async function summarizeMany(topic: string, posts: { url: string; author: string; text: string }[]) {
  if (!posts.length) return null
  const list = posts.map((p, i) => `[${i + 1}] ${p.author}: ${p.text}`).join("\n")
  const r = await aiObject(many, "You read a handful of public posts on a topic and pull out what's new or useful. Plain words, no hype. Each point lists the numbers of the posts that say it; never state anything the posts don't. Up to 5 points. title: 3-6 words.",
    `Topic: ${topic}\n\nPosts:\n${list}`, 15000)
  if (!r) return null
  const points = r.points.map(p => ({ claim: p.claim, sources: p.sources.filter(n => n >= 1 && n <= posts.length) })).filter(p => p.sources.length)
  return { title: r.title, points, takeaway: r.takeaway }
}
