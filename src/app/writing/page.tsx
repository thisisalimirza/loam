import { getAllContent } from "@/lib/getAllContent"
import { CollectionSchema } from "@/app/components/StructuredData"
import { buildMetadata } from "@/lib/seo"
import WritingListClient from "./WritingListClient"

export const metadata = buildMetadata({
  title: "Writing",
  description:
    "Essays, memos and vignettes by Ali Mirza on medicine, technology, philosophy and what stays constant across centuries — the full archive, going back to 2015.",
  path: "/writing",
  ogEyebrow: "The archive",
})

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

  return (
    <>
      <CollectionSchema
        title="Writing"
        description="Essays, memos and vignettes by Ali Mirza."
        path="/writing"
        crumbs={[{ name: "Home", path: "/" }, { name: "Writing" }]}
      />
      <div className="page-layout">
        <div className="page-head">
          <p className="eyebrow">The archive</p>
          <h1 className="page-title">Writing</h1>
          <p className="page-intro">
            Essays, memos, and vignettes going back to 2015 — {published.length} pieces in all.
          </p>
        </div>

        <WritingListClient items={published} />
      </div>
    </>
  )
}
