import { ArrowRight, Mail, Search, Eye, CheckCircle } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function GettingStarted() {
  const hero = useScrollAnimation(0.1);
  const steps = useScrollAnimation(0.1);
  const cta = useScrollAnimation(0.1);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main>
        <section className="pt-32 pb-24 px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-[900px] mx-auto relative z-10">
            <div
              ref={hero.ref as React.RefObject<HTMLDivElement>}
              className={`text-center ${hero.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h1 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-6 leading-tight">
                Setup takes minutes. Memory lasts forever.
              </h1>
              <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                Unspendify watches your inbox so you never forget a subscription again
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle">
          <div className="max-w-[900px] mx-auto">
            <div
              ref={steps.ref as React.RefObject<HTMLDivElement>}
              className={`space-y-16 ${steps.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <div className="flex gap-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Mail size={20} className="text-blue-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-4">
                    Step 1: Connect an inbox
                  </h2>
                  <div className="space-y-3 text-base text-[var(--text-secondary)] leading-relaxed">
                    <p>
                      Choose the inbox where billing emails already arrive.
                    </p>
                    <p>
                      Authorize read-only access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Search size={20} className="text-green-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-4">
                    Step 2: We scan quietly
                  </h2>
                  <div className="space-y-3 text-base text-[var(--text-secondary)] leading-relaxed">
                    <p>
                      Unspendify automatically scans historical emails.
                    </p>
                    <p>
                      No action required.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Eye size={20} className="text-orange-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-4">
                    Step 3: Review what you're actually paying for
                  </h2>
                  <div className="space-y-3 text-base text-[var(--text-secondary)] leading-relaxed">
                    <p>See:</p>
                    <ul className="space-y-2 pl-5 list-disc">
                      <li>all active tools</li>
                      <li>what they cost</li>
                      <li>when they renew</li>
                      <li>who owns them (or doesn't)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <CheckCircle size={20} className="text-red-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-4">
                    Step 4: Decide only when needed
                  </h2>
                  <div className="space-y-3 text-base text-[var(--text-secondary)] leading-relaxed">
                    <p>
                      You'll only be notified when a decision matters.
                    </p>
                    <p className="text-[var(--text-muted)]">
                      No maintenance.<br/>
                      No recurring work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative overflow-hidden">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div
            ref={cta.ref as React.RefObject<HTMLDivElement>}
            className={`max-w-[600px] mx-auto text-center ${cta.isVisible ? 'slide-in' : 'opacity-0'}`}
          >
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-10">
              Ready to connect your inbox?
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
