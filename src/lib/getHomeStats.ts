import fs from "fs"
import path from "path"
import { getAllContent } from "./getAllContent"
import { getReading } from "./getReading"

export interface HomeStats {
  pieces: number
  books: number
  highlights: number
  meditations: number
  projects: number
}

const contentFile = (name: string) => {
  try {
    return fs.readFileSync(path.join(process.cwd(), "content", name), "utf8")
  } catch {
    return ""
  }
}

/** Count of lines that open an ordered-list item, e.g. "12. Consolidate control." */
const countListItems = (source: string) => (source.match(/^\d+\.\s+\S/gm) || []).length

/** Count of "### [Name](url)" project headings. */
const countProjectHeadings = (source: string) => (source.match(/^###\s+\[/gm) || []).length

/**
 * Live counts for the home page's four entry points. Everything is derived
 * from the content on disk so the numbers can never drift out of date.
 */
export function getHomeStats(): HomeStats {
  const reading = getReading()

  const pieces = getAllContent().filter(
    item => item.published !== false && item.section !== ""
  ).length

  return {
    pieces,
    books: reading.stats.books,
    highlights: reading.stats.highlights,
    meditations: countListItems(contentFile("meditations.mdx")),
    projects: countProjectHeadings(contentFile("projects.mdx")),
  }
}
