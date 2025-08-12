import Image from "next/image"
import Link from "next/link"
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
      <h1 className="profile-title">👋 Hi, I&apos;m Ali.</h1>
      <p className="profile-description">
        In 2020, I decided to consume less and create more.
        <br />
        This is a private living library of my mind and projects. Here&apos;s how to explore:
      </p>
      
      <div className="visitor-guide">
        <div className="visitor-grid">
          <div className="visitor-section">
            <h3>🧠 My values and thinking</h3>
            <p>→ <Link href="/meditations">Read My Meditations</Link><br />
            Short, raw reflections on life, self-discipline, ambition, and meaning — a living notebook in the spirit of Marcus Aurelius.</p>
            <p>→ <a href="https://thisisalimirza.substack.com/" target="_blank" rel="noopener noreferrer">Subscribe to Thinking in Public</a><br />
            Deeper essays on systems, society, and how to build a principled life.</p>
          </div>

          <div className="visitor-section">
            <h3>🚀 My Junto for ambitious early-stage entrepreneurs</h3>
            <p>→ <a href="https://braskgroup.com/" target="_blank" rel="noopener noreferrer">Join Brask</a><br />
            A private network of ambitious early-stage entrepreneurs. We build together, support each other, and grow in public and private.</p>
          </div>

          <div className="visitor-section">
            <h3>📬 Receive updates on my progress (for mentors & investors)</h3>
            <p>→ <a href="https://tally.so/r/mRqJDd" target="_blank" rel="noopener noreferrer">Join My Advisor List</a><br />
            One concise update per month on what I&apos;m building, how things are going, and how you can support if you&apos;d like.</p>
          </div>

          <div className="visitor-section">
            <h3>🎓 For premeds who want some guidance</h3>
            <p>→ <a href="https://almostmed.com" target="_blank" rel="noopener noreferrer">Get My Premed Resources</a><br />
            Advice, templates, and encouragement I wish I had earlier. Join a list or access a resource hub.</p>
          </div>

          <div className="visitor-section">
            <h3>🧩 Hire me to increase sales by 10%</h3>
            <p>→ <a href="https://www.janusny.com" target="_blank" rel="noopener noreferrer">Work with JANUS</a><br />
            I guarantee to grow your LTV/CAC & add at least 25% additional revenue to your business in 3 months or work for free until we do.</p>
          </div>

          <div className="visitor-section">
            <h3>🔎 You&apos;re just curious what I&apos;m working on?</h3>
            <p>→ <Link href="/notebooks">See My Live Project Log</Link><br />
            A public record of what I&apos;m building, prioritizing, and committing to each week. Real-time updates on JANUS, Brask, writing, and beyond.</p>
          </div>
        </div>
        
        {/* <div className="visitor-fallback">
          <div className="visitor-section">
            <h3>🌀 Not sure?</h3>
            <p>→ Explore the rest of this site<br />
            My personal digital garden — start wandering and see what speaks to you.</p>
          </div>
        </div> */}
      </div>
    </header>
  )
}