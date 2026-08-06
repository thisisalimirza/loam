import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import BreadcrumbsServer from "@/app/components/BreadcrumbsServer"
import Footer from "@/app/components/Footer"
import { getAllSources, getSource } from "@/lib/getReading"
import Cover from "../Cover"

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllSources().map((source) => ({ slug: source.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const source = getSource(slug)
  if (!source) return {}

  const byline = source.author ? ` by ${source.author}` : ""

  return {
    title: `${source.title} – Reading – Ali Mirza`,
    description: `${source.highlightCount} highlights from ${source.title}${byline}.`,
    alternates: { canonical: `/reading/${source.slug}` },
  }
}

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : null

export default async function SourcePage({ params }: PageProps) {
  const { slug } = await params
  const source = getSource(slug)

  if (!source) notFound()

  const first = formatDate(source.firstHighlightedAt)
  const last = formatDate(source.lastHighlightedAt)
  const span = first && last && first !== last ? `${first} – ${last}` : (last ?? first)

  return (
    <div className="page-layout">
      <BreadcrumbsServer />

      <p className="book-back">
        <Link href="/reading">← the shelf</Link>
      </p>

      <header className="book-header">
        {source.coverUrl && (
          <span className="book-cover">
            <Cover
              src={source.coverUrl}
              title={source.title}
              author={source.author}
              className="book-cover-image"
            />
          </span>
        )}
        <div className="book-heading">
          <h1 className="book-title">{source.title}</h1>
          {source.author && <p className="book-author">{source.author}</p>}
          <p className="book-meta">
            {source.highlightCount.toLocaleString("en-US")} highlights
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

      <ol className="book-highlights">
        {source.highlights.map((highlight, index) => (
          <li key={index} className="book-highlight">
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

      <p className="reading-footnote">
        <Link href="/reading">← back to the shelf</Link>
      </p>

      <Footer />
    </div>
  )
}
