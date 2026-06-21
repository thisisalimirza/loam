import { getAllContent } from "@/lib/getAllContent"

export interface TagInfo {
  /** Lowercased tag used for grouping and the URL slug */
  tag: string
  /** Number of published posts that carry this tag */
  count: number
}

/**
 * Aggregates every tag across all published content.
 * Tags are normalized to lowercase so variants ("AI" / "ai") merge.
 * Returned sorted by frequency (desc), then alphabetically.
 */
export function getAllTags(): TagInfo[] {
  const counts = new Map<string, number>()

  for (const item of getAllContent()) {
    if (item.published === false) continue
    if (!Array.isArray(item.tags)) continue
    for (const raw of item.tags) {
      if (typeof raw !== "string") continue
      const tag = raw.trim().toLowerCase()
      if (!tag) continue
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

/** All published content carrying the given (lowercased) tag, newest first. */
export function getContentByTag(tag: string) {
  const target = tag.trim().toLowerCase()
  return getAllContent()
    .filter(
      item =>
        item.published !== false &&
        Array.isArray(item.tags) &&
        item.tags.some(t => typeof t === "string" && t.toLowerCase() === target)
    )
    .sort((a, b) => {
      const dateA = a.date || ""
      const dateB = b.date || ""
      if (dateB > dateA) return 1
      if (dateA > dateB) return -1
      return 0
    })
}
