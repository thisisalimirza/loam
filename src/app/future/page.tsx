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
            Here&apos;s what I actually believe. Not what sounds good, not what positions me well,
            not what people in my field tend to say. What I actually think, today.
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
                The people most able to fix healthcare are the ones trained hardest to stay inside
                it. Med school doesn&apos;t teach you to build. It teaches you to comply. The most
                interesting physicians I&apos;ve met are the ones who decided that wasn&apos;t
                enough.
              </p>
              <p>
                Most health tech gets built by outsiders who treat clinicians as users to be
                studied. Some gets built by clinicians who treat technology as a hammer, because
                it&apos;s the only tool they own. What&apos;s missing is the person who has actually
                lived both, and doesn&apos;t feel any need to pick a side.
              </p>
              <p>
                I came to medicine from software, and the first thing I noticed is that the EHR
                isn&apos;t a bad product built by bad people. It&apos;s a bad product, built with
                good intentions, by people who were never asked to understand what they were
                disrupting. I know this because I worked at Epic. I was one of those people.
              </p>
              <p>
                Medicine has a complicated relationship with new data. The precautionary principle
                is real, and it&apos;s sometimes right. But the question I keep coming back to is
                when appropriate caution quietly turns into something else — when it stops being
                intellectual humility and becomes institutional habit. I don&apos;t think the
                profession has answered that honestly. I think it&apos;s the question.
              </p>
            </section>

            <section className="future-section">
              <h2>Capital is a tool, not a destination</h2>
              <p>
                Money interests me less than what it buys you the freedom to do. I built a 30-year
                financial model comparing every major medical career path by NPV and optionality —
                not because I want to be rich, but because I wanted to know which path leaves the
                most room to act. The answer surprised me, and I haven&apos;t stopped thinking about
                it since.
              </p>
              <p>
                I don&apos;t know yet whether I&apos;ll practice as my main work, build companies, or
                end up on the investment side of the table. I&apos;d rather say that plainly than
                perform a certainty I don&apos;t have. What I do know is that the most interesting
                seat is the one that lets you speak credibly to all three.
              </p>
              <p>
                There&apos;s enormous arbitrage between the people who understand the biology and the
                people who understand the capital. I want to be someone who can sit at that table
                and get taken seriously on both sides. A lot of what I&apos;m doing right now is
                building toward that.
              </p>
            </section>

            <section className="future-section">
              <h2>On writing</h2>
              <p>
                I write because I can&apos;t not. I&apos;ve published a poetry collection. I write a
                newsletter. The only way I&apos;ve ever found out what I actually believe is to write
                it down and see whether it survives contact with anyone who pushes back.
              </p>
              <p>
                The essays I&apos;m proudest of are the ones where I published something, had to
                defend it, and the defense changed my own mind. That isn&apos;t a side effect of
                thinking clearly. It is thinking clearly — just done out loud, where people can
                watch.
              </p>
              <p>
                If you want to be heard, stop hedging. Say the thing. I gave myself that advice and
                I&apos;m still trying to take it.
              </p>
            </section>
          </div>

          <div className="future-col">
            <section className="future-section">
              <h2>I believe in the reversal</h2>
              <p>
                The person society puts in the lower position is often the one holding the real
                power. The med student who actually understands software. The outsider who actually
                understands the inside. I&apos;ve spent years collecting reversals like this, because
                spotting them might be the most useful habit I have.
              </p>
              <p>
                Most people never say anything real, because they&apos;re optimizing not to look
                wrong in front of other people. I&apos;m more afraid of staying quiet than of being
                wrong. That&apos;s a small difference on paper. It builds completely different lives.
              </p>
              <p>
                The weak position, held with enough clarity and nerve, turns into the strong one. I
                don&apos;t think that&apos;s optimism. I think it&apos;s structural.
              </p>
            </section>

            <section className="future-section">
              <h2>Faith is not a footnote</h2>
              <p>
                I&apos;m a Shia Muslim. This isn&apos;t incidental to how I think. The tradition I
                come from puts courage above nearly everything — and not the courage of the person
                who feels no fear. The courage of the person who <em>is</em> afraid, who can see
                exactly what it&apos;s going to cost, and does it anyway, because it&apos;s right.
              </p>
              <blockquote className="future-blockquote">
                &ldquo;Allow God to work through your hands so that He can help you do in the world
                that which He knows only you can do.&rdquo;
              </blockquote>
              <p>I wrote that for myself a year ago. I believe it.</p>
              <p>
                Religion gave the pious beggar a dignity the king couldn&apos;t touch. I don&apos;t
                reach for that line lightly.
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
