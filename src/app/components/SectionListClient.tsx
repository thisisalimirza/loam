"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ContentItem } from "@/types"

interface SectionListClientProps {
  items: ContentItem[]
  showSectionFilter?: boolean
}

export default function SectionListClient({ items, showSectionFilter = false }: SectionListClientProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach(item => item.tags?.forEach(t => tagSet.add(t.toLowerCase())))
    return Array.from(tagSet).sort()
  }, [items])

  const allSections = useMemo(() => {
    const sectionSet = new Set<string>()
    items.forEach(item => sectionSet.add(item.section))
    return Array.from(sectionSet).sort()
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (activeSection && item.section !== activeSection) return false
      if (activeTag && !item.tags?.some(t => t.toLowerCase() === activeTag)) return false
      return true
    })
  }, [items, activeTag, activeSection])

  const hasFilters = allTags.length > 0 || (showSectionFilter && allSections.length > 1)

  return (
    <>
      {hasFilters && (
        <div className="filter-bar">
          {showSectionFilter && allSections.length > 1 && (
            <div className="filter-group">
              <span className="filter-label">Type</span>
              <button
                className={`filter-chip${activeSection === null ? " filter-chip--active" : ""}`}
                onClick={() => setActiveSection(null)}
              >
                All
              </button>
              {allSections.map(section => (
                <button
                  key={section}
                  className={`filter-chip${activeSection === section ? " filter-chip--active" : ""}`}
                  onClick={() => setActiveSection(activeSection === section ? null : section)}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </div>
          )}

          {allTags.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Tags</span>
              <button
                className={`filter-chip${activeTag === null ? " filter-chip--active" : ""}`}
                onClick={() => setActiveTag(null)}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`filter-chip${activeTag === tag ? " filter-chip--active" : ""}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="filter-empty">No posts match the selected filter.</p>
      ) : (
        <ul className="content-list">
          {filtered.map(item => (
            <li key={item.url} className="content-item">
              <Link href={item.url} className="content-item-title">
                {item.title}
              </Link>
              <span className="content-item-meta">
                {showSectionFilter && <>{item.section.charAt(0).toUpperCase() + item.section.slice(1)} · </>}
                {item.effectiveDate && <>{item.effectiveDate}</>}
                {item.readTime && <> · {item.readTime}</>}
              </span>
              {item.summary && (
                <div className="content-item-summary">{item.summary}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
