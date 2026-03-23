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
            <a href="https://getrounds.app" target="_blank" rel="noopener noreferrer" className="project-name">Rounds</a>
            <span className="project-desc">Daily clinical case game for medical students</span>
          </li>
          <li className="project-item">
            <a href="https://usesitr.com" target="_blank" rel="noopener noreferrer" className="project-name">Sitr</a>
            <span className="project-desc">Event ticketing and seating management</span>
          </li>
          <li className="project-item">
            <span className="project-name project-name--plain">MedAtlas</span>
            <span className="project-desc">Medical school discovery and comparison platform for pre-meds</span>
          </li>
          <li className="project-item">
            <a href="https://bylineblogs.com" target="_blank" rel="noopener noreferrer" className="project-name">Byline</a>
            <span className="project-desc">Automated blog pipeline for product-led SEO</span>
          </li>
          <li className="project-item project-item--past">
            <span className="project-name project-name--plain">JANUS</span>
            <span className="project-desc">Motion design studio for businesses — launched, ran, closed</span>
          </li>
        </ul>
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
        <h2 className="profile-section-label">Writing</h2>
        <p className="profile-writing-note">
          I write{" "}
          <a href="https://thisisalimirza.substack.com" target="_blank" rel="noopener noreferrer">Side Effects</a>
          , a newsletter on medicine, systems, and building.{" "}
          <Link href="/writing">Read my essays and notes.</Link>
        </p>
      </section>
    </header>
  )
}
