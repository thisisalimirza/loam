import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getAllSources, getSource, type Source } from "@/lib/getReading"
import {
  cleanTitle,
  getRelatedSources,
  getRelatedWriting,
  getSourceMeta,
  shortTitle,
} from "@/lib/readingSeo"
import { buildMetadata } from "@/lib/seo"
import { SourceSchema } from "@/app/components/StructuredData"
import { siteConfig } from "@/config/site"
import Cover from "../Cover"
import Icon from "@/app/components/Icon"

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllSources().map((source) => ({ slug: source.slug }))
}

/** "book" reads oddly in a sentence about a podcast; this keeps the copy honest. */
function nounFor(kind: string) {
  if (kind === "book") return "book"
  if (kind === "podcast") return "episode"
  if (kind === "thread") return "thread"
  return "piece"
}

const formatNumber = (value: number) => value.toLocaleString("en-US")

/** "1 highlight" / "237 highlights" — a handful of these sources have just one. */
const count = (value: number, noun: string, plural = `${noun}s`) =>
  `${formatNumber(value)} ${value === 1 ? noun : plural}`

const formatDate = (iso: string | null, opts: Intl.DateTimeFormatOptions = {}) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
        ...opts,
      })
    : null

/** A list of terms as prose: "a, b and c". */
function toSentenceList(items: string[]) {
  if (items.length <= 1) return items.join("")
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

/**
 * The sentence that makes each of these pages its own page rather than a
 * template with the title swapped: real counts, real dates, and the terms this
 * particular source actually keeps circling back to.
 */
function buildSummary(source: Source, themes: string[]) {
  const noun = nounFor(source.kind)
  const byline = source.author ? ` by ${source.author}` : ""

  let text = `${count(source.highlightCount, "quote and highlight", "quotes and highlights")} I marked up in ${shortTitle(
    source.title
  )}${byline}`

  if (source.noteCount > 0) {
    text += `, ${formatNumber(source.noteCount)} of them with my own note in the margin`
  }

  text += themes.length ? `. Recurring themes: ${toSentenceList(themes.slice(0, 4))}.` : `.`

  return { text, noun }
}

/**
 * People search "<book> quotes" far more than they search a book's title next
 * to my name, so the keyword leads and the count earns the click. Google shows
 * roughly sixty characters and the layout appends " – Ali Mirza", so the
 * flourishes drop away one at a time until what's left still fits.
 */
const TITLE_BUDGET = 48

function buildTitle(short: string, source: Source): string {
  // Only books are searched for as "quotes"; an episode is searched for as itself.
  const keyword = source.kind === "book" ? "Quotes " : ""
  const highlights = count(source.highlightCount, "Highlight")

  const candidates = [
    source.noteCount > 0 ? `${short} ${keyword}— ${highlights} & Notes` : null,
    `${short} ${keyword}— ${highlights}`,
    source.kind === "book" ? `${short} Quotes` : null,
    short,
  ].filter((candidate): candidate is string => Boolean(candidate))

  return candidates.find(candidate => candidate.length <= TITLE_BUDGET) ?? candidates[candidates.length - 1]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const source = getSource(slug)
  if (!source) return { title: "Not found", robots: { index: false, follow: false } }

  const meta = getSourceMeta(slug)
  const themes = meta?.themes ?? []
  const short = shortTitle(source.title)
  const { text: description } = buildSummary(source, themes)

  const title = buildTitle(short, source)

  return buildMetadata({
    title,
    description,
    path: `/reading/${source.slug}`,
    type: "article",
    publishedTime: source.firstHighlightedAt ?? undefined,
    modifiedTime: source.lastHighlightedAt ?? undefined,
    tags: themes,
    // Two Readwise exports of the same title would otherwise compete with each
    // other; the richer page is the one that gets to rank.
    canonicalPath: meta?.isDuplicate ? `/reading/${meta.canonicalSlug}` : undefined,
    noIndex: meta?.isDuplicate || meta?.isThin,
    ogEyebrow: source.author ? `Book notes · ${source.author}` : "Book notes",
    ogMeta: count(source.highlightCount, "highlight"),
  })
}

export default async function SourcePage({ params }: PageProps) {
  const { slug } = await params
  const source = getSource(slug)

  if (!source) notFound()

  const meta = getSourceMeta(slug)
  const themes = meta?.themes ?? []
  const related = getRelatedSources(slug, 6)
  const writing = getRelatedWriting(slug, 3)

  const title = cleanTitle(source.title)
  const short = shortTitle(source.title)
  const { noun } = buildSummary(source, themes)

  const first = formatDate(source.firstHighlightedAt)
  const last = formatDate(source.lastHighlightedAt)
  const span = first && last && first !== last ? `${first} – ${last}` : (last ?? first)

  const annotated = source.highlights.filter((h) => h.note)

  return (
    <div className="page-layout">
      <SourceSchema
        title={title}
        author={source.author}
        kind={source.kind}
        path={`/reading/${source.slug}`}
        description={buildSummary(source, themes).text}
        coverUrl={source.coverUrl}
        quotes={source.highlights.map((h) => h.text)}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Book Notes", path: "/reading" },
          { name: short },
        ]}
      />

      <p className="book-back">
        <Link href="/reading"><Icon name="left" /> the shelf</Link>
      </p>

      <header className="book-header">
        {source.coverUrl && (
          <span className="book-cover">
            <Cover
              src={source.coverUrl}
              title={title}
              author={source.author}
              alt={`${title}${source.author ? ` by ${source.author}` : ""} — book cover`}
              className="book-cover-image"
            />
          </span>
        )}
        <div className="book-heading">
          <h1 className="book-title">{title}</h1>
          {source.author && <p className="book-author">{source.author}</p>}
          <p className="book-meta">
            {count(source.highlightCount, "highlight")}
            {source.noteCount > 0 && <> · {source.noteCount} with a note</>}
            {span && <> · {span}</>}
          </p>
          {source.sourceUrl && (
            <p className="book-meta">
              <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
                the source
              </a>
            </p>
          )}
        </div>
      </header>

      {/* The opening prose carries the phrasing people actually search for. */}
      <p className="book-intro">
        Quotes and highlights from <strong>{short}</strong>
        {source.author && <> by {source.author}</>} — {count(source.highlightCount, "passage")}{" "}
        I marked up while reading
        {span && <> ({span})</>}
        {source.noteCount > 0 && (
          <>
            , {formatNumber(source.noteCount)} of which carry a note I left in the margin
          </>
        )}
        . Everything below is taken straight from my Kindle, unedited and in the order I read it.
      </p>

      {themes.length > 0 && (
        <p className="book-themes">
          <span className="book-themes-label">What this {noun} keeps circling back to</span>
          {toSentenceList(themes)}.
        </p>
      )}

      {annotated.length > 0 && (
        <section className="reading-section">
          <h2 className="reading-section-title">Where I stopped to argue</h2>
          <p className="reading-section-note">
            The {annotated.length === 1 ? "passage" : `${annotated.length} passages`} I had something
            of my own to say about.
          </p>
          <ol className="book-highlights">
            {annotated.map((highlight, index) => (
              <li key={index} className="book-highlight">
                <blockquote className="book-highlight-text">{highlight.text}</blockquote>
                <p className="book-highlight-note">
                  <span className="book-highlight-note-label">in the margin</span>
                  {highlight.note}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="reading-section">
        <h2 className="reading-section-title" id="highlights">
          All {count(source.highlightCount, "highlight")}
        </h2>
        <ol className="book-highlights">
          {source.highlights.map((highlight, index) => (
            // Anchored so a single passage can be linked to directly.
            <li key={index} className="book-highlight" id={`q${index + 1}`}>
              <blockquote className="book-highlight-text">{highlight.text}</blockquote>
              {highlight.note && (
                <p className="book-highlight-note">
                  <span className="book-highlight-note-label">in the margin</span>
                  {highlight.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {writing.length > 0 && (
        <section className="reading-section">
          <h2 className="reading-section-title">What I&apos;ve written around this</h2>
          <p className="reading-section-note">
            Where these ideas turn up in my own work.
          </p>
          <ul className="reading-list">
            {writing.map((item) => (
              <li key={item.url} className="reading-item">
                <Link href={item.url} className="reading-item-title">
                  {item.title}
                </Link>
                {item.summary && <span className="reading-item-summary">{item.summary}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="reading-section">
          <h2 className="reading-section-title">Read alongside</h2>
          <p className="reading-section-note">
            Other {nounFor(source.kind) === "book" ? "books" : "sources"} on the shelf that cover
            similar ground.
          </p>
          <ul className="reading-list">
            {related.map((other) => (
              <li key={other.slug} className="reading-item">
                <Link href={`/reading/${other.slug}`} className="reading-item-title">
                  {shortTitle(other.title)}
                </Link>
                {other.author && <span className="reading-item-author">{other.author}</span>}
                <span className="reading-item-meta">
                  {count(other.highlightCount, "highlight")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="book-cta">
        <p>
          I write about what I read — medicine, technology, and what holds up across centuries — in{" "}
          <a href={siteConfig.links.newsletter} target="_blank" rel="noopener noreferrer">
            Side Effects
          </a>
          . The essays live in <Link href="/writing">the archive</Link>, and the rest of the shelf is
          on <Link href="/reading">Book Notes</Link>.
        </p>
      </section>

      <p className="reading-footnote">
        <Link href="/reading"><Icon name="left" /> back to the shelf</Link>
      </p>
    </div>
  )
}
