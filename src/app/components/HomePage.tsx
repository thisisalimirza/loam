import BreadcrumbsServer from "./BreadcrumbsServer"
import ProfileHeader from "./ProfileHeader"
import Footer from "./Footer"
import MetaHead from "./MetaHead"
import StructuredData from "./StructuredData"
import Image from "next/image"

export default function HomePage() {
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
              I quit my job at Epic to build a marketing agency from scratch — that experience locked in the self-agency I needed for life. Once the business hit its stride, I went to med school. The goal: see patients, and spend the rest of my time fixing the biggest problems in healthcare and technology.
            </p>
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
            <ProfileHeader />
          </main>
        </div>

        <Footer />
      </div>
    </>
  )
}
