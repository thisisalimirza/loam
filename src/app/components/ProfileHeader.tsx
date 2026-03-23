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

      <div className="profile-bio">
        <p>
          I grew up across four countries — Pakistan, Lebanon, Kenya, and eventually the United States — before college and a stint at Epic Systems, the world&apos;s dominant health IT company.
          I loved what I was learning. But I kept feeling like I was doing more before graduation than after, and that the hardest problems I wanted to solve weren&apos;t going to get solved from inside a large organization.
        </p>
        <p>
          The day after I submitted my medical school applications, I started cold-calling local businesses. That became{" "}
          <a href="https://www.janusny.com" target="_blank" rel="noopener noreferrer">JANUS</a>{" "}
          — a motion design studio making launch videos for businesses that wanted to look more modern than their peers. It grew fast enough to matter, then fell apart when I handed it off too quickly as medical school started. I shut it down and pivoted to building things that compound in medicine. Since then I&apos;ve been doing machine learning research in clinical outcomes and shipping software:{" "}
          <a href="https://getrounds.app" target="_blank" rel="noopener noreferrer">Rounds</a>{" "}
          (a daily clinical case game for medical students),{" "}
          <a href="https://usesitr.com" target="_blank" rel="noopener noreferrer">Sitr</a>{" "}
          (event ticketing and seating management, originally prototyped for inpatient bed planning), MedAtlas (a discovery and comparison platform for pre-meds researching schools), and{" "}
          <a href="https://bylineblogs.com" target="_blank" rel="noopener noreferrer">Byline</a>{" "}
          — a blog pipeline I built after noticing that hastily-written product pages were driving more organic traffic than I expected.
        </p>
        <p>
          I write a newsletter called{" "}
          <a href="https://thisisalimirza.substack.com" target="_blank" rel="noopener noreferrer">Side Effects</a>.
          This site is the rest — essays, notes, and thinking made public. <Link href="/writing">Read my writing.</Link>
        </p>
      </div>
    </header>
  )
}
