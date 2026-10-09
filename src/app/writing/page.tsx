import { getAllContent } from "@/lib/getAllContent"
import { getAllTags } from "@/lib/getAllTags"
import { CollectionSchema } from "@/app/components/StructuredData"
import { buildMetadata } from "@/lib/seo"
import TagCloud from "@/app/components/TagCloud"
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
  const tags = getAllTags()

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
          <h1 className="page-title">Writing</h1>
          <p className="page-intro">
            For polished essays on medicine, technology, and judgment, visit{" "}
            <a href="https://blog.thisisalimirza.com/" target="_blank" rel="noreferrer" className="inversions-link">
              Inversions
            </a>
            —my Substack where the finished work goes.
          </p>
          <p className="page-intro archive-note">
            This archive is different: ten years of drafts, notes, and half-formed thoughts—{published.length} pieces in all.
          </p>
        </div>

        <section className="writing-topics">
          <TagCloud tags={tags} />
        </section>

        <section id="archive" className="writing-archive">
          <WritingListClient items={published} />
        </section>
      </div>
    </>
  )
}
