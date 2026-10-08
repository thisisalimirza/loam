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
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-eyebrow">
              <span className="live-dot" />
              UConn medical student <span className="eyebrow-sep">/</span> founder
            </p>
            <h1 id="hero-title" className="hero-title">
              I build useful things at the edge of <em>medicine</em> and everyday life.
            </h1>
            <p className="hero-intro">
              I&apos;m Ali Mirza—an MD candidate at UConn, founder of Rounds, and builder working across medical education, restaurant checkout, and physician community.
            </p>
            <div className="hero-actions">
              <Link href="#work" className="button button-lime">
                See what I&apos;m building <span aria-hidden="true">↓</span>
              </Link>
              <a href={`mailto:${siteConfig.author.email}`} className="text-link light-link">
                Get in touch <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="hero-footnote">
              <span>Currently in Connecticut</span>
              <span className="footnote-line" />
              <span>Curious by default</span>
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
              <div className="portrait-caption">
                <span>ALI MIRZA</span>
                <span>MEDICINE × BUILDING</span>
              </div>
            </div>
            <div className="portrait-stamp">
              <span className="stamp-small">CURRENTLY</span>
              <strong>Building<br />Rounds</strong>
              <span className="stamp-arrow" aria-hidden="true">↗</span>
            </div>
            <span className="orbit orbit-one" aria-hidden="true" />
            <span className="orbit orbit-two" aria-hidden="true" />
          </div>
        </div>

        <div className="hero-bottom" aria-label="Areas of work">
          <span>01 <b>Medical education</b></span>
          <span>02 <b>Products</b></span>
          <span>03 <b>Community</b></span>
          <span>04 <b>Ideas in public</b></span>
        </div>
      </section>

      {/* Selected Work Section */}
      <section className="work-section section-pad" id="work" aria-labelledby="work-title">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="section-kicker">01 / Selected work</p>
              <h2 id="work-title">
                A few things I&apos;m<br className="desktop-break" /> putting into the world.
              </h2>
            </div>
            <p className="section-aside">
              Different problems, same instinct: make something useful and put it in people&apos;s hands.
            </p>
          </div>

          <div className="project-grid">
            {/* Rounds Card */}
            <article className="project-card rounds-card">
              <div className="project-copy">
                <div className="project-meta">
                  <span>01</span>
                  <span>Medical education · iOS</span>
                </div>
                <h3>Rounds</h3>
                <p>A daily case game that helps medical students practice Step 1 and build clinical reasoning.</p>
                <div className="proof-line">
                  <strong>500+</strong>
                  <span>First Aid–aligned cases</span>
                </div>
                <div className="project-links">
                  <a className="card-link" href={siteConfig.links.rounds} target="_blank" rel="noreferrer">
                    Explore Rounds <span aria-hidden="true">↗</span>
                  </a>
                  <a className="card-link" href="https://apps.apple.com/app/id6756315417" target="_blank" rel="noreferrer">
                    App Store <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
              <div className="rounds-visual" aria-label="Real Rounds app screen showing the daily case and game modes">
                <Image
                  src="/images/rounds-main.webp"
                  alt="Rounds app home screen with a daily case, case browser, leaderboard, and game modes"
                  width={720}
                  height={1500}
                  loading="lazy"
                />
                <span className="visual-label">A real screen from the app</span>
              </div>
            </article>

            {/* Tally Card */}
            <article className="project-card tally-card">
              <div className="project-meta">
                <span>02</span>
                <span>Restaurant technology · AI</span>
              </div>
              <div className="tally-art" aria-hidden="true">
                <span className="tally-ring ring-a" />
                <span className="tally-ring ring-b" />
                <span className="tally-word">TALLY</span>
                <span className="tally-chip">CHECKOUT, REWORKED</span>
                <span className="tally-art-foot">FAST-CASUAL<br />ORDER FLOW</span>
              </div>
              <div className="project-copy">
                <h3>Move the line along.</h3>
                <p>Tally is building AI checkout for assembly-line restaurants—designed to remove the register from the fast-casual line.</p>
                <a className="card-link" href={siteConfig.links.tally} target="_blank" rel="noreferrer">
                  Visit Tally <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>

            {/* MD+ Card */}
            <article className="project-card mdplus-card">
              <div className="project-meta">
                <span>03</span>
                <span>Community · partnerships</span>
              </div>
              <div className="mdplus-art" aria-hidden="true">
                <span className="plus-orbit orbit-left" />
                <span className="plus-orbit orbit-right" />
                <span className="mdplus-name">MD<span>+</span></span>
                <span className="member-number">5,000<span>+</span></span>
                <span className="member-caption">physicians & med students</span>
              </div>
              <div className="project-copy">
                <h3>More room to build in medicine.</h3>
                <p>At MD+, I lead sponsor and partner outreach for a medical education community where physicians and med students connect through events and a podcast.</p>
                <a className="card-link" href={siteConfig.links.mdplus} target="_blank" rel="noreferrer">
                  Meet MD+ <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          </div>

          <p className="fine-print">
            Rounds&apos; case count and MD+&apos;s community size reflect their public sites as of October 2026.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section section-pad" id="about" aria-labelledby="about-title">
        <div className="about-grid">
          <div className="about-heading">
            <p className="section-kicker">02 / A little context</p>
            <h2 id="about-title">
              Medicine keeps me close to the problem. Building gives me a way to try things.
            </h2>
            <div className="about-note">
              <span className="note-doodle" aria-hidden="true">↘</span>
              <span>That&apos;s the thread<br />running through it all.</span>
            </div>
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

      {/* Notes/Writing Section */}
      <section className="notes-section section-pad" id="notes" aria-labelledby="notes-title">
        <div className="wrap">
          <div className="section-heading notes-heading">
            <div>
              <p className="section-kicker">03 / Work in public</p>
              <h2 id="notes-title">
                Notes, videos,<br className="desktop-break" /> unfinished thoughts.
              </h2>
            </div>
            <p className="section-aside">
              I like sharing what I&apos;m learning while I&apos;m still learning it.
            </p>
          </div>

          <div className="media-grid">
            <Link href="/writing" className="media-card writing-card">
              <div className="media-top">
                <span className="media-icon writing-icon" aria-hidden="true">Aa</span>
                <span className="media-arrow" aria-hidden="true">↗</span>
              </div>
              <div>
                <span className="media-label">WRITING · ESSAYS</span>
                <h3>Medicine, technology,<br />and the things between.</h3>
                <span className="media-cta">Read the essays <span aria-hidden="true">→</span></span>
              </div>
            </Link>

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
            <p className="section-kicker">04 / Get in touch</p>
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
              <Link href="/writing">
                Writing <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
