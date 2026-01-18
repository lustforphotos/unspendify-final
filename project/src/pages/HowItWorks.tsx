import { ArrowRight, Mail, Search, Eye, Users, AlertCircle, Check, X } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ProductScreenshot from '../components/ProductScreenshot';

export default function HowItWorks() {
  const hero = useScrollAnimation(0.1);
  const step1 = useScrollAnimation(0.1);
  const step2 = useScrollAnimation(0.1);
  const step3 = useScrollAnimation(0.1);
  const step4 = useScrollAnimation(0.1);
  const why = useScrollAnimation(0.1);
  const cta = useScrollAnimation(0.1);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main>
        <section className="pt-32 pb-24 px-6 lg:px-8 relative overflow-hidden depth-layer">
          <div className="abstract-glow-primary w-[500px] h-[500px] -top-20 right-10" style={{ animation: 'float 22s ease-in-out infinite' }} />

          <div className="max-w-[1100px] mx-auto relative z-10">
            <div
              ref={hero.ref as React.RefObject<HTMLDivElement>}
              className={`max-w-[700px] mx-auto text-center ${hero.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h1 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-6 leading-tight">
                Designed to remember what your team can't
              </h1>
              <p className="text-lg text-[var(--text-secondary)] mt-6 leading-relaxed">
                Unspendify fits into what already happens — your inbox.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="section-divider absolute inset-x-0 top-0" />
          <div className="max-w-[1200px] mx-auto">
            <div
              ref={step1.ref as React.RefObject<HTMLDivElement>}
              className={`grid lg:grid-cols-2 gap-16 items-center ${step1.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <div>
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-soft">
                    <Mail size={20} className="text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">Step 1</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-medium text-[var(--text-primary)] mb-8">
                  Connect your billing inbox (read-only)
                </h2>
                <div className="space-y-6 text-base text-[var(--text-secondary)] leading-relaxed">
                  <p>
                    Every SaaS tool already emails you when it charges you.<br/>
                    Those emails land in one place.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Connect:</strong><br/>
                    billing@ · ops@ · founder@
                  </p>
                  <p>
                    Unspendify gets read-only access to look for:
                  </p>
                  <ul className="space-y-2 pl-5 list-disc">
                    <li>invoices</li>
                    <li>receipts</li>
                    <li>renewal notices</li>
                    <li>trial start & ending emails</li>
                  </ul>
                  <p className="text-[var(--text-muted)]">
                    It cannot send, delete, or modify anything.
                  </p>
                </div>
                <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400 italic">
                    You do this once.<br/>
                    No rules. No forwarding. No setup later.
                  </p>
                </div>
              </div>

              <div className="visual-anchor">
                <div className="glass-panel p-8 rounded-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-tertiary)]/50 border border-soft">
                      <Check size={20} className="text-green-400" />
                      <span className="text-sm text-slate-300">Read sender, subject, date, body</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-tertiary)]/50 border border-soft">
                      <Check size={20} className="text-green-400" />
                      <span className="text-sm text-slate-300">Detect invoice keywords</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-tertiary)]/50 border border-red-900/30">
                      <X size={20} className="text-red-400" />
                      <span className="text-sm text-slate-400">Cannot send emails</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-tertiary)]/50 border border-red-900/30">
                      <X size={20} className="text-red-400" />
                      <span className="text-sm text-slate-400">Cannot delete or modify</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="section-divider absolute inset-x-0 top-0" />
          <div className="max-w-[1200px] mx-auto">
            <div
              ref={step2.ref as React.RefObject<HTMLDivElement>}
              className={`grid lg:grid-cols-2 gap-16 items-center ${step2.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <div className="order-2 lg:order-1 visual-anchor">
                <ProductScreenshot variant="tools" />
              </div>

              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-soft">
                    <Search size={20} className="text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">Step 2</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-medium text-[var(--text-primary)] mb-8">
                  We rebuild your tool inventory automatically
                </h2>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6">
                  The moment an inbox is connected, Unspendify scans:
                </p>
                <ul className="space-y-4 text-base text-[var(--text-secondary)] mb-6">
                  <li>• the last 6–24 months</li>
                  <li>• silently</li>
                  <li>• automatically</li>
                </ul>
                <p className="text-base text-[var(--text-primary)] leading-relaxed mb-4">
                  It finds tools you forgot existed — including old trials and experiments.
                </p>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                  Most teams discover something uncomfortable here.
                </p>
                <p className="text-base text-[var(--text-muted)] italic">
                  That's intentional.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="section-divider absolute inset-x-0 top-0" />
          <div className="max-w-[1200px] mx-auto">
            <div
              ref={step3.ref as React.RefObject<HTMLDivElement>}
              className={`grid lg:grid-cols-2 gap-16 items-center ${step3.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <div>
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-soft">
                    <Users size={20} className="text-orange-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">Step 3</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-medium text-[var(--text-primary)] mb-8">
                  Ownership, without chasing people
                </h2>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6">
                  Unspendify infers ownership based on:
                </p>
                <ul className="space-y-4 text-base text-[var(--text-secondary)] mb-6">
                  <li>• who received the invoice</li>
                  <li>• who was CC'd</li>
                  <li>• past interaction patterns</li>
                </ul>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6">
                  If ownership isn't clear, the tool is marked <span className="text-amber-400">unowned</span>.
                </p>
                <p className="text-base text-[var(--text-muted)]">
                  No Slack messages.<br/>
                  No meetings.
                </p>
              </div>

              <div className="visual-anchor">
                <div className="glass-panel p-8 rounded-2xl">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]/50 border border-soft">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-200">HubSpot</span>
                        <span className="text-xs text-green-400">Confirmed</span>
                      </div>
                      <div className="text-xs text-slate-400">Owner: sarah@company.com</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]/50 border border-soft">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-200">Typeform</span>
                        <span className="text-xs text-blue-400">Inferred</span>
                      </div>
                      <div className="text-xs text-slate-400">Owner: ops@company.com</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]/50 border border-amber-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-200">Loom</span>
                        <span className="text-xs text-amber-400">Unowned</span>
                      </div>
                      <div className="text-xs text-slate-400">Needs assignment</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="section-divider absolute inset-x-0 top-0" />
          <div className="max-w-[1200px] mx-auto">
            <div
              ref={step4.ref as React.RefObject<HTMLDivElement>}
              className={`grid lg:grid-cols-2 gap-16 items-center ${step4.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <div className="order-2 lg:order-1 visual-anchor">
                <ProductScreenshot variant="dashboard" className="transform -rotate-1" />
              </div>

              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-soft">
                    <AlertCircle size={20} className="text-red-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">Step 4</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-medium text-[var(--text-primary)] mb-8">
                  Interrupted only when a decision is required
                </h2>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6">
                  Unspendify stays quiet most of the time.
                </p>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6">
                  It interrupts when:
                </p>
                <ul className="space-y-4 text-base text-[var(--text-secondary)] mb-6">
                  <li>• a trial is about to convert</li>
                  <li>• a renewal is coming up</li>
                  <li>• a tool has no confirmed owner</li>
                  <li>• a subscription keeps renewing silently</li>
                </ul>
                <p className="text-base text-[var(--text-primary)] leading-relaxed mb-2">
                  Each alert forces a decision:
                </p>
                <p className="text-base text-slate-400">
                  Keep · Cancel · Downgrade · Assign owner
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="max-w-[1100px] mx-auto">
            <div
              ref={why.ref as React.RefObject<HTMLDivElement>}
              className={`max-w-[700px] mx-auto ${why.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h2 className="text-2xl md:text-3xl font-medium text-[var(--text-primary)] mb-8">
                Why this works
              </h2>
              <div className="space-y-6 text-base text-[var(--text-secondary)] leading-relaxed">
                <p>
                  Spreadsheets need upkeep.<br/>
                  Dashboards need attention.
                </p>
                <p className="text-[var(--text-primary)]">
                  Invoices don't.
                </p>
                <p>
                  Unspendify watches them so you don't have to.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative overflow-hidden">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="abstract-glow-secondary w-[400px] h-[400px] bottom-0 left-1/2 -translate-x-1/2" />

          <div
            ref={cta.ref as React.RefObject<HTMLDivElement>}
            className={`max-w-[600px] mx-auto text-center relative z-10 ${cta.isVisible ? 'slide-in' : 'opacity-0'}`}
          >
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-6">
              Ready to start?
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-10">
              Set up takes less than 5 minutes
            </p>
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
