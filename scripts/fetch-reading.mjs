#!/usr/bin/env node
/**
 * Refreshes src/data/reading.json from Readwise.
 *
 *   READWISE_TOKEN=xxxx npm run reading:refresh
 *
 * Token comes from https://readwise.io/access_token. The page renders from the
 * committed snapshot, so this only needs to run when the reading list should
 * catch up with reality.
 */

import { writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

import { buildReadingSnapshot } from "./lib/build-reading.mjs"

const TOKEN = process.env.READWISE_TOKEN
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "reading.json")

// Reader archives years of newsletters; only the recent stretch says anything
// about what is being read now.
const ARCHIVE_PAGES = 4

if (!TOKEN) {
  console.error("READWISE_TOKEN is not set. Get one at https://readwise.io/access_token")
  process.exit(1)
}

async function request(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { headers: { Authorization: `Token ${TOKEN}` } })

    if (response.status === 429) {
      const wait = Number(response.headers.get("Retry-After") ?? 60)
      console.log(`  rate limited, waiting ${wait}s`)
      await new Promise((resolve) => setTimeout(resolve, wait * 1000))
      continue
    }

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} for ${url}`)
    }

    return response.json()
  }

  throw new Error(`Gave up after repeated rate limiting on ${url}`)
}

/** The export endpoint returns books with nested highlights; flatten them. */
async function fetchHighlights() {
  const highlights = []
  let cursor = null
  let page = 0

  do {
    const url = new URL("https://readwise.io/api/v2/export/")
    if (cursor) url.searchParams.set("pageCursor", cursor)

    const data = await request(url)
    page += 1

    for (const book of data.results ?? []) {
      for (const highlight of book.highlights ?? []) {
        highlights.push({
          id: highlight.id,
          text: highlight.text,
          note: highlight.note,
          highlighted_at: highlight.highlighted_at,
          tags: highlight.tags,
          book_id: book.user_book_id,
          book_title: book.readable_title || book.title,
          book_author: book.author,
          book_category: book.category,
          book_source_url: book.source_url,
          book_cover_image_url: book.cover_image_url,
        })
      }
    }

    console.log(`  export page ${page}: ${highlights.length} highlights so far`)
    cursor = data.nextPageCursor
  } while (cursor)

  return highlights
}

async function fetchReaderDocs() {
  const docs = []

  for (const location of ["new", "later", "shortlist", "archive"]) {
    let cursor = null
    let page = 0

    do {
      const url = new URL("https://readwise.io/api/v3/list/")
      url.searchParams.set("location", location)
      if (cursor) url.searchParams.set("pageCursor", cursor)

      const data = await request(url)
      docs.push(...(data.results ?? []))
      page += 1
      cursor = data.nextPageCursor
    } while (cursor && !(location === "archive" && page >= ARCHIVE_PAGES))

    console.log(`  reader/${location}: ${docs.length} documents so far`)
  }

  return docs
}

console.log("Fetching Readwise highlights…")
const highlights = await fetchHighlights()

console.log("Fetching Reader documents…")
const readerDocs = await fetchReaderDocs()

const snapshot = buildReadingSnapshot({ highlights, readerDocs })
await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`)

console.log(
  `\nWrote ${OUT}\n  ${snapshot.stats.highlights} highlights across ${snapshot.stats.books} books` +
    `\n  ${snapshot.currentlyReading.length} open, ${snapshot.marginalia.length} marginalia, ${snapshot.shelf.length} on the shelf`,
)
