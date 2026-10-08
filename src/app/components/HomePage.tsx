import Image from "next/image"
import Link from "next/link"

import { SiteSchema } from "./StructuredData"
import { siteConfig } from "@/config/site"

export default function HomePage() {
  return (
    <>
      <SiteSchema />

      {/* Hero Section */}
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-eyebrow">
              UConn medical student <span className="eyebrow-sep">/</span> founder
            </p>
            <h1 id="hero-title" className="hero-title">
              I build useful things at the edge of <em>medicine</em> and everyday life.
            </h1>
            <p className="hero-intro">
              I&apos;m Ali Mirza—an MD candidate at UConn, founder of Rounds, and builder working across medical education, event management, and physician community.
            </p>
            <div className="hero-actions">
              <Link href="#work" className="button button-lime">
                See what I&apos;m building <span aria-hidden="true">↓</span>
              </Link>
              <a href={`mailto:${siteConfig.author.email}`} className="text-link light-link">
                Get in touch <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="portrait-stage">
            <div className="portrait-frame">
              <Image
                src="/images/ali-mirza.webp"
                width={960}
                height={1200}
                alt="Ali Mirza smiling outdoors"
                priority
              />
            </div>
            <div className="portrait-stamp">
              <strong>Building<br />Rounds</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Work Section */}
      <section className="work-section section-pad" id="work" aria-labelledby="work-title">
        <div className="wrap">
          <div className="section-heading">
            <h2 id="work-title">
              A few things I&apos;m putting into the world.
            </h2>
          </div>

          <div className="project-grid">
            {/* Rounds Card */}
            <article className="project-card rounds-card">
              <div className="project-art rounds-art" aria-hidden="true">
                <span className="art-name">ROUNDS</span>
                <span className="art-stat">500<span>+</span></span>
                <span className="art-caption">First Aid–aligned cases</span>
              </div>
              <div className="project-copy">
                <h3>Better clinical reasoning for medical students with Rounds.</h3>
                <p>A daily case game that helps medical students practice Step 1.</p>
                <div className="project-links">
                  <a className="card-link" href={siteConfig.links.rounds} target="_blank" rel="noreferrer">
                    Explore Rounds <span aria-hidden="true">↗</span>
                  </a>
                  <a className="card-link" href="https://apps.apple.com/app/id6756315417" target="_blank" rel="noreferrer">
                    App Store <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>

            {/* Sitr Card */}
            <article className="project-card sitr-card">
              <div className="project-art sitr-art" aria-hidden="true">
                <span className="art-name">SITR</span>
                <span className="art-icon">📍</span>
                <span className="art-caption">Event ticketing & seating</span>
              </div>
              <div className="project-copy">
                <h3>Bringing people together with Sitr.</h3>
                <p>A full event platform for ticketing, seating management, and attendee logistics—built after a friend needed help managing 400 guests at a med school formal.</p>
                <div className="project-links">
                  <a className="card-link" href={siteConfig.links.sitr} target="_blank" rel="noreferrer">
                    Visit Sitr <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>

            {/* MD+ Card */}
            <article className="project-card mdplus-card">
              <div className="project-art mdplus-art" aria-hidden="true">
                <span className="art-name">MD<span className="plus">+</span></span>
                <span className="art-stat">5,000<span>+</span></span>
                <span className="art-caption">physicians & med students</span>
              </div>
              <div className="project-copy">
                <h3>Building community for the next generation of physician-innovators.</h3>
                <p>At MD+, I lead sponsor and partner outreach for a medical education community where physicians and med students connect through events and a podcast.</p>
                <div className="project-links">
                  <a className="card-link" href={siteConfig.links.mdplus} target="_blank" rel="noreferrer">
                    Meet MD+ <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section section-pad" id="about" aria-labelledby="about-title">
        <div className="about-grid">
          <div className="about-heading">
            <h2 id="about-title">
              Medicine keeps me close to the problem. Building gives me a way to try things.
            </h2>
          </div>

          <div className="about-body">
            <p className="about-lead">
              I&apos;m an MD candidate at the University of Connecticut School of Medicine and the founder of Rounds.
            </p>
            <p>
              I grew up across Pakistan, Lebanon, Kenya, and the U.S. I planned on medicine, but first worked at Epic, where I co-led one of the company&apos;s early collaborative installs and helped launch two more hospital EMR systems. I later started a marketing agency and grew it to a team of three. Now I&apos;m an MD candidate at UConn, building in the gaps.
            </p>
            <p>
              At MD+, I lead sponsor and partner outreach for a medical education community with events and a podcast. I write about medicine, technology, and judgment, and share the process on YouTube.
            </p>

            <div className="experience-list" aria-label="Current focus">
              <div>
                <span>Training</span>
                <strong>UConn School of Medicine</strong>
              </div>
              <div>
                <span>Building</span>
                <strong>Rounds · Founder</strong>
              </div>
              <div>
                <span>Connecting</span>
                <strong>MD+ · Partnerships</strong>
              </div>
              <div>
                <span>Previously</span>
                <strong>Epic · hospital EMR launches</strong>
              </div>
              <div>
                <span>Founded</span>
                <strong>Marketing agency · team of 3</strong>
              </div>
            </div>

            <a className="text-link dark-link" href={siteConfig.links.linkedin} target="_blank" rel="noreferrer">
              More about my background on LinkedIn <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section className="books-section section-pad" id="books" aria-labelledby="books-title">
        <div className="wrap">
          <div className="section-heading books-heading">
            <h2 id="books-title">Books I&apos;ve written</h2>
          </div>
          <div className="books-grid">
            <a className="book-item" href="https://www.amazon.com/World-That-Works-Prosperity-Capitalism-ebook/dp/B0G5LV6F2G" target="_blank" rel="noreferrer">
              <Image
                src="https://m.media-amazon.com/images/I/61t9YX0iMVL._SL1500_.jpg"
                alt="A World That Works book cover"
                width={120}
                height={180}
                className="book-item-cover"
              />
              <span className="book-info">
                <strong>A World That Works</strong>
                <span>A back and forth conversation between a Capitalist and a Socialist, written in the style of Plato&apos;s The Republic.</span>
              </span>
            </a>
            <a className="book-item" href="https://www.amazon.com/Reveries-Through-Others-Stories-traveler-ebook/dp/B0CJ99H7DL" target="_blank" rel="noreferrer">
              <Image
                src="https://m.media-amazon.com/images/I/71u8Vthq34L._SL1500_.jpg"
                alt="Reveries book cover"
                width={120}
                height={180}
                className="book-item-cover"
              />
              <span className="book-info">
                <strong>Reveries</strong>
                <span>A collection of vignettes as I reflect on my upbringing across the world, trying to make sense of the vast difference of New York City streets versus those I grew up in in Pakistan and Kenya. I wrote these stories when I was roughly 16 years old.</span>
              </span>
            </a>
            <a className="book-item" href="https://www.amazon.com/Wealth-At-20-Financial-Graduates-ebook/dp/B0CJBBSXW5" target="_blank" rel="noreferrer">
              <Image
                src="https://m.media-amazon.com/images/I/61fombI3cZL._SL1500_.jpg"
                alt="Wealth At 20 book cover"
                width={120}
                height={180}
                className="book-item-cover"
              />
              <span className="book-info">
                <strong>Wealth At 20</strong>
                <span>I am no expert at money or finances. Despite this I have always been the go to for finance knowledge for my family and friends. This was a distillation of the most actionable and immediate advice and insights I&apos;d give someone who has just graduated undergrad, is getting their first real paycheck, and wants to know how to best use it.</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Notes/Writing Section */}
      <section className="notes-section section-pad" id="notes" aria-labelledby="notes-title">
        <div className="wrap">
          <div className="section-heading notes-heading">
            <h2 id="notes-title">
              Notes, videos,<br className="desktop-break" /> unfinished thoughts.
            </h2>
          </div>

          <div className="media-grid">
            <a className="media-card writing-card" href={siteConfig.links.blog} target="_blank" rel="noreferrer">
              <div className="media-top">
                <span className="media-icon writing-icon" aria-hidden="true">Aa</span>
                <span className="media-arrow" aria-hidden="true">↗</span>
              </div>
              <div>
                <span className="media-label">WRITING · INVERSIONS</span>
                <h3>Medicine, technology,<br />and the things between.</h3>
                <span className="media-cta">Read the essays <span aria-hidden="true">→</span></span>
              </div>
            </a>

            <a className="media-card video-card" href={siteConfig.links.youtube} target="_blank" rel="noreferrer">
              <div className="video-orbit" aria-hidden="true">
                <span className="play-triangle" />
              </div>
              <div className="media-top video-top">
                <span className="media-label">YOUTUBE · @THISISALIMIRZA</span>
                <span className="media-arrow" aria-hidden="true">↗</span>
              </div>
              <div>
                <h3>Trying things.<br />Sharing the process.</h3>
                <span className="media-cta">Watch on YouTube <span aria-hidden="true">→</span></span>
              </div>
              <span className="video-grid-lines" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <div className="contact-grid">
          <div>
            <h2 id="contact-title">
              Have a good<br /><em>problem</em> to solve?
            </h2>
          </div>
          <div className="contact-copy">
            <p>
              I&apos;m always up for a thoughtful note, a useful connection, or a conversation about something you&apos;re building.
            </p>
            <a className="button button-lime" href={`mailto:${siteConfig.author.email}`}>
              Email me <span aria-hidden="true">↗</span>
            </a>
            <div className="social-links">
              <a href={siteConfig.links.linkedin} target="_blank" rel="noreferrer">
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
              <a href={siteConfig.links.youtube} target="_blank" rel="noreferrer">
                YouTube <span aria-hidden="true">↗</span>
              </a>
              <a href={siteConfig.links.blog} target="_blank" rel="noreferrer">
                Inversions <span aria-hidden="true">↗</span>
              </a>
              <Link href="/writing">
                Archive <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
