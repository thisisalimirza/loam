import type { Metadata } from "next"
import Link from "next/link"

import BreadcrumbsServer from "@/app/components/BreadcrumbsServer"
import Footer from "@/app/components/Footer"
import { getReading } from "@/lib/getReading"
import { buildActivityWeeks, totalIn } from "./activity"

export const metadata: Metadata = {
  title: "Reading – Ali Mirza",
  description:
    "What I'm reading and what I thought while reading it — books, articles, and podcasts, with my own marginalia.",
  alternates: { canonical: "/reading" },
}

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

/** Links out when the source has a public home; plain text when it doesn't. */
function SourceTitle({ title, url }: { title: string; url: string | null }) {
  if (!url) return <span className="reading-item-title">{title}</span>
  return (
    <a className="reading-item-title" href={url} target="_blank" rel="noopener noreferrer">
      {title}
    </a>
  )
}

export default function ReadingPage() {
  const { stats, currentlyReading, lately, marginalia, shelf, activity, generatedAt } = getReading()

  const asOf = new Date(generatedAt)
  const weeks = buildActivityWeeks(activity, asOf)
  const year = totalIn(activity)

  const shelfByYear = shelf.reduce<Record<string, typeof shelf>>((groups, book) => {
    const key = book.lastHighlightedAt.slice(0, 4)
    ;(groups[key] ??= []).push(book)
    return groups
  }, {})

  return (
    <div className="page-layout">
      <BreadcrumbsServer />

      <h1 className="page-title">Reading</h1>

      <p className="reading-intro">
        Everything else on this site is output. This page is the input side — what I&apos;m reading,
        and what I was thinking while I read it. It comes out of my{" "}
        <a href="https://readwise.io" target="_blank" rel="noopener noreferrer">
          Readwise
        </a>{" "}
        library: {formatNumber(stats.highlights)} highlights across {stats.books} books and{" "}
        {formatNumber(stats.sources - stats.books)} articles, podcasts, and threads, going back to{" "}
        {formatDate(stats.since, { day: undefined, month: "long" })}.
      </p>

      {currentlyReading.length > 0 && (
        <section className="reading-section">
          <h2 className="reading-section-title">Open now</h2>
          <ul className="reading-list">
            {currentlyReading.map((item) => (
              <li key={item.title} className="reading-item">
                <SourceTitle title={item.title} url={item.url} />
                {item.author && <span className="reading-item-author">{item.author}</span>}
                <span className="reading-item-meta">
                  {item.progress !== null && <>{item.progress}% through · </>}
                  {item.highlightCount !== null && (
                    <>{formatNumber(item.highlightCount)} highlights · </>
                  )}
                  last marked up {formatDate(item.lastTouchedAt)}
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
          <div className="reading-heatmap" role="img" aria-label={`Highlighting activity over the past year: ${year.highlights} highlights across ${year.days} days`}>
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

      {lately.length > 0 && (
        <section className="reading-section">
          <h2 className="reading-section-title">Lately</h2>
          <p className="reading-section-note">
            The last few months of everything else — mostly listened to rather than read.
          </p>
          <ul className="reading-list">
            {lately.map((item) => (
              <li key={`${item.title}-${item.lastHighlightedAt}`} className="reading-item">
                <SourceTitle title={item.title} url={item.url} />
                {item.author && <span className="reading-item-author">{item.author}</span>}
                <span className="reading-item-meta">
                  {item.kind} · {formatNumber(item.highlightCount)} highlights ·{" "}
                  {formatDate(item.lastHighlightedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {marginalia.length > 0 && (
        <section className="reading-section">
          <h2 className="reading-section-title">Marginalia</h2>
          <p className="reading-section-note">
            The passages I stopped at, and what I wrote in the margin.
          </p>
          <ol className="reading-marginalia">
            {marginalia.map((entry, index) => (
              <li key={index} className="reading-margin-entry">
                <blockquote className="reading-margin-passage">{entry.passage}</blockquote>
                <p className="reading-margin-note">{entry.note}</p>
                <p className="reading-margin-source">
                  <SourceTitle title={entry.title} url={entry.url} />
                  {entry.author && <>, {entry.author}</>}
                  {entry.date && <> · {formatDate(entry.date)}</>}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {shelf.length > 0 && (
        <section className="reading-section">
          <h2 className="reading-section-title">The shelf</h2>
          <p className="reading-section-note">
            Books I&apos;ve already been through, by the year I last marked one up. Anything
            imported in bulk carries its import date rather than a finishing date.
          </p>
          {Object.entries(shelfByYear)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([groupYear, books]) => (
              <div key={groupYear} className="reading-shelf-year">
                <h3 className="reading-shelf-year-title">{groupYear}</h3>
                <ul className="reading-list">
                  {books.map((book) => (
                    <li key={book.title} className="reading-item">
                      <SourceTitle title={book.title} url={book.url} />
                      {book.author && <span className="reading-item-author">{book.author}</span>}
                      <span className="reading-item-meta">
                        {formatNumber(book.highlightCount)} highlights
                        {book.noteCount > 0 && <> · {book.noteCount} notes</>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}

      <section className="reading-section">
        <h2 className="reading-section-title">By the numbers</h2>
        <p className="reading-section-note">Highlights since 2020, by where they came from.</p>
        <dl className="reading-stats">
          {Object.entries(stats.byCategory)
            // "supplementals" is Readwise plumbing, not a kind of reading.
            .filter(([category]) => category !== "supplementals")
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => (
              <div key={category} className="reading-stat">
                <dt>{category}</dt>
                <dd>{formatNumber(count)}</dd>
              </div>
            ))}
          <div className="reading-stat">
            <dt>my own notes</dt>
            <dd>{formatNumber(stats.notes)}</dd>
          </div>
        </dl>
      </section>

      <p className="reading-footnote">
        Snapshot taken {formatDate(generatedAt)}. The output side lives in{" "}
        <Link href="/writing">writing</Link>.
      </p>

      <Footer />
    </div>
  )
}
