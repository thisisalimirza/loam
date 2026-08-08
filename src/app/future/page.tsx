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
        </div>

        <div className="future-grid">
          <div className="future-col">
            <section className="future-section">
              <h2>Medicine</h2>
              <p>
                My thesis on medicine is informed by both my classical education as well as my
                technologist perspective, colored by my experiences living in so many different
                cultures around the world. I think medicine is a deeply humanist profession more
                than it is a precise mechanical science. I think, despite this, we must not forget
                that a significant portion of our trust is earned over centuries and millennia,
                through faithful execution of the scientific process in pursuit of treating
                disease and illness.
              </p>
              <p>
                Though I am sympathetic to the many ailments of society, and I have seen the worst
                of many of them closer than most in the countries I have lived in, as of now, I
                somewhat reject this growing narrative that physicians must treat every problem
                that ails people. I fear this makes us responsible for too many things beyond our
                control in the eye of the public, and plays into the growing distrust of the
                health care system as we take on problems we are unable to solve — and our
                inability to solve them leaves visible scars on the profession in the eyes of the
                public we aim to serve.
              </p>
              <p>
                I came to medicine because, across many countries, I flew in and out of my whole
                life. One of the things that remained constant was the pursuit of life. And one of
                the things that became very evident to me is that brilliance, innovation, and
                world-changing ideas can come from anywhere and anyone. The preventable loss of
                life is the most directly modifiable risk factor in preventing the onset of a
                future. Hence, to me, at its core, medicine is a humanist profession aimed simply
                to combat disease and illness, not the establishment of some Sisyphean
                &ldquo;state of health.&rdquo;
              </p>
              <p>
                This perspective belies how I find technology&apos;s place in the advancement of
                medicine. It must support diagnostics, risk minimization, and harm minimization,
                utmost and foremost. Tangential social benefits are nice, but not necessary beyond
                these — lest we again take on responsibility for things we cannot control.
              </p>
              <p>
                The prospect of AI in medicine is not something that fears me, though I have
                noticed it is something that fears many. I&apos;m of the belief that this may
                birth a golden age for medicine if used appropriately. The physician of the future
                will be adept at utilizing this technology and co-developing it, as well as
                co-implementing it into the healthcare system. It makes much of healthcare ripe
                for disruption. Surely, this is a good thing given the public&apos;s perception of
                the current healthcare system. As such, I positioned myself in the unusual
                position of a physician who was well-versed in technology beyond what many would
                expect.
              </p>
              <p>
                Though sometimes this seems confusing to many, I am deeply comfortable waiting for
                society to catch up with the inevitable direction healthcare is headed, in that I
                am poised and ready to co-develop that future.
              </p>
            </section>
          </div>

          <div className="future-col">
            <section className="future-section">
              <h2>Writing</h2>
              <p>
                There is not much I need to say on why I write. I write because it helps me think.
                My ideas are rarely polished, and never complete. My writing exists as a record of
                changing thinking over time and as a selective pressure forcing me to state my
                stances so that once I have written them, I can see them, and the work of
                sharpening them over time can thereupon begin.
              </p>
              <p>
                The tangential benefit is that a record of public writing makes my conversations
                with other people far more interesting, as they will already have read much of my
                initial thinking and we engage in much deeper conversation as a result.
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
