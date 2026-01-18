import { ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function About() {
  const hero = useScrollAnimation(0.1);
  const mission = useScrollAnimation(0.1);
  const cta = useScrollAnimation(0.1);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main>
        <section className="pt-32 pb-24 px-6 lg:px-8 relative overflow-hidden depth-layer">
          <div className="abstract-glow-primary w-[500px] h-[500px] -top-16 right-1/4" style={{ animation: 'float 28s ease-in-out infinite' }} />
          <div className="abstract-glow-secondary w-[350px] h-[350px] top-32 left-10" style={{ animation: 'float 23s ease-in-out infinite', animationDelay: '3s' }} />

          <div className="max-w-[1100px] mx-auto relative z-10">
            <div
              ref={hero.ref as React.RefObject<HTMLDivElement>}
              className={`max-w-[700px] mx-auto ${hero.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h1 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-6 leading-tight">
                Built out of frustration
              </h1>
              <div className="space-y-6 text-lg text-[var(--text-secondary)] mt-6 leading-relaxed">
                <p>
                  Unspendify wasn't built because we love marketing ops.
                </p>
                <p>
                  It was built because we kept discovering charges we couldn't explain.
                </p>
                <p>
                  Tools tested once.<br/>
                  Tools owned by people who left.<br/>
                  Tools no one wanted to touch.
                </p>
                <p>
                  Every time, the same sentence:<br/>
                  <span className="text-[var(--text-primary)]">"We should've cancelled this."</span>
                </p>
                <p className="text-[var(--text-muted)] italic">
                  Always after the money left.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="max-w-[1100px] mx-auto">
            <div
              ref={mission.ref as React.RefObject<HTMLDivElement>}
              className={`max-w-[700px] mx-auto ${mission.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <div className="space-y-6 text-lg text-[var(--text-secondary)] leading-relaxed text-center">
                <p className="text-[var(--text-primary)]">
                  This product doesn't make teams smarter.<br/>
                  It makes them less forgetful.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative overflow-hidden">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="abstract-glow-primary w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

          <div
            ref={cta.ref as React.RefObject<HTMLDivElement>}
            className={`max-w-[700px] mx-auto text-center relative z-10 ${cta.isVisible ? 'slide-in' : 'opacity-0'}`}
          >
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-10">
              Connect once. Forget forever.
            </h2>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-[var(--text-primary)] bg-[var(--accent)] rounded-lg glow-subtle hover:glow-hover hover:brightness-110 transition-all duration-300"
            >
              Start free
              <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
