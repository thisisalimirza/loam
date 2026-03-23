"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ContentItem } from "@/types"

interface WritingListClientProps {
  items: ContentItem[]
}

export default function WritingListClient({ items }: WritingListClientProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allSections = useMemo(() => {
    const set = new Set<string>()
    items.forEach(item => { if (item.section) set.add(item.section) })
    return Array.from(set).sort()
  }, [items])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    items.forEach(item => item.tags?.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (activeSection && item.section !== activeSection) return false
      if (activeTag && !item.tags?.includes(activeTag)) return false
      return true
    })
  }, [items, activeSection, activeTag])

  // Group filtered items by year
  const byYear = useMemo(() => {
    const map: Record<string, ContentItem[]> = {}
    for (const item of filtered) {
      const year = item.date ? item.date.slice(0, 4) : "Undated"
      if (!map[year]) map[year] = []
      map[year].push(item)
    }
    return map
  }, [filtered])

  const years = Object.keys(byYear).sort((a, b) => {
    if (a === "Undated") return -1
    if (b === "Undated") return 1
    return b.localeCompare(a)
  })

  const hasFilters = allSections.length > 1 || allTags.length > 0

  return (
    <>
      {hasFilters && (
        <div className="filter-bar">
          {allSections.length > 1 && (
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
              <select
                className="filter-select"
                value={activeTag ?? ""}
                onChange={e => setActiveTag(e.target.value || null)}
              >
                <option value="">All</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="filter-empty">No posts match the selected filter.</p>
      ) : (
        <div className="writing-index">
          {years.map(year => (
            <div key={year} className="writing-year-group">
              <h2 className="writing-year">{year}</h2>
              <ul className="writing-list">
                {byYear[year].map(item => (
                  <li key={item.url} className="writing-item">
                    <Link href={item.url} className="writing-item-title">
                      {item.title}
                    </Link>
                    <span className="writing-item-meta">
                      {item.section && (
                        <span className="writing-item-section">{item.section}</span>
                      )}
                      {item.date && (
                        <span className="writing-item-date">{item.date}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
