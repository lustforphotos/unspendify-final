import { ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Security() {
  const hero = useScrollAnimation(0.1);
  const dont = useScrollAnimation(0.1);
  const doSection = useScrollAnimation(0.1);
  const purpose = useScrollAnimation(0.1);
  const cta = useScrollAnimation(0.1);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main>
        <section className="pt-32 pb-24 px-6 lg:px-8 relative overflow-hidden depth-layer">
          <div className="abstract-glow-primary w-[400px] h-[400px] top-0 left-1/2 -translate-x-1/2" style={{ animation: 'float 26s ease-in-out infinite' }} />

          <div className="max-w-[1100px] mx-auto relative z-10">
            <div
              ref={hero.ref as React.RefObject<HTMLDivElement>}
              className={`max-w-[700px] mx-auto text-center ${hero.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h1 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-6 leading-tight">
                Read-only. Always.
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                Unspendify is memory — not control.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="max-w-[1100px] mx-auto">
            <div
              ref={dont.ref as React.RefObject<HTMLDivElement>}
              className={`max-w-[700px] mx-auto ${dont.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h2 className="text-2xl md:text-3xl font-medium text-[var(--text-primary)] mb-8">
                What we access
              </h2>
              <p className="text-base text-[var(--text-secondary)] mb-6">Unspendify only reads:</p>
              <ul className="space-y-3 text-base text-[var(--text-secondary)] pl-5 list-disc">
                <li>sender</li>
                <li>subject</li>
                <li>date</li>
                <li>plain-text body</li>
              </ul>
              <p className="text-base text-[var(--text-muted)] mt-6 italic">
                Only for invoice-related emails.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="max-w-[1100px] mx-auto">
            <div
              ref={doSection.ref as React.RefObject<HTMLDivElement>}
              className={`max-w-[700px] mx-auto ${doSection.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h2 className="text-2xl md:text-3xl font-medium text-[var(--text-primary)] mb-8">
                What we never store
              </h2>
              <ul className="space-y-3 text-base text-[var(--text-secondary)] pl-5 list-disc">
                <li>attachments</li>
                <li>PDFs</li>
                <li>credit card numbers</li>
                <li>full invoice files</li>
              </ul>
              <p className="text-base text-[var(--text-muted)] mt-6 italic">
                Emails are processed and discarded.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="max-w-[1100px] mx-auto">
            <div
              ref={purpose.ref as React.RefObject<HTMLDivElement>}
              className={`max-w-[700px] mx-auto ${purpose.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h2 className="text-2xl md:text-3xl font-medium text-[var(--text-primary)] mb-8">
                What we can't do
              </h2>
              <p className="text-base text-[var(--text-secondary)] mb-6">Unspendify cannot:</p>
              <ul className="space-y-3 text-base text-[var(--text-secondary)] pl-5 list-disc">
                <li>send emails</li>
                <li>delete emails</li>
                <li>modify inboxes</li>
              </ul>
              <p className="text-base text-[var(--text-muted)] mt-6 italic">
                Access is revocable anytime.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative overflow-hidden">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="abstract-glow-secondary w-[300px] h-[300px] bottom-10 left-1/3" />

          <div
            ref={cta.ref as React.RefObject<HTMLDivElement>}
            className={`max-w-[700px] mx-auto text-center relative z-10 ${cta.isVisible ? 'slide-in' : 'opacity-0'}`}
          >
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed text-center">
              Unspendify is memory — not control.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
