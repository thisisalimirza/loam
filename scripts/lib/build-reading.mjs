/**
 * Turns raw Readwise data into the snapshot that /reading renders.
 *
 * The shape is a library: every source that earned a shelf spot, each carrying
 * its own highlights, so a book page is a slice of this file rather than a
 * separate fetch.
 *
 * Kept free of network calls so the same transform runs over a live API pull
 * (scripts/fetch-reading.mjs) and over a saved raw dump.
 */

const DAY = 24 * 60 * 60 * 1000

// Readwise ships a demo book to every new account. It is not reading.
const EXCLUDED_TITLES = [/^how to use readwise/i, /^quick passages$/i]

// Notes doubling as Readwise commands (.h1, .c1, .starred) or as bare filing
// verbs are tags, not thoughts.
const TAG_NOTE = /^(\.\w+|save|saved|todo|read|note|important|quote)$/i

// Readwise's stand-in when a book has no real jacket.
const PLACEHOLDER_COVER = /default-book-icon/

// Library EZproxy rewrites hosts as `example-com.proxy.school.edu`, doubling any
// real hyphen. Those links are dead outside the campus login and put the
// institution in the byline, so they get decoded back to the public host.
const PROXY_SUFFIXES = [".online.uchc.edu"]

const CATEGORY_LABELS = {
  books: "book",
  articles: "article",
  podcasts: "podcast",
  tweets: "thread",
  supplementals: "supplemental",
}

const HTML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
}

const clean = (value) => (typeof value === "string" ? value.trim() : "")

const decodeEntities = (text) =>
  text
    .replace(/&(?:amp|lt|gt|quot|nbsp|#39|#x27);/g, (match) => HTML_ENTITIES[match] ?? match)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))

const isExcluded = (title) =>
  !title || EXCLUDED_TITLES.some((pattern) => pattern.test(title))

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

/** Readwise pads exports with markdown artifacts and inline image embeds. */
const tidyHighlight = (text) =>
  decodeEntities(clean(text))
    .replace(/!\[\]\(\S+\)/g, "")
    .replace(/\*\*/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

const dayKey = (iso) => (iso ? iso.slice(0, 10) : null)

// Kindle exports open with the front matter, and highlighting on a phone leaves
// clipped fragments behind. Neither is worth a slot on the page — unless I
// bothered to write a note on it.
const FRONT_MATTER = /title page.*copyright|table of contents/is

function isJunk(text) {
  if (FRONT_MATTER.test(text.slice(0, 200))) return true
  if (text.length < 15) return true
  if (text.length < 30 && text.endsWith("…")) return true
  return false
}

const isRealNote = (note) => Boolean(note) && note.length > 2 && !TAG_NOTE.test(note)

function slugify(title) {
  return (
    decodeEntities(title)
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "untitled"
  )
}

/** Groups highlights under the source they came from. */
function buildLibrary(highlights) {
  const sources = new Map()

  for (const highlight of highlights) {
    const title = decodeEntities(clean(highlight.book_title))
    if (isExcluded(title)) continue

    const text = tidyHighlight(highlight.text)
    const note = decodeEntities(clean(highlight.note))
    const kept = isRealNote(note)
    if (!text || (isJunk(text) && !kept)) continue

    const key = highlight.book_id ?? title
    let source = sources.get(key)
    if (!source) {
      const cover = clean(highlight.book_cover_image_url)
      source = {
        id: key,
        title,
        author: decodeEntities(unproxy(highlight.book_author)) || null,
        category: highlight.book_category || null,
        kind: CATEGORY_LABELS[highlight.book_category] || "source",
        sourceUrl: unproxy(highlight.book_source_url) || null,
        coverUrl: cover && !PLACEHOLDER_COVER.test(cover) ? cover : null,
        highlights: [],
        seen: new Set(),
      }
      sources.set(key, source)
    }

    // Re-imports and edits leave the same passage in twice.
    const fingerprint = text.slice(0, 120)
    if (source.seen.has(fingerprint)) continue
    source.seen.add(fingerprint)

    source.highlights.push({
      id: highlight.id,
      // Readwise orders by location within a book; ids fall back to import order.
      order: highlight.location ?? highlight.id ?? 0,
      text: truncate(text, 1500),
      note: isRealNote(note) ? truncate(note, 800) : null,
      date: highlight.highlighted_at ?? null,
    })
  }

  return [...sources.values()].map((source) => {
    const dates = source.highlights.map((highlight) => highlight.date).filter(Boolean).sort()

    return {
      slug: slugify(source.title),
      title: source.title,
      author: source.author,
      kind: source.kind,
      category: source.category,
      sourceUrl: source.sourceUrl,
      coverUrl: source.coverUrl,
      highlightCount: source.highlights.length,
      noteCount: source.highlights.filter((highlight) => highlight.note).length,
      firstHighlightedAt: dates[0] ?? null,
      lastHighlightedAt: dates[dates.length - 1] ?? null,
      highlights: source.highlights
        .sort((a, b) => (a.order > b.order ? 1 : a.order < b.order ? -1 : 0))
        .map(({ text, note, date }) => ({ text, note, date })),
    }
  })
}

/** Two books can share a title; slugs cannot. */
function uniqueSlugs(sources) {
  const taken = new Map()

  for (const source of sources) {
    const count = taken.get(source.slug) ?? 0
    taken.set(source.slug, count + 1)
    if (count > 0) source.slug = `${source.slug}-${count + 1}`
  }

  return sources
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

export function buildReadingSnapshot({
  highlights = [],
  readerDocs = [],
  now = new Date(),
  openDays = 180,
  beyondLimit = 12,
  activityDays = 365,
} = {}) {
  const usable = highlights.filter((highlight) => !isExcluded(clean(highlight.book_title)))
  const library = uniqueSlugs(buildLibrary(usable))
  const openCutoff = new Date(now.getTime() - openDays * DAY).toISOString()

  const books = library
    .filter((source) => source.category === "books")
    .sort((a, b) => (b.lastHighlightedAt ?? "").localeCompare(a.lastHighlightedAt ?? ""))
    .map((source) => ({
      ...source,
      shelf: true,
      // Marked up recently, and marked up enough to rule out a skim.
      open:
        source.highlightCount >= 3 &&
        Boolean(source.lastHighlightedAt) &&
        source.lastHighlightedAt > openCutoff,
    }))

  // Everything else runs to hundreds of podcast episodes; only the sources
  // worth a page of their own get one.
  const beyond = library
    .filter((source) => source.category !== "books" && source.highlightCount >= 8)
    .sort((a, b) => b.highlightCount - a.highlightCount)
    .slice(0, beyondLimit)
    .map((source) => ({ ...source, shelf: false, open: false }))

  const byCategory = {}
  for (const highlight of usable) {
    const key = highlight.book_category || "other"
    byCategory[key] = (byCategory[key] ?? 0) + 1
  }

  const dates = usable.map((highlight) => highlight.highlighted_at).filter(Boolean).sort()

  // Reader progress is patchy, but a part-read document still says something
  // about what is open right now.
  const openDocuments = readerDocs
    .filter((doc) => {
      const progress = doc.reading_progress ?? 0
      const touched = doc.last_opened_at || doc.saved_at
      return progress >= 0.05 && progress < 0.9 && touched && touched > openCutoff
    })
    .map((doc) => ({
      title: decodeEntities(clean(doc.title)),
      author: clean(doc.author) || clean(doc.site_name) || null,
      url: doc.url || null,
      progress: Math.round((doc.reading_progress ?? 0) * 100),
      lastOpenedAt: doc.last_opened_at || doc.saved_at || null,
    }))
    .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? ""))

  return {
    generatedAt: now.toISOString(),
    stats: {
      highlights: usable.length,
      books: books.length,
      notes: usable.filter((highlight) => isRealNote(clean(highlight.note))).length,
      byCategory,
      since: dates[0] ?? null,
    },
    books,
    beyond,
    openDocuments,
    activity: activity(usable, now, activityDays),
  }
}
