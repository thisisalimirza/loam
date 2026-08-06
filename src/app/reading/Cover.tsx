"use client"

import { useState } from "react"

interface CoverProps {
  src: string | null
  title: string
  author: string | null
  className?: string
}

/**
 * Jacket art comes from whichever host Readwise resolved — Amazon, Google
 * Books, Open Library — and those links rot. When one fails, or never existed,
 * the book gets a typeset spine instead of a broken image.
 */
export default function Cover({ src, title, author, className }: CoverProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <span className="shelf-cover-fallback">
        <span className="shelf-cover-fallback-title">{title}</span>
        {author && <span className="shelf-cover-fallback-author">{author}</span>}
      </span>
    )
  }

  return (
    // Third-party hosts, so these bypass the image optimiser.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
