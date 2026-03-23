import Image from "next/image"
import Link from "next/link"
import { siteConfig } from "@/config/site"

export default function ProfileHeader() {
  return (
    <header className="profile-header">
      <Link href="/" className="profile-identity">
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
      </Link>

      <p className="profile-intro">
        Born in Pakistan, raised across four countries. After college I spent time at Epic Systems before realizing the problems I cared most about required building my own things. Now I&apos;m in medical school and shipping software.
      </p>

      <section className="profile-section">
        <h2 className="profile-section-label">Building</h2>
        <div className="card-grid">
          <a href="https://getrounds.app" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name card-name--active">Rounds</span>
            <span className="card-desc">Daily clinical case game for medical students</span>
          </a>
          <a href="https://usesitr.com" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name card-name--active">Sitr</span>
            <span className="card-desc">Event ticketing and seating management</span>
          </a>
          <a href="https://bylineblogs.com" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name card-name--active">Byline</span>
            <span className="card-desc">Automated blog pipeline for product-led SEO</span>
          </a>
          <a href="https://medatlas-omega.vercel.app" target="_blank" rel="noopener noreferrer" className="project-card project-card--muted">
            <span className="card-name">MedAtlas</span>
            <span className="card-desc">Medical school discovery and comparison platform</span>
          </a>
          <div className="project-card project-card--muted">
            <span className="card-name">JANUS</span>
            <span className="card-desc">Motion design studio — launched, ran, closed</span>
          </div>
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Apps & Tools</h2>
        <div className="card-grid">
          <a href="https://bullet-journal-app-zeta.vercel.app" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name">Bullet Journal</span>
            <span className="card-desc">Local analog journaling</span>
          </a>
          <a href="https://www.getraiseready.com" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name">Raise Ready</span>
            <span className="card-desc">Salary negotiation practice</span>
          </a>
          <a href="https://things-importer.vercel.app" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name">Better Tasks</span>
            <span className="card-desc">Capture tasks to Things 3</span>
          </a>
          <a href="https://timer.thisisalimirza.com" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name">Focus Timer</span>
            <span className="card-desc">Deep work timer</span>
          </a>
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-label">Research</h2>
        <div className="card-grid">
          <a href="https://www.researchgate.net/publication/392475117_Predicting_Inpatient_Risk_of_Mortality_in_Diabetic_Patients_Using_Administrative_Data_and_Machine_Learning_An_External_Validation_Study_Using_SPARCS" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name">ML & Clinical Outcomes</span>
            <span className="card-desc">Predicting inpatient mortality using administrative data and machine learning</span>
          </a>
          <a href="https://philarchive.org/rec/MIROSB" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name">Philosophy</span>
            <span className="card-desc">Published work in philosophy</span>
          </a>
        </div>
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
        <div className="card-grid">
          <a href="https://thisisalimirza.substack.com" target="_blank" rel="noopener noreferrer" className="project-card">
            <span className="card-name">Side Effects</span>
            <span className="card-desc">Newsletter on medicine, systems, and building</span>
          </a>
          <Link href="/writing" className="project-card">
            <span className="card-name">Essays & Memos</span>
            <span className="card-desc">Longform writing, short memos, and observations</span>
          </Link>
        </div>
      </section>
    </header>
  )
}
