import fs from "fs"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllTags, getContentByTag } from "@/lib/getAllTags"
import { CollectionSchema } from "@/app/components/StructuredData"
import { buildMetadata } from "@/lib/seo"
import EntryList from "@/app/components/EntryList"

/**
 * A tag page earns a place in the index once it collects enough writing to be
 * a genuine topic hub. Below this it stays crawlable but unindexed, so ninety
 * near-empty pages can't compete with the essays themselves.
 */
const MIN_INDEXABLE = 3

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const { tag: rawTag } = await params
  const tag = decodeURIComponent(rawTag).toLowerCase()
  const items = getContentByTag(tag)

  if (items.length === 0) return { title: "Not found", robots: { index: false, follow: false } }

  return buildMetadata({
    title: `Writing on ${tag}`,
    description: `${items.length} ${items.length === 1 ? "piece" : "pieces"} by Ali Mirza on ${tag}${
      items.length > 1 ? `, including “${items[0].title}”` : ""
    }.`,
    path: `/tag/${encodeURIComponent(tag)}`,
    noIndex: items.length < MIN_INDEXABLE,
    ogEyebrow: "Tagged",
    ogMeta: `${items.length} ${items.length === 1 ? "piece" : "pieces"}`,
  })
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
      <CollectionSchema
        title={`Writing on ${tag}`}
        description={`Writing by Ali Mirza tagged ${tag}.`}
        path={`/tag/${encodeURIComponent(tag)}`}
        crumbs={[{ name: "Home", path: "/" }, { name: `#${tag}` }]}
      />

      <div className="page-layout">
        <div className="page-head">
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
