import Image from "next/image"
import Link from "next/link"
import { siteConfig } from "@/config/site"

export default function ProfileHeader() {
  return (
    <header className="profile-header">
      <div className="profile-identity">
        <Image
          src={siteConfig.images.profile}
          alt={`${siteConfig.author.name} profile photo`}
          width={72}
          height={72}
          priority
          className="profile-image"
        />
        <div>
          <h1 className="profile-name">Ali Mirza</h1>
          <p className="profile-tagline">Medical student. Builder. Writer.</p>
        </div>
      </div>

      <p className="profile-intro">
        Born in Pakistan, raised across four countries. After college I spent time at Epic Systems before realizing the problems I cared most about required building my own things. Now I&apos;m in medical school and shipping software.
      </p>

      <section className="profile-section">
        <h2 className="profile-section-label">Building</h2>
        <ul className="project-list">
          <li className="project-item">
            <a href="https://getrounds.app" target="_blank" rel="noopener noreferrer" className="project-name project-name--active">Rounds</a>
            <span className="project-desc">Daily clinical case game for medical students</span>
          </li>
          <li className="project-item">
            <a href="https://usesitr.com" target="_blank" rel="noopener noreferrer" className="project-name project-name--active">Sitr</a>
            <span className="project-desc">Event ticketing and seating management</span>
          </li>
          <li className="project-item">
            <a href="https://bylineblogs.com" target="_blank" rel="noopener noreferrer" className="project-name project-name--active">Byline</a>
            <span className="project-desc">Automated blog pipeline for product-led SEO</span>
          </li>
          <li className="project-item project-item--secondary">
            <a href="https://medatlas-omega.vercel.app" target="_blank" rel="noopener noreferrer" className="project-name project-name--plain">MedAtlas</a>
            <span className="project-desc">Medical school discovery and comparison platform for pre-meds</span>
          </li>
          <li className="project-item project-item--past">
            <span className="project-name project-name--plain">JANUS</span>
            <span className="project-desc">Motion design studio for businesses — launched, ran, closed</span>
          </li>
        </ul>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Apps & Tools</h2>
        <div className="apps-grid">
          <a href="https://bullet-journal-app-zeta.vercel.app" target="_blank" rel="noopener noreferrer" className="app-item">
            <span className="app-name">Bullet Journal</span>
            <span className="app-desc">(local analog journaling)</span>
            <span className="app-arrow">→</span>
          </a>
          <a href="https://www.getraiseready.com" target="_blank" rel="noopener noreferrer" className="app-item">
            <span className="app-name">Raise Ready</span>
            <span className="app-desc">(salary negotiation practice)</span>
            <span className="app-arrow">→</span>
          </a>
          <a href="https://things-importer.vercel.app" target="_blank" rel="noopener noreferrer" className="app-item">
            <span className="app-name">Better Tasks</span>
            <span className="app-desc">(capture tasks to Things 3)</span>
            <span className="app-arrow">→</span>
          </a>
          <a href="https://timer.thisisalimirza.com" target="_blank" rel="noopener noreferrer" className="app-item">
            <span className="app-name">Focus Timer</span>
            <span className="app-desc">(deep work timer)</span>
            <span className="app-arrow">→</span>
          </a>
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Research</h2>
        <ul className="project-list">
          <li className="project-item">
            <a href="https://www.researchgate.net/publication/392475117_Predicting_Inpatient_Risk_of_Mortality_in_Diabetic_Patients_Using_Administrative_Data_and_Machine_Learning_An_External_Validation_Study_Using_SPARCS" target="_blank" rel="noopener noreferrer" className="project-name">ML &amp; Clinical Outcomes</a>
            <span className="project-desc">Predicting inpatient mortality in diabetic patients using administrative data and machine learning</span>
          </li>
          <li className="project-item">
            <a href="https://philarchive.org/rec/MIROSB" target="_blank" rel="noopener noreferrer" className="project-name">Philosophy</a>
            <span className="project-desc">Published work in philosophy</span>
          </li>
        </ul>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Books</h2>
        <ul className="book-list">
          <li className="book-item">
            <a href="https://www.amazon.com/World-That-Works-Prosperity-Capitalism-ebook/dp/B0G5LV6F2G" target="_blank" rel="noopener noreferrer">
              <img src="https://m.media-amazon.com/images/I/61t9YX0iMVL._SL1500_.jpg" alt="A World That Works cover" className="book-cover" />
            </a>
            <div className="book-info">
              <a href="https://www.amazon.com/World-That-Works-Prosperity-Capitalism-ebook/dp/B0G5LV6F2G" target="_blank" rel="noopener noreferrer" className="book-name">A World That Works</a>
              <span className="book-desc">Freedom, prosperity, and the honest case for capitalism</span>
            </div>
          </li>
          <li className="book-item">
            <a href="https://www.amazon.com/Reveries-Through-Others-Stories-traveler-ebook/dp/B0CJ99H7DL" target="_blank" rel="noopener noreferrer">
              <img src="https://m.media-amazon.com/images/I/71u8Vthq34L._SL1500_.jpg" alt="Reveries cover" className="book-cover" />
            </a>
            <div className="book-info">
              <a href="https://www.amazon.com/Reveries-Through-Others-Stories-traveler-ebook/dp/B0CJ99H7DL" target="_blank" rel="noopener noreferrer" className="book-name">Reveries</a>
              <span className="book-desc">Through the eyes of others</span>
            </div>
          </li>
          <li className="book-item">
            <a href="https://www.amazon.com/Wealth-At-20-Financial-Graduates-ebook/dp/B0CJBBSXW5" target="_blank" rel="noopener noreferrer">
              <img src="https://m.media-amazon.com/images/I/61fombI3cZL._SL1500_.jpg" alt="Wealth At 20 cover" className="book-cover" />
            </a>
            <div className="book-info">
              <a href="https://www.amazon.com/Wealth-At-20-Financial-Graduates-ebook/dp/B0CJBBSXW5" target="_blank" rel="noopener noreferrer" className="book-name">Wealth At 20</a>
              <span className="book-desc">Financial planning for fresh college graduates</span>
            </div>
          </li>
        </ul>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Writing</h2>
        <ul className="project-list">
          <li className="project-item">
            <a href="https://thisisalimirza.substack.com" target="_blank" rel="noopener noreferrer" className="project-name">Side Effects</a>
            <span className="project-desc">Newsletter on medicine, systems, and building</span>
          </li>
          <li className="project-item">
            <Link href="/writing" className="project-name">Essays & Memos</Link>
            <span className="project-desc">Longform writing, short memos, and observations on this site</span>
          </li>
        </ul>
      </section>
    </header>
  )
}
