import BreadcrumbsServer from "./BreadcrumbsServer"
import ProfileHeader from "./ProfileHeader"
import TagCloud from "./TagCloud"
import Footer from "./Footer"
import MetaHead from "./MetaHead"
import StructuredData from "./StructuredData"
import { getAllTags } from "@/lib/getAllTags"
import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  const tags = getAllTags()

  return (
    <>
      <MetaHead />
      <StructuredData type="website" />

      <div className="home-wrap">
        <BreadcrumbsServer />

        <div className="home-grid">
          <aside className="home-aside">
            <Image
              src="/profilepic.jpg"
              alt="Ali Mirza"
              width={80}
              height={80}
              className="home-aside-photo"
            />
            <p className="home-aside-bio">
              I quit my job at Epic to build a marketing agency. That experience showed me that I already had the self-agency I needed to build real things. Once the business hit a healthy profit, I went to med school. The goal: see patients, and spend the rest of my time fixing challenging problems in healthcare and technology.
            </p>
            <Link href="/start-here" className="home-aside-start-link">New here? Start here →</Link>
            <hr className="home-aside-rule" />
            <h3 className="home-aside-contact-title">Get in touch</h3>
            <p className="home-aside-contact-text">
              Find me on{" "}
              <a href="https://twitter.com/thisisalimirza" target="_blank" rel="noopener noreferrer">
                Twitter
              </a>
              {" "}or email{" "}
              <a href="mailto:ali@janusny.com">ali@janusny.com</a>.
              I try to respond to everything.
            </p>
          </aside>

          <main className="home-main">
            <section className="home-topics">
              <h1 className="home-topics-title">What I write about</h1>
              <p className="home-topics-intro">
                A decade of essays, memos, and vignettes — explore by theme, or{" "}
                <Link href="/writing">browse everything</Link>.
              </p>
              <TagCloud tags={tags} />
            </section>

            <hr className="home-secondary-rule" />

            <section className="home-secondary">
              <ProfileHeader />
            </section>
          </main>
        </div>

        <Footer />
      </div>
    </>
  )
}
