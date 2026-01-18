import { useState, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { getPlans, formatPrice, type Plan } from '../lib/billing';

export default function Pricing() {
  const { user } = useAuth();
  const hero = useScrollAnimation(0.1);
  const plansSection = useScrollAnimation(0.1);
  const cta = useScrollAnimation(0.1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const data = await getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main>
        <section className="pt-32 pb-24 px-6 lg:px-8 relative overflow-hidden depth-layer">
          <div className="abstract-glow-primary w-[450px] h-[450px] -top-10 left-1/4" style={{ animation: 'float 24s ease-in-out infinite' }} />

          <div
            ref={hero.ref as React.RefObject<HTMLDivElement>}
            className={`max-w-[1100px] mx-auto text-center relative z-10 ${hero.isVisible ? 'slide-in' : 'opacity-0'}`}
          >
            <h1 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-6">
              Priced by tools. Not by people.
            </h1>
            <div className="max-w-2xl mx-auto space-y-4 text-lg text-[var(--text-secondary)] leading-relaxed">
              <p>
                Forgotten spend doesn't scale with headcount.
              </p>
              <p>
                It scales with experimentation.
              </p>
              <p className="text-[var(--text-primary)]">
                So Unspendify pricing is based on:<br/>
                <strong>number of tools tracked, not users.</strong>
              </p>
              <p className="text-[var(--text-muted)] pt-4">
                If it saves one forgotten renewal, it pays for itself.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div
            ref={plansSection.ref as React.RefObject<HTMLDivElement>}
            className={`max-w-6xl mx-auto ${plansSection.isVisible ? 'fade-in' : 'opacity-0'}`}
          >
            {loading ? (
              <div className="text-center text-slate-400">Loading plans...</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-xl border transition-all ${
                      plan.id === 'growth'
                        ? 'bg-slate-900/50 border-blue-500/30 ring-2 ring-blue-500/20'
                        : 'bg-slate-900/30 border-slate-700'
                    }`}
                  >
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-slate-100 mb-2">
                        {plan.name}
                      </h3>
                      <div className="text-3xl font-bold text-slate-100 mb-1">
                        {plan.price_usd === 0 ? (
                          'Free'
                        ) : (
                          <>
                            {formatPrice(plan.price_usd)}
                            <span className="text-lg font-normal text-slate-400">/mo</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-2">
                        {plan.id === 'free' && 'See the problem'}
                        {plan.id === 'starter' && 'Stop the obvious leaks'}
                        {plan.id === 'growth' && 'Never get surprised again'}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <Check size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                        <span>Up to {plan.tool_limit} tools tracked</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <Check size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {plan.inbox_limit === 0
                            ? 'Unlimited inboxes'
                            : `Up to ${plan.inbox_limit} inbox${plan.inbox_limit !== 1 ? 'es' : ''}`}
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <Check size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{plan.scan_months} month historical scan</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <Check size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                        <span>Ownership inference</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <Check size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                        <span>Decision-moment interruptions</span>
                      </li>
                    </ul>

                    <a
                      href={user ? '/app/billing' : '/signup'}
                      className="block w-full text-center px-4 py-3 text-sm font-medium text-slate-900 bg-white rounded-lg hover:bg-slate-100 transition-all duration-300"
                    >
                      {plan.price_usd === 0 ? 'Start free' : 'Upgrade'}
                    </a>
                    {plan.price_usd === 0 && (
                      <p className="text-xs text-slate-500 mt-3 text-center">
                        No credit card required
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-subtle relative overflow-hidden">
          <div className="glass-subtle absolute inset-x-0 top-0 h-px" />
          <div className="abstract-glow-secondary w-[350px] h-[350px] top-1/2 right-10 -translate-y-1/2" />

          <div
            ref={cta.ref as React.RefObject<HTMLDivElement>}
            className={`max-w-[700px] mx-auto text-center relative z-10 ${cta.isVisible ? 'slide-in' : 'opacity-0'}`}
          >
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Start free. Cancel anytime.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
