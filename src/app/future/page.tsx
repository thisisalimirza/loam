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
                My thesis on medicine is informed by both my classical education and my
                perspective as a technologist, colored by the experience of living across many
                different cultures. I believe medicine is a deeply humanist profession more than
                it is a precise mechanical science. At the same time, we must not forget that a
                significant portion of the trust we hold was earned over centuries and millennia
                through the faithful execution of the scientific process in the pursuit of
                treating disease and illness.
              </p>
              <p>
                Though I am sympathetic to the many ailments of society—and have seen the worst of
                them closer than most in the countries I have lived in—I somewhat reject the
                growing narrative that physicians must take responsibility for every problem that
                ails people. I fear this makes us responsible, in the public eye, for too many
                things beyond our control, and that it feeds the growing distrust of the
                healthcare system. As we take on social problems we are unable to solve, our
                inability to solve them leaves visible scars on the profession in the eyes of the
                public we aim to serve.
              </p>
              <p>
                I came to medicine because, across the many countries I flew in and out of
                throughout my life, one thing remained constant: the desire to preserve life. It
                also became clear to me that brilliance, innovation, and world-changing ideas can
                come from anywhere and anyone. Minimizing the preventable loss of life is the most
                directly modifiable factor in building a better future. At its core, then,
                medicine is a humanist profession aimed simply at combating disease and
                illness—not the establishment of some Sisyphean &ldquo;state of health.&rdquo;
              </p>
              <p>
                This perspective shapes how I see technology&apos;s place in the advancement of
                medicine. It must support diagnostics, risk minimization, and harm reduction first
                and foremost. Tangential social benefits are welcome, but they are not necessary
                beyond these aims—lest we again take on responsibility for things we cannot
                control.
              </p>
              <p>
                The prospect of AI in medicine does not scare me, though I have noticed it scares
                many. I believe it may birth a golden age for medicine if used appropriately. The
                physician of the future will need to be adept at utilizing this technology,
                co-developing it, and co-implementing it into the healthcare system. Much of
                healthcare is ripe for disruption, and given the public&apos;s perception of the
                current system, that is largely a good thing. The average physician will no longer
                need to be only a better doctor in the scientific sense, but a better person in
                the humanistic sense as well. If AI serves as a forcing function for this
                metamorphosis, I welcome it.
              </p>
              <p>
                As such, I occupy the unusual position of a physician-hopeful who is already
                well-versed in this technology. Though the range of my interests sometimes seems
                confusing to others, I am deeply comfortable waiting for society to catch up with
                the inevitable direction healthcare is headed. I do not wait to co-develop that
                future. I began my training reps during medical school by building technological
                solutions to micro-problems on a regular basis.
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
