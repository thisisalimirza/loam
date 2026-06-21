import Link from "next/link"
import { TagInfo } from "@/lib/getAllTags"

interface TagCloudProps {
  tags: TagInfo[]
}

const MIN_REM = 0.95
const MAX_REM = 2.15

/**
 * A text-first "word cloud" of every tag across the writing, sized by how
 * often each theme appears. Tags are shuffled deterministically so the
 * largest don't all clump together, keeping the cloud visually balanced.
 */
export default function TagCloud({ tags }: TagCloudProps) {
  if (tags.length === 0) return null

  const counts = tags.map(t => t.count)
  const min = Math.min(...counts)
  const max = Math.max(...counts)

  // Deterministic shuffle (stable across renders) so layout doesn't reorder
  // by weight — a true cloud mixes sizes.
  const ordered = [...tags].sort((a, b) => {
    const ha = hash(a.tag)
    const hb = hash(b.tag)
    return ha - hb
  })

  return (
    <div className="tag-cloud">
      {ordered.map(({ tag, count }) => {
        const t = max === min ? 1 : (count - min) / (max - min)
        const size = MIN_REM + t * (MAX_REM - MIN_REM)
        // Heavier themes read slightly darker and bolder.
        const weight = 400 + Math.round(t * 3) * 100
        const color = `color-mix(in srgb, var(--foreground) ${45 + t * 55}%, var(--muted))`
        return (
          <Link
            key={tag}
            href={`/tag/${encodeURIComponent(tag)}`}
            className="tag-cloud-item"
            style={{ fontSize: `${size.toFixed(3)}rem`, fontWeight: weight, color }}
            title={`${count} ${count === 1 ? "piece" : "pieces"}`}
          >
            {tag}
          </Link>
        )
      })}
    </div>
  )
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return h
}
