/**
 * Turns raw Readwise data into the snapshot that /reading renders.
 *
 * Kept free of network calls so the same transform runs over a live API pull
 * (scripts/fetch-reading.mjs) and over a saved raw dump.
 */

const DAY = 24 * 60 * 60 * 1000

// Readwise ships a demo book to every new account. It is not reading.
const EXCLUDED_TITLES = [/^how to use readwise/i]

// Highlight notes doubling as Readwise commands (.h1, .c1, .starred) or as
// bare filing verbs are tags, not thoughts.
const TAG_NOTE = /^(\.\w+|save|saved|todo|read|note|important|quote)$/i

const CATEGORY_LABELS = {
  books: "book",
  articles: "article",
  podcasts: "podcast",
  tweets: "tweet",
  supplementals: "supplemental",
}

const isExcluded = (title) =>
  !title || EXCLUDED_TITLES.some((pattern) => pattern.test(title))

// Library EZproxy rewrites hosts as `example-com.proxy.school.edu`, doubling any
// real hyphen. Those links are dead outside the campus login and put the
// institution in the byline, so they get decoded back to the public host.
const PROXY_SUFFIXES = [".online.uchc.edu"]

const clean = (value) => (typeof value === "string" ? value.trim() : "")

function decodeProxyHost(host) {
  const suffix = PROXY_SUFFIXES.find((candidate) => host.endsWith(candidate))
  if (!suffix) return host

  // A doubled hyphen is a literal hyphen; a single one stands in for a dot.
  return host.slice(0, -suffix.length).replace(/--|-/g, (match) => (match === "--" ? "-" : "."))
}

function unproxy(value) {
  const text = clean(value)
  if (!text) return ""

  // Bare hostnames show up as bylines; full URLs as source links.
  if (!text.includes("/")) return decodeProxyHost(text)

  try {
    const url = new URL(text)
    url.hostname = decodeProxyHost(url.hostname)
    return url.toString()
  } catch {
    return text
  }
}

const truncate = (text, max) =>
  text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, "")}…`

/** Readwise pads Kindle exports with markdown artifacts and image embeds. */
const tidyHighlight = (text) =>
  clean(text)
    .replace(/!\[\]\(\S+\)/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim()

const dayKey = (iso) => (iso ? iso.slice(0, 10) : null)

function groupByBook(highlights) {
  const books = new Map()

  for (const highlight of highlights) {
    const title = clean(highlight.book_title)
    if (isExcluded(title)) continue

    const key = highlight.book_id ?? title
    let book = books.get(key)
    if (!book) {
      book = {
        id: key,
        title,
        author: unproxy(highlight.book_author) || null,
        category: highlight.book_category || null,
        sourceUrl: unproxy(highlight.book_source_url) || null,
        count: 0,
        noteCount: 0,
        firstHighlightedAt: null,
        lastHighlightedAt: null,
      }
      books.set(key, book)
    }

    book.count += 1
    if (clean(highlight.note)) book.noteCount += 1

    const at = highlight.highlighted_at
    if (at) {
      if (!book.firstHighlightedAt || at < book.firstHighlightedAt) book.firstHighlightedAt = at
      if (!book.lastHighlightedAt || at > book.lastHighlightedAt) book.lastHighlightedAt = at
    }
  }

  return [...books.values()]
}

/**
 * A book counts as open if it has been marked up recently and marked up enough
 * to rule out a one-line skim.
 */
function currentlyReading(books, readerDocs, now) {
  const cutoff = new Date(now.getTime() - 180 * DAY).toISOString()

  const openBooks = books
    .filter(
      (book) =>
        book.category === "books" &&
        book.count >= 3 &&
        book.lastHighlightedAt &&
        book.lastHighlightedAt > cutoff,
    )
    .map((book) => ({
      title: book.title,
      author: book.author,
      kind: "book",
      url: book.sourceUrl,
      progress: null,
      highlightCount: book.count,
      lastTouchedAt: book.lastHighlightedAt,
    }))

  const openDocs = readerDocs
    .filter((doc) => {
      const progress = doc.reading_progress ?? 0
      const touched = doc.last_opened_at || doc.saved_at
      return (
        progress >= 0.05 &&
        progress < 0.9 &&
        !isExcluded(doc.title) &&
        touched &&
        touched > cutoff
      )
    })
    .map((doc) => ({
      title: clean(doc.title),
      author: clean(doc.author) || clean(doc.site_name) || null,
      kind: CATEGORY_LABELS[`${doc.category}s`] || doc.category || "article",
      url: doc.url || null,
      progress: Math.round((doc.reading_progress ?? 0) * 100),
      highlightCount: null,
      lastTouchedAt: doc.last_opened_at || doc.saved_at || null,
    }))

  return [...openBooks, ...openDocs].sort((a, b) =>
    (b.lastTouchedAt ?? "").localeCompare(a.lastTouchedAt ?? ""),
  )
}

/** The thinking layer: highlights carrying a note of my own. */
function marginalia(highlights, limit) {
  return highlights
    .filter((highlight) => {
      const note = clean(highlight.note)
      return (
        note.length > 25 &&
        !TAG_NOTE.test(note) &&
        !isExcluded(highlight.book_title) &&
        clean(highlight.text)
      )
    })
    .sort((a, b) => (b.highlighted_at ?? "").localeCompare(a.highlighted_at ?? ""))
    .slice(0, limit)
    .map((highlight) => ({
      note: truncate(clean(highlight.note), 600),
      passage: truncate(tidyHighlight(highlight.text), 420),
      title: clean(highlight.book_title),
      author: unproxy(highlight.book_author) || null,
      kind: CATEGORY_LABELS[highlight.book_category] || "note",
      url: unproxy(highlight.book_source_url) || null,
      date: highlight.highlighted_at ?? null,
    }))
}

/** Daily highlight counts for the activity strip. */
function activity(highlights, now, days) {
  const cutoff = dayKey(new Date(now.getTime() - days * DAY).toISOString())
  const counts = {}

  for (const highlight of highlights) {
    const day = dayKey(highlight.highlighted_at)
    if (!day || day < cutoff) continue
    counts[day] = (counts[day] ?? 0) + 1
  }

  return counts
}

/**
 * Everything marked up lately, whatever the medium — the honest picture of what
 * is going in, which for most weeks is podcasts and articles rather than books.
 */
function recentSources(books, openTitles, now, days, limit) {
  const cutoff = new Date(now.getTime() - days * DAY).toISOString()

  return books
    .filter(
      (book) =>
        book.lastHighlightedAt &&
        book.lastHighlightedAt > cutoff &&
        book.count >= 2 &&
        !openTitles.has(book.title),
    )
    .sort((a, b) => b.lastHighlightedAt.localeCompare(a.lastHighlightedAt))
    .slice(0, limit)
    .map((book) => ({
      title: book.title,
      author: book.author,
      kind: CATEGORY_LABELS[book.category] || "note",
      url: book.sourceUrl,
      highlightCount: book.count,
      lastHighlightedAt: book.lastHighlightedAt,
    }))
}

/**
 * Everything already read, newest markup first. Dates are when a book was last
 * marked up — for bulk Kindle imports that is the import date, not a finish
 * date, so the page labels this honestly.
 */
function shelf(books, openTitles, limit) {
  return books
    .filter(
      (book) =>
        book.category === "books" &&
        book.count >= 5 &&
        book.lastHighlightedAt &&
        !openTitles.has(book.title),
    )
    .sort((a, b) => b.lastHighlightedAt.localeCompare(a.lastHighlightedAt))
    .slice(0, limit)
    .map((book) => ({
      title: book.title,
      author: book.author,
      url: book.sourceUrl,
      highlightCount: book.count,
      noteCount: book.noteCount,
      lastHighlightedAt: book.lastHighlightedAt,
    }))
}

export function buildReadingSnapshot({
  highlights = [],
  readerDocs = [],
  now = new Date(),
  marginaliaLimit = 18,
  shelfLimit = 40,
  recentLimit = 20,
  recentDays = 120,
  activityDays = 365,
} = {}) {
  const usable = highlights.filter((highlight) => !isExcluded(highlight.book_title))
  const books = groupByBook(usable)

  const reading = currentlyReading(books, readerDocs, now)
  const openTitles = new Set(reading.map((item) => item.title))

  const byCategory = {}
  for (const highlight of usable) {
    const key = highlight.book_category || "other"
    byCategory[key] = (byCategory[key] ?? 0) + 1
  }

  const dates = usable.map((highlight) => highlight.highlighted_at).filter(Boolean).sort()

  return {
    generatedAt: now.toISOString(),
    stats: {
      highlights: usable.length,
      books: books.filter((book) => book.category === "books").length,
      sources: books.length,
      notes: usable.filter((highlight) => clean(highlight.note) && !TAG_NOTE.test(clean(highlight.note))).length,
      byCategory,
      since: dates[0] ?? null,
    },
    currentlyReading: reading,
    lately: recentSources(books, openTitles, now, recentDays, recentLimit),
    marginalia: marginalia(usable, marginaliaLimit),
    shelf: shelf(books, openTitles, shelfLimit),
    activity: activity(usable, now, activityDays),
  }
}
