import readingData from "@/data/reading.json"

export interface ReadingItem {
  title: string
  author: string | null
  kind: string
  url: string | null
  progress: number | null
  highlightCount: number | null
  lastTouchedAt: string | null
}

export interface RecentSource {
  title: string
  author: string | null
  kind: string
  url: string | null
  highlightCount: number
  lastHighlightedAt: string
}

export interface Marginalia {
  note: string
  passage: string
  title: string
  author: string | null
  kind: string
  url: string | null
  date: string | null
}

export interface ShelfItem {
  title: string
  author: string | null
  url: string | null
  highlightCount: number
  noteCount: number
  lastHighlightedAt: string
}

export interface ReadingSnapshot {
  generatedAt: string
  stats: {
    highlights: number
    books: number
    sources: number
    notes: number
    byCategory: Record<string, number>
    since: string | null
  }
  currentlyReading: ReadingItem[]
  lately: RecentSource[]
  marginalia: Marginalia[]
  shelf: ShelfItem[]
  activity: Record<string, number>
}

/**
 * Snapshot of my Readwise library, refreshed with `npm run reading:refresh`.
 */
export function getReading(): ReadingSnapshot {
  return readingData as ReadingSnapshot
}
