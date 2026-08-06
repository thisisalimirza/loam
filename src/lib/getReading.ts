import readingData from "@/data/reading.json"

export interface Highlight {
  text: string
  /** My own note on the passage, when I left one. */
  note: string | null
  date: string | null
}

export interface Source {
  slug: string
  title: string
  author: string | null
  kind: string
  category: string | null
  sourceUrl: string | null
  coverUrl: string | null
  highlightCount: number
  noteCount: number
  firstHighlightedAt: string | null
  lastHighlightedAt: string | null
  /** True for books, false for the handful of non-book sources kept. */
  shelf: boolean
  /** Marked up recently enough to still count as open. */
  open: boolean
  highlights: Highlight[]
}

export interface OpenDocument {
  title: string
  author: string | null
  url: string | null
  progress: number
  lastOpenedAt: string | null
}

export interface ReadingSnapshot {
  generatedAt: string
  stats: {
    highlights: number
    books: number
    notes: number
    byCategory: Record<string, number>
    since: string | null
  }
  books: Source[]
  beyond: Source[]
  openDocuments: OpenDocument[]
  activity: Record<string, number>
}

/**
 * Snapshot of my Readwise library, refreshed with `npm run reading:refresh`.
 */
export function getReading(): ReadingSnapshot {
  return readingData as ReadingSnapshot
}

/** Every source with a page of its own: the shelf plus what sits beside it. */
export function getAllSources(): Source[] {
  const { books, beyond } = getReading()
  return [...books, ...beyond]
}

export function getSource(slug: string): Source | undefined {
  return getAllSources().find((source) => source.slug === slug)
}
