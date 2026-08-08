import Image from "next/image"

import Ornament from "./Ornament"

const building = [
  {
    href: "https://getrounds.app",
    name: "Rounds",
    desc: "Daily clinical case game for medical students",
  },
  {
    href: "https://usesitr.com",
    name: "Sitr",
    desc: "Event ticketing and seating management",
  },
  {
    href: "https://bylineblogs.com",
    name: "Byline",
    desc: "Automated blog pipeline for product-led SEO",
  },
  {
    href: "https://mymedstack.com",
    name: "MedStack",
    desc: "Programmatic SEO for the physician pathway — 700+ pages, 1,000+ organic visitors in 5 days",
  },
]

const tools = [
  { href: "https://supertasks-app.vercel.app", name: "SuperTasks" },
  { href: "https://bullet-journal-app-zeta.vercel.app", name: "BuJo" },
  { href: "https://www.getraiseready.com", name: "Raise Ready" },
  { href: "https://things-importer.vercel.app", name: "Better Tasks" },
  { href: "https://timer.thisisalimirza.com", name: "Focus Timer" },
]

const books = [
  {
    href: "https://www.amazon.com/World-That-Works-Prosperity-Capitalism-ebook/dp/B0G5LV6F2G",
    cover: "https://m.media-amazon.com/images/I/61t9YX0iMVL._SL1500_.jpg",
    name: "A World That Works",
    desc: "Freedom, prosperity, and the honest case for capitalism",
  },
  {
    href: "https://www.amazon.com/Reveries-Through-Others-Stories-traveler-ebook/dp/B0CJ99H7DL",
    cover: "https://m.media-amazon.com/images/I/71u8Vthq34L._SL1500_.jpg",
    name: "Reveries",
    desc: "Through the eyes of others",
  },
  {
    href: "https://www.amazon.com/Wealth-At-20-Financial-Graduates-ebook/dp/B0CJBBSXW5",
    cover: "https://m.media-amazon.com/images/I/61fombI3cZL._SL1500_.jpg",
    name: "Wealth At 20",
    desc: "Financial planning for fresh college graduates",
  },
]

const papers = [
  {
    href: "https://www.researchgate.net/publication/392475117_Predicting_Inpatient_Risk_of_Mortality_in_Diabetic_Patients_Using_Administrative_Data_and_Machine_Learning_An_External_Validation_Study_Using_SPARCS",
    name: "ML & Clinical Outcomes",
    desc: "Predicting inpatient mortality in diabetic patients using administrative data and machine learning",
  },
  {
    href: "https://philarchive.org/rec/MIROSB",
    name: "Philosophy",
    desc: "Published work in philosophy",
  },
]

const external = { target: "_blank", rel: "noopener noreferrer" } as const

/** What I'm building, what I've shipped, and what I've published. */
export default function HomeWork() {
  return (
    <section className="section shell">
      <div className="section-head">
        <div>
          <h2 className="section-title">Building</h2>
          <p className="section-note">Live products, in active development.</p>
        </div>
      </div>

      <div className="work-grid">
        {building.map(item => (
          <a key={item.href} href={item.href} {...external} className="work-row">
            <span className="work-name">
              <span className="work-live" aria-hidden="true" />
              {item.name}
            </span>
            <span className="work-desc">{item.desc}</span>
          </a>
        ))}
      </div>

      <Ornament />

      <div className="section-head">
        <div>
          <h2 className="section-title">Apps &amp; Tools</h2>
        </div>
      </div>
      <p className="tools-inline">
        {tools.map((tool, index) => (
          <span key={tool.href}>
            {index > 0 && <span className="tools-sep" aria-hidden="true">·</span>}
            <a href={tool.href} {...external}>
              {tool.name}
            </a>
          </span>
        ))}
      </p>

      <Ornament />

      <div className="section-head">
        <div>
          <h2 className="section-title">Books</h2>
        </div>
      </div>
      <ul className="authored">
        {books.map(book => (
          <li key={book.href} className="authored-item">
            <a href={book.href} {...external}>
              <Image
                src={book.cover}
                alt={`${book.name} cover`}
                width={82}
                height={117}
                className="authored-cover"
              />
            </a>
            <span>
              <a href={book.href} {...external} className="authored-name">
                {book.name}
              </a>
              <span className="authored-desc">{book.desc}</span>
            </span>
          </li>
        ))}
      </ul>

      <Ornament />

      <div className="section-head">
        <div>
          <h2 className="section-title">Ancillary Independent Musings</h2>
        </div>
      </div>
      <div className="work-grid">
        {papers.map(paper => (
          <a key={paper.href} href={paper.href} {...external} className="work-row">
            <span className="work-name">{paper.name}</span>
            <span className="work-desc">{paper.desc}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
