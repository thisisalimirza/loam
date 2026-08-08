import fs from "fs"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllTags, getContentByTag } from "@/lib/getAllTags"
import MetaHead from "@/app/components/MetaHead"
import EntryList from "@/app/components/EntryList"

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
        <div className="page-head">
          <p className="eyebrow">Tagged</p>
          <h1 className="page-title">{tag}</h1>
          <p className="tag-page-count">
            {items.length} {items.length === 1 ? "piece" : "pieces"} ·{" "}
            <Link href="/" className="tag-page-back">all themes</Link>
          </p>
        </div>

        <EntryList items={withDates} />
      </div>
    </>
  )
}
