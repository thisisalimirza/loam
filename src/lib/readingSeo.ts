import { getAllSources, type Source } from "@/lib/getReading"
import { getAllContent } from "@/lib/getAllContent"
import type { ContentItem } from "@/types"

/**
 * A source page carries weight in search only if there's something on it. Below
 * this many highlights the page is kept for humans but withheld from the index,
 * so a handful of stubs can't drag the whole /reading folder down with them.
 */
export const THIN_HIGHLIGHT_THRESHOLD = 5

/** How many distinctive terms to surface as a book's themes. */
const THEME_COUNT = 6

/**
 * A wider slice of the same ranking, used only to decide which sources are
 * related. Six terms almost never overlap between two books; this many do.
 */
const THEME_MATCH_DEPTH = 30

const STOPWORDS = new Set(
  `a about above after again against all also am an and any are aren as at be because been before being
   below between both but by can cannot could couldn did didn do does doesn doing don down during each few
   for from further had hadn has hasn have haven having he her here hers herself him himself his how i if
   in into is isn it its itself just ll me more most mustn my myself no nor not now of off on once only or
   other ought our ours ourselves out over own re s same shan she should shouldn so some such t than that
   the their theirs them themselves then there these they this those through to too under until up ve very
   was wasn we were weren what when where which while who whom why will with won would wouldn you your
   yours yourself yourselves get got make makes made go goes going come comes came take takes taken want
   wants need needs know knows knew think thinks thought say says said see sees seen look looks looking
   thing things way ways time times year years day days one two three first second next last much many
   even still back new old good better best great little long own right well like as us let us don t
   something someone anything everything nothing people person really actually always never often
   sometimes every another around because before being able why how what when where who
   used using use uses find finds found give gives given put puts keep keeps kept work works working
   help helps helped start starts started end ends ended try tries tried tell tells told ask asks asked
   feel feels felt seem seems seemed become becomes became leave leaves left move moves moved turn turns
   part parts kind sort lot lots bit far away back down out up over off through`
    .split(/\s+/)
    .filter(Boolean)
)

/**
 * Book themes are matched against the site's own tag vocabulary so a reader who
 * arrived on a quotes page has somewhere relevant to go next. Keys are matched
 * as substrings against the book's title, category and extracted themes.
 */
const TOPIC_MAP: Array<{ match: string[]; tags: string[] }> = [
  { match: ["habit", "discipline", "routine", "productiv", "essential", "focus"], tags: ["discipline", "productivity", "habits"] },
  { match: ["medicine", "medical", "physician", "patient", "doctor", "health", "clinic", "disease"], tags: ["medicine", "health", "society"] },
  { match: ["philosoph", "stoic", "existential", "virtue", "meaning", "moral", "ethic", "wisdom"], tags: ["philosophy", "stoicism", "classics", "morality"] },
  { match: ["propaganda", "persuas", "rhetoric", "influence", "narrative", "story", "copywrit", "advertis"], tags: ["communication", "society", "writing"] },
  { match: ["ai", "artificial", "technolog", "machine", "digital", "computer", "software", "algorithm"], tags: ["technology", "AI"] },
  { match: ["business", "sales", "offer", "market", "startup", "customer", "entrepreneur", "company"], tags: ["business", "startups"] },
  { match: ["wealth", "money", "rich", "financ", "invest", "capital"], tags: ["wealth", "money"] },
  { match: ["classic", "greek", "roman", "ancient", "history", "empire"], tags: ["classics", "history", "Greek"] },
  { match: ["writing", "write", "word", "language", "read"], tags: ["writing", "communication"] },
  { match: ["society", "politic", "culture", "public", "civil"], tags: ["society", "politics"] },
]

interface SourceIndexEntry {
  source: Source
  /** The slug search engines should treat as authoritative for this title. */
  canonicalSlug: string
  /** True when a richer page exists for the same title. */
  isDuplicate: boolean
  /** Too few highlights to stand on its own in the index. */
  isThin: boolean
  /** Distinctive terms, by TF-IDF against the rest of the library. */
  themes: string[]
  /** The same ranking, deeper, for relatedness scoring only. */
  themeSet: Set<string>
  /** Site tags this source plausibly speaks to. */
  topicTags: string[]
}

/**
 * Readwise titles arrive carrying artefacts of the file they came from —
 * underscores where a colon belongs, and the odd publisher tacked on the end.
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/\s*_\s*/g, ": ")
    .replace(/\s*-\s*(Author Academy Elite)\s*$/i, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([:,])/g, "$1")
    .trim()
}

/**
 * The part of a title worth putting in a `<title>` tag or a heading — the book's
 * actual name, without the subtitle that publishers bolt on.
 */
export function shortTitle(title: string): string {
  const clean = cleanTitle(title)
    // Podcast feeds tack the episode number on with a pipe.
    .replace(/\s*\|\s*Ep\.?\s*\d+\s*$/i, "")
    // …and the show name in brackets, which the byline already covers.
    .replace(/\s*\([^)]{12,}\)\s*$/, "")
    .trim()

  const head = clean.split(/\s*[:–—|]\s*/)[0].trim()
  return head.length >= 12 && head.length < clean.length ? head : clean
}

const WORD = /[a-z][a-z'-]{2,}/g

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(WORD) ?? [])
    .map(w => w.replace(/^'+|'+$/g, ""))
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
}

/** Words already in the title or byline aren't themes — they're the label. */
function identityWords(source: Source): Set<string> {
  return new Set(tokenize(`${source.title} ${source.author ?? ""}`))
}

let cachedIndex: Map<string, SourceIndexEntry> | null = null

function buildIndex(): Map<string, SourceIndexEntry> {
  const sources = getAllSources()

  // --- Term frequencies per source, and document frequency across the library.
  const termFreqs = new Map<string, Map<string, number>>()
  const docFreq = new Map<string, number>()

  for (const source of sources) {
    const own = identityWords(source)
    const freq = new Map<string, number>()
    for (const highlight of source.highlights) {
      for (const word of tokenize(highlight.text)) {
        if (own.has(word)) continue
        freq.set(word, (freq.get(word) ?? 0) + 1)
      }
    }
    termFreqs.set(source.slug, freq)
    for (const term of freq.keys()) docFreq.set(term, (docFreq.get(term) ?? 0) + 1)
  }

  const total = sources.length

  // --- Fold duplicate titles onto a single canonical slug.
  // Keyed on the shortened title, so two exports of one source still collapse
  // when one of them carries an episode number or the show name in brackets.
  const byTitle = new Map<string, Source[]>()
  for (const source of sources) {
    const key = shortTitle(source.title).toLowerCase().replace(/[^a-z0-9]/g, "")
    if (!byTitle.has(key)) byTitle.set(key, [])
    byTitle.get(key)!.push(source)
  }

  const canonicalFor = new Map<string, string>()
  for (const group of byTitle.values()) {
    // Richest page wins; ties go to the cleaner slug (no trailing -2).
    const primary = [...group].sort(
      (a, b) =>
        b.highlightCount - a.highlightCount ||
        Number(/-\d+$/.test(a.slug)) - Number(/-\d+$/.test(b.slug)) ||
        a.slug.length - b.slug.length
    )[0]
    for (const source of group) canonicalFor.set(source.slug, primary.slug)
  }

  const index = new Map<string, SourceIndexEntry>()

  for (const source of sources) {
    const freq = termFreqs.get(source.slug)!
    const ranked = [...freq.entries()]
      // A term seen once is noise; require it to actually recur.
      .filter(([, count]) => count >= 2)
      .map(([term, count]) => ({ term, score: count * Math.log(total / (docFreq.get(term) ?? 1)) }))
      .sort((a, b) => b.score - a.score)

    const themes = ranked.slice(0, THEME_COUNT).map(t => t.term)
    const themeSet = new Set(ranked.slice(0, THEME_MATCH_DEPTH).map(t => t.term))

    const haystack = `${source.title} ${source.category ?? ""} ${themes.join(" ")}`.toLowerCase()
    const topicTags = [
      ...new Set(
        TOPIC_MAP.filter(entry => entry.match.some(m => haystack.includes(m))).flatMap(e => e.tags)
      ),
    ]

    const canonicalSlug = canonicalFor.get(source.slug) ?? source.slug

    index.set(source.slug, {
      source,
      canonicalSlug,
      isDuplicate: canonicalSlug !== source.slug,
      isThin: source.highlightCount < THIN_HIGHLIGHT_THRESHOLD,
      themes,
      themeSet,
      topicTags,
    })
  }

  return index
}

function getIndex(): Map<string, SourceIndexEntry> {
  if (!cachedIndex) cachedIndex = buildIndex()
  return cachedIndex
}

export function getSourceMeta(slug: string): SourceIndexEntry | undefined {
  return getIndex().get(slug)
}

/** Sources fit to be indexed: not a duplicate, not a stub. */
export function getIndexableSources(): Source[] {
  return [...getIndex().values()]
    .filter(entry => !entry.isDuplicate && !entry.isThin)
    .map(entry => entry.source)
}

/**
 * Other sources worth a click from this one — same author first, then shared
 * themes, then the same category. Duplicates and stubs never get linked.
 */
export function getRelatedSources(slug: string, limit = 6): Source[] {
  const entry = getIndex().get(slug)
  if (!entry) return []

  const candidates = [...getIndex().values()].filter(
    other =>
      other.source.slug !== slug &&
      other.canonicalSlug !== entry.canonicalSlug &&
      !other.isDuplicate &&
      !other.isThin
  )

  const related = candidates
    .map(other => {
      const shared = [...other.themeSet].filter(t => entry.themeSet.has(t)).length
      const sameAuthor = Boolean(other.source.author && other.source.author === entry.source.author)
      // Category alone is far too coarse to call two books related — it only
      // breaks ties between candidates that already share subject matter.
      const score = shared * 2 + (sameAuthor ? 8 : 0)
      const tiebreak = other.source.category === entry.source.category ? 1 : 0
      return { source: other.source, score, tiebreak, shared, sameAuthor }
    })
    .filter(candidate => candidate.shared >= 2 || candidate.sameAuthor)
    .sort((a, b) => b.score - a.score || b.tiebreak - a.tiebreak || b.source.highlightCount - a.source.highlightCount)
    .slice(0, limit)
    .map(candidate => candidate.source)

  if (related.length > 0) return related

  // Nothing shares subject matter — fall back to the best-marked-up neighbours
  // in the same category so the page still passes crawlers onward.
  return candidates
    .filter(other => other.source.category === entry.source.category)
    .map(other => other.source)
    .sort((a, b) => b.highlightCount - a.highlightCount)
    .slice(0, limit)
}

/**
 * The funnel itself: writing on this site that speaks to what the book is about.
 * Falls back to recent pieces so no source page is ever a dead end.
 */
export function getRelatedWriting(slug: string, limit = 3): ContentItem[] {
  const entry = getIndex().get(slug)
  const published = getAllContent()
    .filter(item => item.published !== false && item.section !== "")
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))

  if (!entry) return published.slice(0, limit)

  const wanted = new Set(entry.topicTags.map(t => t.toLowerCase()))
  const themes = new Set(entry.themes)

  const scored = published
    .map(item => {
      const tags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()) : []
      let score = tags.filter(t => wanted.has(t)).length * 3
      score += tags.filter(t => themes.has(t)).length * 2
      return { item, score }
    })
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score || (b.item.date ?? "").localeCompare(a.item.date ?? ""))
    .map(candidate => candidate.item)

  // Top up with recent writing so the section is always worth showing.
  const seen = new Set(scored.map(i => i.url))
  for (const item of published) {
    if (scored.length >= limit) break
    if (!seen.has(item.url)) {
      scored.push(item)
      seen.add(item.url)
    }
  }

  return scored.slice(0, limit)
}
