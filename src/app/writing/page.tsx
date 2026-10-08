import Link from "next/link"
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
          <p className="eyebrow">The archive</p>
          <h1 className="page-title">Writing</h1>
          <p className="page-intro">
            Ten years of essays, memos, and vignettes — {published.length} pieces in all.
            Click any topic to explore, or jump to the <Link href="#archive" className="archive-link">full archive</Link> below.
          </p>
        </div>

        {/* Tag Cloud Section */}
        <section className="writing-topics">
          <h2 className="writing-topics-title">What I write about</h2>
          <TagCloud tags={tags} />
        </section>

        {/* Archive Section */}
        <section id="archive" className="writing-archive">
          <div className="archive-header">
            <h2 className="archive-title">The full archive</h2>
            <p className="archive-note">All {published.length} pieces, from newest to oldest.</p>
          </div>
          <WritingListClient items={published} />
        </section>
      </div>
    </>
  )
}
