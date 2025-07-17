import { Heading } from "@/types"

interface TableOfContentsProps {
  headings: Heading[]
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  if (headings.length <= 1) return null

  return (
    <nav className="toc-container">
      <div className="toc-title">Table of Contents</div>
      <ul className="toc-list">
        {headings.map(h => (
          <li
            key={h.id}
            className="toc-item"
            style={{ marginLeft: (h.level - 2) * 16 }}
          >
            <a href={`#${h.id}`} className="toc-link">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}