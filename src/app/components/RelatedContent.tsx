import Link from "next/link"
import { ContentItem } from "@/types"

interface RelatedContentProps {
  items: ContentItem[]
  sectionName?: string
  sectionSlug: string
}

export default function RelatedContent({ 
  items, 
  sectionName, 
  sectionSlug 
}: RelatedContentProps) {
  if (items.length === 0) return null

  return (
    <aside className="related-content">
      <div className="related-title">
        Related {sectionName || "Content"}
      </div>
      <ul className="related-list">
        {items.map(item => (
          <li key={item.slug} className="related-item">
            <Link 
              href={`/${sectionSlug}/${item.slug}`} 
              className="related-link"
            >
              {item.title}
            </Link>
            {item.summary && (
              <span className="related-summary">{item.summary}</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}