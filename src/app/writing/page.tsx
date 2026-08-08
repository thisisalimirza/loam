import { getAllContent } from "@/lib/getAllContent"
import MetaHead from "@/app/components/MetaHead"
import WritingListClient from "./WritingListClient"

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
      <MetaHead
        title="Writing"
        description="Essays, memos, and notes by Ali Mirza."
        canonical="/writing"
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
