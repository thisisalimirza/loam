"use server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireOwner } from "./auth"
import { exists, getPost, putFile, removeFile, render, validPath } from "./site"
import { todayISO } from "./dates"

export type SaveState = { error?: string; ok?: string; sha?: string } | undefined
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim()
const slugify = (t: string) => t.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80)

export async function saveSitePost(_: SaveState, f: FormData): Promise<SaveState> {
  await requireOwner()
  const title = s(f, "title"), body = String(f.get("body") ?? "")
  if (!title) return { error: "Give it a title." }
  if (!body.trim()) return { error: "The body is empty." }
  const fields = {
    title, body, summary: s(f, "summary"), date: s(f, "date") || todayISO(),
    tags: s(f, "tags").split(",").map(t => t.trim()).filter(Boolean), published: f.get("published") === "on",
  }
  const path = s(f, "path")
  try {
    if (path) {
      if (!validPath(path)) return { error: "That file path isn't valid." }
      const sha = await putFile(path, render({ ...fields, lastEdited: todayISO() }), `Update: ${title}`, s(f, "sha"))
      revalidatePath("/os/site")
      return { ok: fields.published ? "Saved. It'll be live in about a minute." : "Saved as a hidden draft.", sha }
    }
    let section = s(f, "section") === "_new" ? slugify(s(f, "new_section")) : s(f, "section")
    if (section === "_pages") section = ""
    if (s(f, "section") === "_new" && !section) return { error: "Name the new section." }
    const slug = slugify(s(f, "slug") || title)
    if (!slug) return { error: "The slug is empty." }
    const newPath = `content/${section ? section + "/" : ""}${slug}.mdx`
    if (await exists(newPath)) return { error: `Something already lives at /${section ? section + "/" : ""}${slug}. Pick another slug.` }
    await putFile(newPath, render(fields), `Add: ${title}`)
    revalidatePath("/os/site")
    redirect(`/os/site/edit?path=${encodeURIComponent(newPath)}&created=1`)
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e
    return { error: e instanceof Error ? e.message : "Couldn't save." }
  }
}

export async function deleteSitePost(path: string) {
  await requireOwner()
  const p = await getPost(path)
  if (p) await removeFile(path, p.sha, `Delete: ${p.title || path}`)
  revalidatePath("/os/site")
  redirect("/os/site?deleted=1")
}
