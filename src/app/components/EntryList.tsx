import Link from "next/link"
import { ContentItem } from "@/types"

interface EntryListProps {
  items: ContentItem[]
  /** Show the section name ("Essays", "Memos") alongside the date. */
  showSection?: boolean
  /** Show each post's summary. Off for dense, year-grouped indexes. */
  showSummary?: boolean
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** "2024-03-08" -> "Mar 2024". Undated posts get an em dash. */
function formatDate(date?: string) {
  if (!date) return "—"
  const [year, month] = date.split("-")
  const index = Number(month) - 1
  return MONTHS[index] ? `${MONTHS[index]} ${year}` : year
}

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

/**
 * The one way a list of writing is rendered on this site — used by the home
 * page, /writing, the section indexes and the tag pages.
 */
export default function EntryList({
  items,
  showSection = true,
  showSummary = true,
}: EntryListProps) {
  return (
    <ul className="entry-list">
      {items.map(item => {
        const date = item.effectiveDate || item.date

        return (
          <li key={item.url} className="entry">
            <Link href={item.url} className="entry-link">
              <span className="entry-date">{formatDate(date)}</span>
              <span className="entry-body">
                <span className="entry-title">{item.title}</span>
                {showSummary && item.summary && (
                  <span className="entry-summary">{item.summary}</span>
                )}
                <span className="entry-meta">
                  {showSection && item.section && (
                    <span className="entry-tagpill">{titleCase(item.section)}</span>
                  )}
                  {item.readTime && <span>{item.readTime}</span>}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
