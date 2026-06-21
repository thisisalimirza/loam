import fs from "fs"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllTags, getContentByTag } from "@/lib/getAllTags"
import BreadcrumbsServer from "@/app/components/BreadcrumbsServer"
import Footer from "@/app/components/Footer"
import MetaHead from "@/app/components/MetaHead"

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }))
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag: rawTag } = await params
  const tag = decodeURIComponent(rawTag).toLowerCase()
  const items = getContentByTag(tag)

  if (items.length === 0) notFound()

  const withDates = items.map(item => {
    let effectiveDate = item.date
    if (!effectiveDate && item.filePath) {
      try {
        effectiveDate = fs.statSync(item.filePath).birthtime.toISOString().slice(0, 10)
      } catch {}
    }
    return { ...item, effectiveDate }
  })

  return (
    <>
      <MetaHead
        title={`#${tag}`}
        description={`Writing tagged "${tag}" by Ali Mirza.`}
        canonical={`/tag/${encodeURIComponent(tag)}`}
      />

      <div className="page-layout">
        <BreadcrumbsServer />

        <p className="tag-page-eyebrow">Tagged</p>
        <h1 className="page-title">{tag}</h1>
        <p className="tag-page-count">
          {items.length} {items.length === 1 ? "piece" : "pieces"} ·{" "}
          <Link href="/" className="tag-page-back">all themes</Link>
        </p>

        <ul className="content-list">
          {withDates.map(item => (
            <li key={item.url} className="content-item">
              <Link href={item.url} className="content-item-title">
                {item.title}
              </Link>
              {item.summary && (
                <div className="content-item-summary">{item.summary}</div>
              )}
              <div className="content-item-footer">
                <span className="content-item-section">
                  {item.section.charAt(0).toUpperCase() + item.section.slice(1)}
                  {(item.effectiveDate || item.readTime) && " · "}
                </span>
                {item.effectiveDate && (
                  <span className="content-item-date">{item.effectiveDate}</span>
                )}
                {item.readTime && (
                  <span className="content-item-readtime"> · {item.readTime}</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        <Footer />
      </div>
    </>
  )
}
