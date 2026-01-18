import { useState, useEffect } from 'react';
import { ArrowRight, Check, CreditCard, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import {
  getPlans,
  getCurrentSubscription,
  createCheckoutSession,
  createPortalSession,
  formatPrice,
  type Plan,
  type BillingSubscription,
} from '../lib/billing';

export default function Billing() {
  const { user, organizationId } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  async function loadData() {
    try {
      setLoading(true);
      const [plansData, subData] = await Promise.all([
        getPlans(),
        organizationId ? getCurrentSubscription(organizationId) : null,
      ]);
      setPlans(plansData);
      setSubscription(subData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planId: string) {
    try {
      setUpgrading(true);
      setError(null);
      const url = await createCheckoutSession(planId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start upgrade');
      setUpgrading(false);
    }
  }

  async function handleManageBilling() {
    try {
      setUpgrading(true);
      setError(null);
      const url = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setUpgrading(false);
    }
  }

  const currentPlan = plans.find((p) => p.id === subscription?.plan_id);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation />
        <div className="max-w-6xl mx-auto px-6 py-32">
          <div className="text-center text-[var(--text-secondary)]">Loading billing information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-32">
        <div className="mb-12">
          <h1 className="text-4xl font-medium text-[var(--text-primary)] mb-4">
            Billing
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            Priced by tools. Not by people.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {currentPlan && (
          <div className="mb-12 p-6 bg-slate-900/50 border border-slate-700 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-400 mb-1">Current Plan</div>
                <div className="text-2xl font-semibold text-slate-100 mb-2">
                  {currentPlan.name}
                </div>
                <div className="text-slate-300">
                  {currentPlan.price_usd === 0
                    ? 'Free forever'
                    : `${formatPrice(currentPlan.price_usd)}/month`}
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  Up to {currentPlan.tool_limit} tools tracked
                </div>
              </div>
              {subscription?.stripe_customer_id && (
                <button
                  onClick={handleManageBilling}
                  disabled={upgrading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 border border-slate-600 rounded-lg hover:border-slate-500 hover:text-slate-100 transition-all disabled:opacity-50"
                >
                  <CreditCard size={16} />
                  Manage Billing
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-8">
            Available Plans
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = plan.id === subscription?.plan_id;
              const isUpgrade = currentPlan && plan.price_usd > currentPlan.price_usd;

              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-900/10 border-blue-500/30'
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
                          ? 'Unlimited'
                          : plan.inbox_limit}{' '}
                        inbox{plan.inbox_limit !== 1 ? 'es' : ''}
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

                  {isCurrent ? (
                    <div className="py-3 text-center text-sm font-medium text-blue-400">
                      Current Plan
                    </div>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-900 bg-white rounded-lg hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                      {upgrading ? 'Processing...' : 'Upgrade'}
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="py-3 text-center text-sm text-slate-500">
                      {plan.price_usd === 0 ? 'Default plan' : 'Contact to downgrade'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 p-6 bg-slate-900/30 border border-slate-700 rounded-xl">
          <p className="text-slate-300 text-center">
            If Unspendify saves one forgotten renewal, it pays for itself.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
