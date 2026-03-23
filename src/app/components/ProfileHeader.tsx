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
          <p className="profile-tagline">Entrepreneur, writer</p>
        </div>
      </div>

      <div className="profile-bio">
        <p>
          I build companies and write about what I learn along the way. Right now I&apos;m
          focused on <a href="https://www.janusny.com" target="_blank" rel="noopener noreferrer">JANUS</a>,
          a growth firm that increases revenue for businesses, and{" "}
          <a href="https://braskgroup.com" target="_blank" rel="noopener noreferrer">Brask</a>,
          a private network for early-stage entrepreneurs who want to build together.
        </p>
        <p>
          I also run <a href="https://almostmed.com" target="_blank" rel="noopener noreferrer">AlmostMed</a>,
          a resource hub with advice and templates I wish I had when I was applying to medical school.
          And I write a newsletter called{" "}
          <a href="https://thisisalimirza.substack.com" target="_blank" rel="noopener noreferrer">Thinking in Public</a>{" "}
          on systems, society, and how to build a principled life.
        </p>
        <p>
          In 2020 I decided to consume less and create more. This site is a record of that effort —
          essays and notes made public. <Link href="/writing">Read my writing.</Link>
        </p>
      </div>
    </header>
  )
}
