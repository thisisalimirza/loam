import fs from "fs"
import Image from "next/image"
import Link from "next/link"

import MetaHead from "./MetaHead"
import StructuredData from "./StructuredData"
import TagCloud from "./TagCloud"
import EntryList from "./EntryList"
import HomeWork from "./HomeWork"
import { getAllTags } from "@/lib/getAllTags"
import { getAllContent } from "@/lib/getAllContent"
import { getHomeStats } from "@/lib/getHomeStats"
import { siteConfig } from "@/config/site"
import { ContentItem } from "@/types"

const RECENT_COUNT = 6

/** Newest published writing first, dated by frontmatter or file birth time. */
function recentWriting(): ContentItem[] {
  return getAllContent()
    .filter(item => item.published !== false && item.section !== "")
    .map(item => {
      let effectiveDate = item.date
      if (!effectiveDate && item.filePath) {
        try {
          effectiveDate = fs.statSync(item.filePath).birthtime.toISOString().slice(0, 10)
        } catch {}
      }
      return { ...item, effectiveDate }
    })
    .sort((a, b) => (b.effectiveDate || "").localeCompare(a.effectiveDate || ""))
    .slice(0, RECENT_COUNT)
}

export default function HomePage() {
  const tags = getAllTags()
  const stats = getHomeStats()
  const recent = recentWriting()

  const doors = [
    {
      href: "/writing",
      name: "Writing",
      desc: "Essays, memos, and vignettes going back to 2015.",
      count: `${stats.pieces} pieces`,
    },
    {
      href: "/reading",
      name: "Book Notes",
      desc: "Highlights and margin notes from everything I read.",
      count: `${stats.books} books · ${(stats.highlights / 1000).toFixed(1)}k highlights`,
    },
    {
      href: "/meditations",
      name: "Meditations",
      desc: "Aphorisms and life lessons worth remembering.",
      count: `${stats.meditations} entries`,
    },
    {
      href: "/projects",
      name: "Projects",
      desc: "Apps and tools I've built.",
      count: `${stats.projects} shipped`,
    },
  ]

  return (
    <>
      <MetaHead />
      <StructuredData type="website" />

      {/* ---- Introduction ---- */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <h1 className="hero-name rise rise-1">Ali Mirza</h1>
            <p className="hero-line rise rise-2">
              Building and writing at the intersection of medicine, technology, and{" "}
              <em>what stays constant across centuries and cultures.</em>
            </p>
            <div className="hero-actions rise rise-3">
              <Link href="/start-here" className="btn btn--solid">
                Start here <span className="arrow" aria-hidden="true">→</span>
              </Link>
              <Link href="/writing" className="btn btn--ghost">
                Read the writing
              </Link>
              <Link href="/about" className="btn btn--ghost">
                About me
              </Link>
            </div>
          </div>

          <Image
            src="/profilepic.jpg"
            alt="Ali Mirza"
            width={168}
            height={168}
            priority
            className="hero-portrait rise rise-2"
          />
        </div>
      </section>

      {/* ---- Four doors into the site ---- */}
      <div className="shell">
        <nav className="doors" aria-label="Sections">
          {doors.map((door, index) => (
            <Link key={door.href} href={door.href} className="door">
              <span className="door-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="door-name">{door.name}</span>
              <span className="door-desc">{door.desc}</span>
              <span className="door-count">{door.count}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* ---- Latest writing ---- */}
      <section className="section shell">
        <div className="section-head">
          <div>
            <h2 className="section-title">Latest writing</h2>
          </div>
          <Link href="/writing" className="section-more">
            All {stats.pieces} pieces <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <EntryList items={recent} />
      </section>

      {/* ---- Themes ---- */}
      <div className="band">
        <section className="section shell">
          <div className="section-head">
            <div>
              <h2 className="section-title">What I write about</h2>
              <p className="section-note">
                Ten years of essays, memos, and vignettes — sized by how often each theme comes up.
              </p>
            </div>
          </div>
          <TagCloud tags={tags} />
        </section>
      </div>

      {/* ---- Building, tools, books, papers ---- */}
      <HomeWork />

      {/* ---- Newsletter ---- */}
      <div className="band">
        <section className="section section--tight shell">
          <div className="subscribe">
            <div>
              <h2 className="subscribe-title">Side Effects</h2>
              <p className="subscribe-note">
                My newsletter on medicine, systems, and building.
              </p>
            </div>
            <a
              href={siteConfig.links.newsletter}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--solid"
            >
              Subscribe <span className="arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </div>
    </>
  )
}
