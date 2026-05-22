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
              After college, I took a job at Epic Systems but quickly realized I was getting way more done on my side projects than my actual work. So I quit to launch a marketing agency. Building that business from scratch completely rewired how I look at self-agency and what I&apos;m capable of. Once it hit a healthy revenue target, I realized those entrepreneurial skills were locked in for life. That freed me up to chase the one thing I couldn&apos;t just teach/build myself: medicine. I started med school with the ultimate goal of seeing patients during regular hours, while spending the rest of my time trying to fix the biggest problems in healthcare and technology.
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
