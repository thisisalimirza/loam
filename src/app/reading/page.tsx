import Link from "next/link"

import { getReading } from "@/lib/getReading"
import { buildMetadata } from "@/lib/seo"
import { CollectionSchema } from "@/app/components/StructuredData"
import { buildActivityWeeks, totalIn } from "./activity"
import Shelf from "./Shelf"

const { stats: siteStats } = getReading()

export const metadata = buildMetadata({
  title: "Book Notes — Quotes & Highlights from Everything I Read",
  description: `${siteStats.highlights.toLocaleString("en-US")} quotes and highlights from ${siteStats.books} books, with the notes I left in the margins. Kindle highlights on medicine, philosophy, business and technology.`,
  path: "/reading",
  ogEyebrow: "Book notes",
  ogMeta: `${siteStats.books} books`,
})

const formatDate = (iso: string | null, opts: Intl.DateTimeFormatOptions = {}) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
        ...opts,
      })
    : null

const formatNumber = (value: number) => value.toLocaleString("en-US")

export default function ReadingPage() {
  const { stats, books, beyond, openDocuments, activity, generatedAt } = getReading()

  const open = books.filter((book) => book.open)
  const weeks = buildActivityWeeks(activity, new Date(generatedAt))
  const year = totalIn(activity)

  return (
    <div className="page-layout">
      <CollectionSchema
        title="Book Notes"
        description={`Quotes and highlights from ${stats.books} books, with margin notes.`}
        path="/reading"
        crumbs={[{ name: "Home", path: "/" }, { name: "Book Notes" }]}
      />

      <div className="page-head">
        <p className="eyebrow">The input side</p>
        <h1 className="page-title">Book Notes</h1>

        <p className="page-intro">
        Much of this website is outputs of my production. Over the years, many folks have asked
        me about what my inputs are and the sources of my ideas and thoughts. You&apos;ll notice
        there&apos;s no theme or pattern, they&apos;re very varied. But below are some of the
        excerpts and highlights taken directly from my Kindle as I read content.{" "}
        {formatNumber(stats.highlights)} highlights, {stats.books} books, kept in{" "}
        <a href="https://readwise.io" target="_blank" rel="noopener noreferrer">
          Readwise
        </a>{" "}
        since {formatDate(stats.since, { day: undefined, month: "long" })}.
        </p>
      </div>

      {(open.length > 0 || openDocuments.length > 0) && (
        <section className="reading-section">
          <h2 className="reading-section-title">Open now</h2>
          <ul className="reading-list">
            {open.map((book) => (
              <li key={book.slug} className="reading-item">
                <Link href={`/reading/${book.slug}`} className="reading-item-title">
                  {book.title}
                </Link>
                {book.author && <span className="reading-item-author">{book.author}</span>}
                <span className="reading-item-meta">
                  {formatNumber(book.highlightCount)} highlights · last marked up{" "}
                  {formatDate(book.lastHighlightedAt)}
                </span>
              </li>
            ))}
            {openDocuments.map((doc) => (
              <li key={doc.title} className="reading-item">
                {doc.url ? (
                  <a
                    className="reading-item-title"
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {doc.title}
                  </a>
                ) : (
                  <span className="reading-item-title">{doc.title}</span>
                )}
                {doc.author && <span className="reading-item-author">{doc.author}</span>}
                <span className="reading-item-meta">
                  {doc.progress}% through · last opened {formatDate(doc.lastOpenedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Shelf books={books} />

      {beyond.length > 0 && (
        <section className="reading-section">
          <h2 className="reading-section-title">Beyond books</h2>
          <p className="reading-section-note">
            The articles, essays and episodes I marked up most heavily.
          </p>
          <ul className="reading-list">
            {beyond.map((source) => (
              <li key={source.slug} className="reading-item">
                <Link href={`/reading/${source.slug}`} className="reading-item-title">
                  {source.title}
                </Link>
                {source.author && <span className="reading-item-author">{source.author}</span>}
                <span className="reading-item-meta">
                  {source.kind} · {formatNumber(source.highlightCount)} highlights
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="reading-section">
        <h2 className="reading-section-title">A year of marking things up</h2>
        <p className="reading-section-note">
          {formatNumber(year.highlights)} highlights over {year.days} days.
        </p>

        <div className="reading-heatmap-scroll">
          <div
            className="reading-heatmap"
            role="img"
            aria-label={`Highlighting activity over the past year: ${year.highlights} highlights across ${year.days} days`}
          >
            <div className="reading-heatmap-months">
              {weeks.map((week, index) => (
                <span key={index} className="reading-heatmap-month">
                  {week.label}
                </span>
              ))}
            </div>
            <div className="reading-heatmap-grid">
              {weeks.map((week, index) => (
                <div key={index} className="reading-heatmap-week">
                  {week.days.map((day) => (
                    <span
                      key={day.date}
                      className="reading-heatmap-day"
                      data-level={day.level}
                      title={`${day.count} highlight${day.count === 1 ? "" : "s"} on ${formatDate(day.date)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="reading-heatmap-legend">
          <span>less</span>
          <span className="reading-heatmap-day" data-level={0} />
          <span className="reading-heatmap-day" data-level={1} />
          <span className="reading-heatmap-day" data-level={2} />
          <span className="reading-heatmap-day" data-level={3} />
          <span className="reading-heatmap-day" data-level={4} />
          <span>more</span>
        </div>
      </section>

      <p className="reading-footnote">
        Snapshot taken {formatDate(generatedAt)}. The output side lives in{" "}
        <Link href="/writing">writing</Link>.
      </p>
    </div>
  )
}
