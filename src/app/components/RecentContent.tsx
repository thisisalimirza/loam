import Link from "next/link"
import { ContentItem } from "@/types"

interface RecentContentProps {
  items: ContentItem[]
}

export default function RecentContent({ items }: RecentContentProps) {
  return (
    <section className="content-section">
      <h2 className="content-section-title">Recently Added</h2>
      <ul className="content-list">
        {items.map(item => (
          <li key={item.url} className="content-item">
            <Link href={item.url} className="content-item-title">
              {item.title}
            </Link>
            <span className="content-item-meta">
              {item.section.charAt(0).toUpperCase() + item.section.slice(1)}
              {item.date && <> · {item.date}</>}
              {item.readTime && <> · {item.readTime}</>}
            </span>
            {item.summary && (
              <div className="content-item-summary">{item.summary}</div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}