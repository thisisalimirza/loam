"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { type Source } from "@/lib/getReading"
import Cover from "./Cover"

type View = "list" | "covers"

const STORAGE_KEY = "reading-shelf-view"
const DEFAULT_VIEW: View = "list"

const formatNumber = (value: number) => value.toLocaleString("en-US")

/**
 * The shelf, either as a plain list (default) or as jacket art.
 *
 * Covers are opt-in because only about three quarters of the library has a
 * usable jacket, and those URLs are spread across a dozen third-party hosts
 * that rot — so the grid is always a partial view. The choice is remembered
 * per-visitor. To change the default, edit DEFAULT_VIEW above.
 */
export default function Shelf({ books }: { books: Source[] }) {
  const [view, setView] = useState<View>(DEFAULT_VIEW)

  // Read the saved preference after mount so the server and client markup match.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === "list" || saved === "covers") setView(saved)
    } catch {}
  }, [])

  const choose = (next: View) => {
    setView(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }

  return (
    <section className="reading-section">
      <div className="reading-section-head">
        <div>
          <h2 className="reading-section-title">The shelf</h2>
        </div>

        <div className="view-toggle" role="group" aria-label="Shelf view">
          {(["list", "covers"] as const).map(option => (
            <button
              key={option}
              type="button"
              className={`view-toggle-btn${view === option ? " view-toggle-btn--active" : ""}`}
              aria-pressed={view === option}
              onClick={() => choose(option)}
            >
              {option === "list" ? "List" : "Covers"}
            </button>
          ))}
        </div>
      </div>

      {view === "covers" ? (
        <ul className="shelf">
          {books.map(book => (
            <li key={book.slug} className="shelf-book">
              <Link href={`/reading/${book.slug}`} className="shelf-book-link">
                <span className="shelf-cover">
                  <Cover
                    src={book.coverUrl}
                    title={book.title}
                    author={book.author}
                    className="shelf-cover-image"
                  />
                  {book.open && <span className="shelf-open-flag">reading</span>}
                </span>
                <span className="shelf-book-title">{book.title}</span>
                {book.author && <span className="shelf-book-author">{book.author}</span>}
                <span className="shelf-book-meta">
                  {formatNumber(book.highlightCount)} highlights
                  {book.noteCount > 0 && <> · {book.noteCount} notes</>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="reading-list">
          {books.map(book => (
            <li key={book.slug} className="reading-item">
              <Link href={`/reading/${book.slug}`} className="reading-item-title">
                {book.title}
              </Link>
              {book.author && <span className="reading-item-author">{book.author}</span>}
              <span className="reading-item-meta">
                {formatNumber(book.highlightCount)} highlights
                {book.noteCount > 0 && <> · {book.noteCount} notes</>}
                {book.open && <> · currently reading</>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
