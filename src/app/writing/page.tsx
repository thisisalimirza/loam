import Link from "next/link"
import { getAllContent } from "@/lib/getAllContent"
import BreadcrumbsServer from "@/app/components/BreadcrumbsServer"
import Footer from "@/app/components/Footer"
import MetaHead from "@/app/components/MetaHead"

export default function WritingPage() {
  const allContent = getAllContent()

  const published = allContent
    .filter(item => item.published !== false && item.section && item.section !== "")
    .sort((a, b) => {
      const dateA = a.date || ""
      const dateB = b.date || ""
      if (dateB > dateA) return 1
      if (dateA > dateB) return -1
      return 0
    })

  // Group by year
  const byYear: Record<string, typeof published> = {}
  for (const item of published) {
    const year = item.date ? item.date.slice(0, 4) : "Undated"
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(item)
  }

  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a))

  return (
    <>
      <MetaHead
        title="Writing"
        description="Essays, memos, and notes by Ali Mirza."
        canonical="/writing"
      />
      <div className="page-layout">
        <BreadcrumbsServer />

        <h1 className="page-title">Writing</h1>

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

        <Footer />
      </div>
    </>
  )
}
