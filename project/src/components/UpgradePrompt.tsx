import { useState } from 'react';
import { ArrowRight, X, AlertCircle } from 'lucide-react';
import { createCheckoutSession } from '../lib/billing';

interface UpgradePromptProps {
  reason?: string;
  toolCount?: number;
  planLimit?: number;
  onClose?: () => void;
}

export default function UpgradePrompt({
  reason = "We've detected more tools than your plan tracks.",
  toolCount,
  planLimit,
  onClose,
}: UpgradePromptProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Plan Limit Reached
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              {reason}
            </p>
            {toolCount !== undefined && planLimit !== undefined && (
              <p className="text-slate-400 text-sm mt-2">
                You're tracking {toolCount} tools. Your plan covers {planLimit}.
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleUpgrade('starter')}
            disabled={upgrading}
            className="w-full p-4 bg-slate-800 border border-slate-600 rounded-lg hover:border-slate-500 transition-all disabled:opacity-50 text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-slate-100">Starter</span>
              <span className="text-lg font-semibold text-slate-100">$19/mo</span>
            </div>
            <p className="text-sm text-slate-400">Track up to 15 tools</p>
          </button>

          <button
            onClick={() => handleUpgrade('growth')}
            disabled={upgrading}
            className="w-full p-4 bg-slate-800 border border-slate-600 rounded-lg hover:border-slate-500 transition-all disabled:opacity-50 text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-slate-100">Growth</span>
              <span className="text-lg font-semibold text-slate-100">$49/mo</span>
            </div>
            <p className="text-sm text-slate-400">Track up to 50 tools</p>
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Upgrade to avoid forgotten renewals
        </p>
      </div>
    </div>
  );
}
