import Image from "next/image"
import { siteConfig } from "@/config/site"

export default function ProfileHeader() {
  return (
    <header className="profile-header">
      <Image
        src={siteConfig.images.profile}
        alt={`${siteConfig.author.name} profile photo`}
        width={siteConfig.images.profileSize.width}
        height={siteConfig.images.profileSize.height}
        priority
        className="profile-image"
      />
      <h1 className="profile-title">Hi, I&apos;m Ali.</h1>
      <p className="profile-description">
        This is a Library of my Mind.
        <br />
        You can visit, wander, and take something—even if you only stay for 5 minutes.
      </p>
      <blockquote className="profile-quote">
        &quot;I write to think. To remember. To challenge. To understand.&quot;
      </blockquote>
    </header>
  )
}