import { ArrowRight, X, Check, Mail, Search, Bell, CheckCircle } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ProductScreenshot from '../components/ProductScreenshot';

export default function Homepage() {
  const hero = useScrollAnimation(0.1);
  const excel = useScrollAnimation(0.1);
  const howItWorks = useScrollAnimation(0.1);
  const social = useScrollAnimation(0.1);
  const personas = useScrollAnimation(0.1);
  const security = useScrollAnimation(0.1);
  const cta = useScrollAnimation(0.1);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main>
        <section className="pt-32 pb-24 px-6 lg:px-8 relative overflow-hidden gradient-mesh">
          <div className="abstract-blob w-[700px] h-[700px] -top-40 left-1/2 -translate-x-1/2 bg-blue-500" style={{ animation: 'float 20s ease-in-out infinite' }} />
          <div className="abstract-blob w-[500px] h-[500px] top-20 right-0 bg-slate-500" style={{ animation: 'float 25s ease-in-out infinite', animationDelay: '2s' }} />

          <div className="max-w-[1200px] mx-auto relative z-10 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
              <div className="max-w-[600px] min-w-0">
              <h1
                ref={hero.ref as React.RefObject<HTMLHeadingElement>}
                className={`text-5xl md:text-6xl lg:text-7xl font-medium text-[var(--text-primary)] mb-6 leading-[1.1] text-balance ${hero.isVisible ? 'slide-in' : 'opacity-0'}`}
              >
                Stop paying for marketing tools you forgot existed
              </h1>
              <div className={`space-y-4 text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-[700px] leading-relaxed ${hero.isVisible ? 'fade-in fade-in-delay-1' : 'opacity-0'}`}>
                <p>
                  Unspendify is a read-only memory layer on top of your inbox.
                </p>
                <p>
                  It finds forgotten trials, silent renewals, and orphaned tools — automatically.
                </p>
              </div>
              <div className={`flex flex-col sm:flex-row items-start gap-4 mb-8 ${hero.isVisible ? 'fade-in fade-in-delay-2' : 'opacity-0'}`}>
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-[var(--text-primary)] bg-[var(--accent)] rounded-lg glow-subtle hover:glow-hover hover:brightness-110 transition-all duration-300"
                >
                  Start free
                  <ArrowRight size={18} />
                </a>
                <a
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  How it works
                  <ArrowRight size={18} />
                </a>
              </div>
              <div className={`text-sm text-[var(--text-muted)] ${hero.isVisible ? 'fade-in fade-in-delay-3' : 'opacity-0'}`}>
                <p>No credit card. Read-only access.</p>
              </div>
              <div className={`mt-8 flex flex-wrap gap-6 text-sm text-[var(--text-secondary)] ${hero.isVisible ? 'fade-in fade-in-delay-3' : 'opacity-0'}`}>
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-green-600" />
                  <span>No forwarding</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-green-600" />
                  <span>No spreadsheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-green-600" />
                  <span>No chasing people</span>
                </div>
              </div>
            </div>

            <div className={`hidden lg:block min-w-0 ${hero.isVisible ? 'fade-in fade-in-delay-3' : 'opacity-0'}`}>
              <div className="visual-anchor min-w-0">
                <ProductScreenshot variant="dashboard" className="transform rotate-1" />
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="max-w-[1100px] mx-auto">
            <div
              ref={excel.ref as React.RefObject<HTMLDivElement>}
              className={`${excel.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] heading-spacing text-center max-w-2xl mx-auto">
                Why Excel always fails at this
              </h2>

              <div className="space-y-6 text-lg text-[var(--text-secondary)] leading-relaxed max-w-3xl mx-auto content-spacing">
                <p>
                  Every startup tries to track tools the same way at first.
                </p>
                <p>
                  A spreadsheet.<br />
                  Maybe a Notion table.<br />
                  Sometimes both.
                </p>
                <p>
                  It works for a week.
                </p>
                <p className="text-[var(--text-primary)] font-medium">
                  Then:
                </p>
                <ul className="space-y-2 pl-6">
                  <li>someone forgets to update it</li>
                  <li>a trial converts quietly</li>
                  <li>a renewal slips through</li>
                  <li>the sheet goes stale</li>
                </ul>
                <p>
                  Spreadsheets don't fail because they're bad.<br />
                  They fail because they require discipline from people who are already overloaded.
                </p>
                <p className="text-[var(--text-primary)] font-medium">
                  Invoices don't.
                </p>
                <p>
                  Unspendify watches what Excel never sees.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-3">
                  <div className="text-sm text-[var(--text-muted)] font-medium">Excel / Notion</div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50 flex-shrink-0"></div>
                      <span className="text-[var(--text-muted)]">Last updated: 3 weeks ago</span>
                    </div>
                    <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <div className="opacity-60 safe-overflow">Mailchimp - $49/mo</div>
                      <div className="opacity-60 safe-overflow">Ahrefs - $99/mo</div>
                      <div className="opacity-40 line-through safe-overflow">HubSpot - ???</div>
                      <div className="opacity-60 safe-overflow">Typeform - $35/mo</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-[var(--text-muted)] font-medium">Unspendify</div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--accent)]/30 rounded-lg p-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50 flex-shrink-0"></div>
                      <span className="text-[var(--text-secondary)]">Updated automatically</span>
                    </div>
                    <div className="space-y-2 text-sm text-[var(--text-primary)]">
                      <div className="safe-overflow">Mailchimp - $49/mo</div>
                      <div className="safe-overflow">Ahrefs - $99/mo</div>
                      <div className="safe-overflow">HubSpot - $450/mo <span className="text-[var(--accent)]">• Renews in 3 days</span></div>
                      <div className="safe-overflow">Typeform - $35/mo</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-[var(--text-muted)] mt-6">
                One updates itself. One doesn't.
              </p>
            </div>
          </div>
        </section>

        <section className="section-spacing px-6 lg:px-8 border-t border-subtle">
          <div className="max-w-[1100px] mx-auto">
            <div
              ref={howItWorks.ref as React.RefObject<HTMLDivElement>}
              className={`${howItWorks.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] heading-spacing text-center">
                How Unspendify works (without more work)
              </h2>

              <div className="grid md:grid-cols-3 gap-12 w-full content-spacing">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--text-primary)] font-medium">
                    1
                  </div>
                  <h3 className="text-xl font-medium text-[var(--text-primary)]">
                    Connect your billing inbox (read-only)
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Gmail or Outlook. One time. No forwarding.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--text-primary)] font-medium">
                    2
                  </div>
                  <h3 className="text-xl font-medium text-[var(--text-primary)]">
                    We scan past and future invoices
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Including tools you forgot existed.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--text-primary)] font-medium">
                    3
                  </div>
                  <h3 className="text-xl font-medium text-[var(--text-primary)]">
                    We interrupt before renewals
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Only when a decision is required.
                  </p>
                </div>
              </div>

              <div className="mt-20 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-0">
                  <div className={`flex flex-col items-center text-center ${howItWorks.isVisible ? 'flow-stage flow-stage-1' : 'opacity-0'}`}>
                    <div className="w-16 h-16 rounded-xl flow-email flex items-center justify-center mb-4 transition-all duration-300">
                      <Mail size={24} className="flow-email-icon" />
                    </div>
                    <div className="text-sm font-medium text-[var(--text-primary)] mb-2 uppercase tracking-wide">Email</div>
                    <div className="text-xs text-[var(--text-muted)] leading-relaxed">Invoices arrive here</div>
                  </div>

                  <div className={`hidden md:flex items-start justify-center pt-8 ${howItWorks.isVisible ? 'flow-stage flow-stage-2' : 'opacity-0'}`}>
                    <div className="w-full flow-connector mt-1"></div>
                  </div>

                  <div className={`flex flex-col items-center text-center ${howItWorks.isVisible ? 'flow-stage flow-stage-2' : 'opacity-0'}`}>
                    <div className="w-16 h-16 rounded-xl flow-detection flex items-center justify-center mb-4 transition-all duration-300">
                      <Search size={24} className="flow-detection-icon" />
                    </div>
                    <div className="text-sm font-medium text-[var(--text-primary)] mb-2 uppercase tracking-wide">Detection</div>
                    <div className="text-xs text-[var(--text-muted)] leading-relaxed">Unspendify notices</div>
                  </div>

                  <div className={`hidden md:flex items-start justify-center pt-8 ${howItWorks.isVisible ? 'flow-stage flow-stage-3' : 'opacity-0'}`}>
                    <div className="w-full flow-connector mt-1"></div>
                  </div>

                  <div className={`flex flex-col items-center text-center ${howItWorks.isVisible ? 'flow-stage flow-stage-3' : 'opacity-0'}`}>
                    <div className="w-16 h-16 rounded-xl flow-alert flow-alert-pulse flex items-center justify-center mb-4 transition-all duration-300">
                      <Bell size={24} className="flow-alert-icon" />
                    </div>
                    <div className="text-sm font-medium text-[var(--text-primary)] mb-2 uppercase tracking-wide">Alert</div>
                    <div className="text-xs text-[var(--text-muted)] leading-relaxed">Before renewal</div>
                  </div>

                  <div className={`hidden md:flex items-start justify-center pt-8 ${howItWorks.isVisible ? 'flow-stage flow-stage-4' : 'opacity-0'}`}>
                    <div className="w-full flow-connector mt-1"></div>
                  </div>

                  <div className={`flex flex-col items-center text-center ${howItWorks.isVisible ? 'flow-stage flow-stage-4' : 'opacity-0'}`}>
                    <div className="w-16 h-16 rounded-xl flow-decision flex items-center justify-center mb-4 transition-all duration-300">
                      <CheckCircle size={24} className="flow-decision-icon" />
                    </div>
                    <div className="text-sm font-medium text-[var(--text-primary)] mb-2 uppercase tracking-wide">Decision</div>
                    <div className="text-xs text-[var(--text-muted)] leading-relaxed">You choose</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-spacing-compact px-6 lg:px-8 border-t border-subtle bg-[var(--bg-secondary)]">
          <div className="max-w-[1100px] mx-auto">
            <div
              ref={social.ref as React.RefObject<HTMLDivElement>}
              className={`${social.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] heading-spacing text-center max-w-3xl mx-auto">
                Teams don't adopt Unspendify. They breathe out.
              </h2>

              <div className="grid md:grid-cols-3 gap-8 w-full">
                <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-8 space-y-4 min-w-0">
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    "We found 3 tools we would've renewed by accident. Unspendify paid for itself in the first week."
                  </p>
                  <div className="text-sm text-[var(--text-muted)]">
                    Founder, B2B SaaS (12 employees)
                  </div>
                </div>
                <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-8 space-y-4 min-w-0">
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    "I was managing pipeline, campaigns, and reporting. Finance was always 'later'. This fixed that without adding work."
                  </p>
                  <div className="text-sm text-[var(--text-muted)]">
                    Head of Marketing
                  </div>
                </div>
                <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-8 space-y-4 min-w-0">
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    "We stopped asking 'why are we paying for this?' because Unspendify answers it before the charge hits."
                  </p>
                  <div className="text-sm text-[var(--text-muted)]">
                    Ops Lead
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-spacing px-6 lg:px-8 border-t border-subtle">
          <div className="max-w-[1100px] mx-auto">
            <div
              ref={personas.ref as React.RefObject<HTMLDivElement>}
              className={`${personas.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] heading-spacing text-center">
                Built for how small teams actually work
              </h2>

              <div className="space-y-16 w-full">
                <div className="grid md:grid-cols-2 gap-12 items-start w-full">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-medium text-[var(--text-primary)]">
                      For Founders
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide mb-2">Pain</div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          You check Stripe late at night.<br />
                          You hate surprises more than spend.
                        </p>
                      </div>
                      <div>
                        <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide mb-2">Unspendify helps by</div>
                        <ul className="space-y-2 text-[var(--text-secondary)]">
                          <li>• showing forgotten tools early</li>
                          <li>• preventing awkward post-charge conversations</li>
                          <li>• reducing "what is this?" moments</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 min-w-0">
                    <ProductScreenshot variant="dashboard" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-start w-full">
                  <div className="space-y-6 min-w-0">
                    <h3 className="text-2xl font-medium text-[var(--text-primary)]">
                      For Marketing Leads (One-Person Teams)
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide mb-2">Pain</div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          Pipeline comes first.<br />
                          Finance is always second priority.
                        </p>
                      </div>
                      <div>
                        <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide mb-2">Unspendify helps by</div>
                        <ul className="space-y-2 text-[var(--text-secondary)]">
                          <li>• watching spend while you focus on revenue</li>
                          <li>• catching trials you didn't mean to keep</li>
                          <li>• assigning ownership without meetings</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 min-w-0">
                    <ProductScreenshot variant="renewals" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-start w-full">
                  <div className="space-y-6 min-w-0">
                    <h3 className="text-2xl font-medium text-[var(--text-primary)]">
                      For Finance / Ops
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide mb-2">Pain</div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          You only find issues after the money is gone.
                        </p>
                      </div>
                      <div>
                        <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide mb-2">Unspendify helps by</div>
                        <ul className="space-y-2 text-[var(--text-secondary)]">
                          <li>• creating a passive audit trail</li>
                          <li>• flagging unowned subscriptions</li>
                          <li>• reducing back-and-forth</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 min-w-0">
                    <ProductScreenshot variant="tools" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-spacing-compact px-6 lg:px-8 border-t border-subtle">
          <div className="max-w-[800px] mx-auto">
            <div
              ref={security.ref as React.RefObject<HTMLDivElement>}
              className={`${security.isVisible ? 'slide-in' : 'opacity-0'}`}
            >
              <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] heading-spacing text-center">
                Read-only. Always.
              </h2>

              <div className="grid md:grid-cols-2 gap-12 w-full">
                <div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Unspendify can:</h3>
                  <ul className="space-y-3 text-[var(--text-secondary)]">
                    <li className="flex items-start gap-3">
                      <Check size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>read sender, subject, date, and text</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>detect invoices and renewals</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Unspendify cannot:</h3>
                  <ul className="space-y-3 text-[var(--text-secondary)]">
                    <li className="flex items-start gap-3">
                      <X size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <span>send emails</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <span>delete emails</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <span>modify your inbox</span>
                    </li>
                  </ul>
                </div>
              </div>

              <p className="text-center text-[var(--text-muted)] mt-8">
                Access is revocable anytime.
              </p>
            </div>
          </div>
        </section>

        <section className="section-spacing px-6 lg:px-8 border-t border-subtle relative overflow-hidden">
          <div className="abstract-glow-primary w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

          <div
            ref={cta.ref as React.RefObject<HTMLDivElement>}
            className={`max-w-[700px] mx-auto relative z-10 text-center ${cta.isVisible ? 'slide-in' : 'opacity-0'}`}
          >
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-8">
              Connect once. Forget forever.
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-12">
              If Unspendify saves you one forgotten renewal,<br />
              it pays for itself.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-[var(--text-primary)] bg-[var(--accent)] rounded-lg glow-subtle hover:glow-hover hover:brightness-110 transition-all duration-300"
              >
                Start free
                <ArrowRight size={18} />
              </a>
              <a
                href="/how-it-works"
                className="inline-flex items-center gap-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                See how it works
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
