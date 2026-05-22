import BreadcrumbsServer from "@/app/components/BreadcrumbsServer"
import Footer from "@/app/components/Footer"
import MetaHead from "@/app/components/MetaHead"

export default function FuturePage() {
  return (
    <>
      <MetaHead
        title="Future"
        description="What I actually believe, as of right now."
        canonical="/future"
      />

      <div className="future-wrap">
        <BreadcrumbsServer />

        <div className="future-header">
          <h1 className="future-title">The future I want to build</h1>
          <p className="future-date">May 2026</p>
          <p className="future-intro">
            Here&apos;s what I actually believe. Not what I think sounds good, or what positions me
            correctly, or what the people in my field tend to say. What I actually think, as of
            right now.
          </p>
          {/* tl;dr — hidden for now
          <div className="future-tldr">
            <span className="future-tldr-label">tl;dr</span>
            <p className="future-tldr-theme">The recurring theme is inversion:</p>
            <ul className="future-tldr-list">
              <li>outsiders understand systems better than insiders</li>
              <li>weak positions can become strong</li>
              <li>medicine trains compliance rather than creation</li>
              <li>wealth matters because it creates freedom, not status</li>
              <li>writing is for discovering truth, not branding</li>
            </ul>
          </div>
          */}
        </div>

        <div className="future-grid">
          <div className="future-col">
            <section className="future-section">
              <h2>Medicine needs people who refuse to be confined by it</h2>
              <p>
                The people most qualified to fix healthcare are systematically trained to stay inside
                it. Medical school doesn&apos;t teach you to build, it teaches you to comply. The
                most interesting physicians I&apos;ve encountered are the ones who found that
                insufficient.
              </p>
              <p>
                Most health tech is built by outsiders who treat clinicians as users to be
                understood. Some is built by clinicians who treat technology as a hammer because
                it&apos;s the only tool they recognize. What&apos;s missing is someone who has
                genuinely lived both — and doesn&apos;t feel the need to choose a side.
              </p>
              <p>
                I came to medicine with a software engineering background, and what I noticed
                immediately is that the EHR isn&apos;t a bad product with good intentions built by
                malicious people. It&apos;s a bad product with good intentions built by people who
                were never asked to understand what they were actually disrupting. I was one of
                those people at Epic. That&apos;s worth sitting with.
              </p>
              <p>
                Medicine has a complicated relationship with new data. The precautionary principle
                is real, important, and sometimes right. But the question I keep returning to is:
                when does appropriate caution become something else? When does it become
                institutional habit rather than intellectual humility? I don&apos;t think the
                profession has fully answered that, and I think it&apos;s one of the most important
                questions in health technology right now.
              </p>
            </section>

            <section className="future-section">
              <h2>Capital is a tool, not a destination</h2>
              <p>
                Money interests me less than what it makes possible. I&apos;ve built a 30-year
                financial model comparing every major medical career path by NPV and optionality. I
                did it not because I care about being wealthy but because I wanted to understand
                which path leaves the most room to do things. The answer surprised me and I keep
                returning to it.
              </p>
              <p>
                I don&apos;t know yet whether I will practice medicine as my primary work, build
                healthcare companies, or eventually sit on the investment side of the table. I think
                it&apos;s important to say that honestly rather than perform certainty I
                don&apos;t have. What I do know is that the most interesting position is the one
                that lets you speak credibly to all three.
              </p>
              <p>
                There is enormous arbitrage between people who understand the biology and people who
                understand the capital. I want to be someone who can sit at that table and be taken
                seriously on both sides. Building toward that is part of what I&apos;m doing right
                now.
              </p>
            </section>

            <section className="future-section">
              <h2>On writing</h2>
              <p>
                I write because I can&apos;t not. I published a poetry collection. I write a
                newsletter. The only way I&apos;ve ever arrived at what I actually believe is by
                writing it and watching whether it holds up under scrutiny.
              </p>
              <p>
                The essays I&apos;m most proud of are the ones where I published something, had to
                defend it, and the defense changed my mind. That process is not incidental to
                thinking clearly, it is thinking clearly, done in public.
              </p>
              <p>
                If you want to be heard, don&apos;t hedge your statements. Say something. This is
                advice I gave myself and try to follow.
              </p>
            </section>
          </div>

          <div className="future-col">
            <section className="future-section">
              <h2>I believe in the reversal</h2>
              <p>
                The people society places in the lower position often hold the real power. The
                medical student who actually understands software. The outsider who actually
                understands the inside. I have spent years cataloguing reversals because I think
                identifying them is one of the most important skills a person can have.
              </p>
              <p>
                Most people won&apos;t say anything real because they&apos;re optimizing not to be
                wrong in front of others. I am more afraid of not saying anything than of being
                wrong. These are different orientations toward truth and they produce very different
                lives.
              </p>
              <p>
                The weak position, held with enough clarity and discipline, becomes the strong one.
                I don&apos;t think this is optimism. I think it&apos;s structural.
              </p>
            </section>

            <section className="future-section">
              <h2>Faith is not a footnote</h2>
              <p>
                I am a Shia Muslim. This is not incidental to how I think. The tradition I come
                from places courage above almost everything else. Not the courage of the person who
                isn&apos;t afraid, but the courage of the person who <em>is</em> afraid, who can
                see exactly what it will cost them, and who does it anyway because it&apos;s right.
              </p>
              <blockquote className="future-blockquote">
                &ldquo;Allow God to work through your hands so that He can help you do in the world
                that which He knows only you can do.&rdquo;
              </blockquote>
              <p>I wrote this for myself a year ago. I believe it.</p>
              <p>
                Religion gave the pious beggar a dignity the king couldn&apos;t touch. That is not
                a metaphor I use lightly.
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
