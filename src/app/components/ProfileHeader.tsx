import Image from "next/image"
import Link from "next/link"

export default function ProfileHeader() {
  return (
    <div className="profile-sections">
      <section className="profile-section">
        <h2 className="profile-section-label">Building</h2>
        <div>
          <a href="https://getrounds.app" target="_blank" rel="noopener noreferrer" className="project-row">
            <span className="project-row-name project-row-name--active">Rounds</span>
            <span className="project-row-sep">—</span>
            <span className="project-row-desc">Daily clinical case game for medical students</span>
          </a>
          <a href="https://usesitr.com" target="_blank" rel="noopener noreferrer" className="project-row">
            <span className="project-row-name project-row-name--active">Sitr</span>
            <span className="project-row-sep">—</span>
            <span className="project-row-desc">Event ticketing and seating management</span>
          </a>
          <a href="https://bylineblogs.com" target="_blank" rel="noopener noreferrer" className="project-row">
            <span className="project-row-name project-row-name--active">Byline</span>
            <span className="project-row-sep">—</span>
            <span className="project-row-desc">Automated blog pipeline for product-led SEO</span>
          </a>
          <a href="https://mymedstack.com" target="_blank" rel="noopener noreferrer" className="project-row project-row--muted">
            <span className="project-row-name">MedStack</span>
            <span className="project-row-sep">—</span>
            <span className="project-row-desc">All-in-one toolkit for the physician pipeline</span>
          </a>
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Apps & Tools</h2>
        <p className="tools-inline">
          <a href="https://bullet-journal-app-zeta.vercel.app" target="_blank" rel="noopener noreferrer">Bullet Journal</a>
          <span className="tools-sep">·</span>
          <a href="https://www.getraiseready.com" target="_blank" rel="noopener noreferrer">Raise Ready</a>
          <span className="tools-sep">·</span>
          <a href="https://things-importer.vercel.app" target="_blank" rel="noopener noreferrer">Better Tasks</a>
          <span className="tools-sep">·</span>
          <a href="https://timer.thisisalimirza.com" target="_blank" rel="noopener noreferrer">Focus Timer</a>
        </p>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Writing</h2>
        <ul className="project-list">
          <li className="project-item">
            <a href="https://thisisalimirza.substack.com" target="_blank" rel="noopener noreferrer" className="project-name">Newsletter (Side Effects)</a>
            <span className="project-desc">Newsletter on medicine, systems, and building</span>
          </li>
          <li className="project-item">
            <Link href="/writing" className="project-name">Scratch Notes</Link>
            <span className="project-desc">Quick jots, and unpolished thoughts</span>
          </li>
        </ul>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Books</h2>
        <ul className="book-list">
          <li className="book-item">
            <a href="https://www.amazon.com/World-That-Works-Prosperity-Capitalism-ebook/dp/B0G5LV6F2G" target="_blank" rel="noopener noreferrer">
              <Image src="https://m.media-amazon.com/images/I/61t9YX0iMVL._SL1500_.jpg" alt="A World That Works cover" width={90} height={128} className="book-cover" />
            </a>
            <div className="book-info">
              <a href="https://www.amazon.com/World-That-Works-Prosperity-Capitalism-ebook/dp/B0G5LV6F2G" target="_blank" rel="noopener noreferrer" className="book-name">A World That Works</a>
              <span className="book-desc">Freedom, prosperity, and the honest case for capitalism</span>
            </div>
          </li>
          <li className="book-item">
            <a href="https://www.amazon.com/Reveries-Through-Others-Stories-traveler-ebook/dp/B0CJ99H7DL" target="_blank" rel="noopener noreferrer">
              <Image src="https://m.media-amazon.com/images/I/71u8Vthq34L._SL1500_.jpg" alt="Reveries cover" width={90} height={128} className="book-cover" />
            </a>
            <div className="book-info">
              <a href="https://www.amazon.com/Reveries-Through-Others-Stories-traveler-ebook/dp/B0CJ99H7DL" target="_blank" rel="noopener noreferrer" className="book-name">Reveries</a>
              <span className="book-desc">Through the eyes of others</span>
            </div>
          </li>
          <li className="book-item">
            <a href="https://www.amazon.com/Wealth-At-20-Financial-Graduates-ebook/dp/B0CJBBSXW5" target="_blank" rel="noopener noreferrer">
              <Image src="https://m.media-amazon.com/images/I/61fombI3cZL._SL1500_.jpg" alt="Wealth At 20 cover" width={90} height={128} className="book-cover" />
            </a>
            <div className="book-info">
              <a href="https://www.amazon.com/Wealth-At-20-Financial-Graduates-ebook/dp/B0CJBBSXW5" target="_blank" rel="noopener noreferrer" className="book-name">Wealth At 20</a>
              <span className="book-desc">Financial planning for fresh college graduates</span>
            </div>
          </li>
        </ul>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Ancillary Independent Musings</h2>
        <ul className="project-list">
          <li className="project-item">
            <a href="https://www.researchgate.net/publication/392475117_Predicting_Inpatient_Risk_of_Mortality_in_Diabetic_Patients_Using_Administrative_Data_and_Machine_Learning_An_External_Validation_Study_Using_SPARCS" target="_blank" rel="noopener noreferrer" className="project-name">ML & Clinical Outcomes</a>
            <span className="project-desc">Predicting inpatient mortality in diabetic patients using administrative data and machine learning</span>
          </li>
          <li className="project-item">
            <a href="https://philarchive.org/rec/MIROSB" target="_blank" rel="noopener noreferrer" className="project-name">Philosophy</a>
            <span className="project-desc">Published work in philosophy</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
