import "server-only"
import matter from "gray-matter"

export type SiteFile = { path: string; section: string; slug: string; blob?: string }
export type SitePost = SiteFile & {
  sha: string; title: string; date: string; summary: string; tags: string[]; published: boolean; body: string; lastEdited?: string
}

function cfg() {
  const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPO
  if (!token || !repo) throw new Error("Publishing isn't configured (GitHub token or repo missing).")
  return { repo, branch: process.env.GITHUB_BRANCH ?? "main", headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" } }
}

async function gh(path: string, init?: RequestInit & { allow404?: boolean }) {
  const { headers } = cfg()
  const res = await fetch(`https://api.github.com${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(12000) })
  if (res.status === 404 && init?.allow404) return null
  if (!res.ok) {
    const msg = await res.json().then(j => j.message as string).catch(() => res.statusText)
    throw new Error(res.status === 409 ? "Someone else changed this file. Reload and try again." : `GitHub said: ${msg}`)
  }
  return res.json()
}

export const toFile = (path: string): SiteFile => {
  const parts = path.split("/")
  return parts.length === 2
    ? { path, section: "", slug: parts[1].replace(/\.mdx$/, "") }
    : { path, section: parts[1], slug: parts[2].replace(/\.mdx$/, "") }
}
export const liveUrl = (f: { section: string; slug: string }) => `/${f.section ? f.section + "/" : ""}${encodeURIComponent(f.slug)}`
export const validPath = (p: string) => /^content\/([a-z0-9-]+\/)?[^/]+\.mdx$/i.test(p) && !p.includes("..")

export async function listFiles(): Promise<{ files: SiteFile[]; sections: string[] }> {
  const { repo, branch } = cfg()
  const tree = await gh(`/repos/${repo}/git/trees/${branch}?recursive=1`)
  const blobs = (tree.tree as { path: string; type: string; sha: string }[])
  const files = blobs.filter(i => i.type === "blob" && i.path.startsWith("content/") && i.path.endsWith(".mdx") && i.path.split("/").length <= 3).map(i => ({ ...toFile(i.path), blob: i.sha }))
  const sections = blobs.filter(i => i.type === "tree" && /^content\/[^/]+$/.test(i.path)).map(i => i.path.split("/")[1]).sort()
  return { files, sections }
}

export async function getPost(path: string): Promise<SitePost | null> {
  if (!validPath(path)) return null
  const { repo, branch } = cfg()
  const d = await gh(`/repos/${repo}/contents/${encodeURI(path)}?ref=${branch}`, { allow404: true })
  if (!d) return null
  const { data, content } = matter(Buffer.from(d.content, "base64").toString("utf8"))
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? "")
  return {
    ...toFile(path), sha: d.sha, title: String(data.title ?? ""), date, summary: String(data.summary ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [], published: data.published !== false,
    lastEdited: data.lastEdited ? String(data.lastEdited) : undefined, body: content.replace(/^\n/, ""),
  }
}

// Frontmatter for the list. Blobs are addressed by content hash, so they cache forever.
export async function getMeta(files: SiteFile[]) {
  const { repo, headers } = cfg()
  const out: Record<string, { title: string; date: string; published: boolean }> = {}
  await Promise.all(files.map(async f => {
    if (!f.blob) return
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/git/blobs/${f.blob}`,
        { headers: { ...headers, Accept: "application/vnd.github.raw" }, cache: "force-cache", signal: AbortSignal.timeout(8000) })
      if (!r.ok) return
      const { data } = matter(await r.text())
      const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? "")
      out[f.path] = { title: String(data.title ?? f.slug), date, published: data.published !== false }
    } catch { /* falls back to the slug */ }
  }))
  return out
}

const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
export function render(p: { title: string; date: string; summary: string; tags: string[]; published: boolean; body: string; lastEdited?: string }) {
  return [
    "---", `title: ${q(p.title)}`, `date: ${q(p.date)}`, ...(p.lastEdited ? [`lastEdited: ${q(p.lastEdited)}`] : []),
    ...(p.summary ? [`summary: ${q(p.summary)}`] : []), ...(p.tags.length ? [`tags: [${p.tags.map(q).join(", ")}]`] : []),
    `published: ${p.published}`, "---", "", p.body.trimEnd(), "",
  ].join("\n")
}

export async function putFile(path: string, text: string, message: string, sha?: string) {
  const { repo, branch } = cfg()
  const r = await gh(`/repos/${repo}/contents/${encodeURI(path)}`, { method: "PUT", body: JSON.stringify({ message, content: Buffer.from(text).toString("base64"), branch, ...(sha ? { sha } : {}) }) })
  return r.content.sha as string
}
export async function exists(path: string) {
  const { repo, branch } = cfg()
  return !!(await gh(`/repos/${repo}/contents/${encodeURI(path)}?ref=${branch}`, { allow404: true }))
}
export async function removeFile(path: string, sha: string, message: string) {
  const { repo, branch } = cfg()
  await gh(`/repos/${repo}/contents/${encodeURI(path)}`, { method: "DELETE", body: JSON.stringify({ message, sha, branch }) })
}
