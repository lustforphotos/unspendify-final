import { useState, useEffect } from 'react';
import { AlertCircle, Clock, UserX, RefreshCw, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Interruption {
  id: string;
  tool_id: string;
  interruption_type: string;
  priority: string;
  message: string;
  possible_actions: string[];
  triggered_at: string;
  tool: {
    vendor_name: string;
    last_charge_amount: number | null;
    billing_frequency: string;
    estimated_renewal_date: string | null;
  };
}

export default function Interruptions() {
  const [interruptions, setInterruptions] = useState<Interruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    loadInterruptions();
  }, []);

  async function loadInterruptions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!member) return;

      const { data } = await supabase
        .from('interruptions')
        .select(`
          *,
          tool:detected_tools(
            vendor_name,
            last_charge_amount,
            billing_frequency,
            estimated_renewal_date
          )
        `)
        .eq('organization_id', member.organization_id)
        .is('resolved_at', null)
        .order('priority', { ascending: true })
        .order('triggered_at', { ascending: true });

      setInterruptions(data || []);
    } catch (error) {
      console.error('Error loading interruptions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function resolveInterruption(interruption: Interruption, action: string) {
    setResolving(interruption.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('interruptions')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_action: action,
          resolved_by: user.id,
        })
        .eq('id', interruption.id);

      if (action === 'cancel') {
        await supabase
          .from('detected_tools')
          .update({ status: 'cancelled' })
          .eq('id', interruption.tool_id);
      }

      if (action === 'keep') {
        await supabase
          .from('detected_tools')
          .update({
            last_interaction_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', interruption.tool_id);
      }

      loadInterruptions();
    } catch (error) {
      console.error('Error resolving interruption:', error);
    } finally {
      setResolving(null);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-900';
      default:
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'trial_ending':
        return <Clock className="w-6 h-6" />;
      case 'silent_renewal':
        return <RefreshCw className="w-6 h-6" />;
      case 'no_owner':
        return <UserX className="w-6 h-6" />;
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Action Required
          </h1>
          <p className="text-xl text-slate-600">
            These subscriptions need your attention
          </p>
        </div>

        {interruptions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              All Clear
            </h2>
            <p className="text-slate-600">
              No action required right now. Unspendify is watching silently.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {interruptions.map((interruption) => (
              <div
                key={interruption.id}
                className={`border-2 rounded-xl p-6 ${getPriorityColor(interruption.priority)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getIcon(interruption.interruption_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">
                        {interruption.tool.vendor_name}
                      </h3>
                      <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-white bg-opacity-50">
                        {interruption.priority}
                      </span>
                    </div>
                    <p className="text-lg mb-4">{interruption.message}</p>
                    {interruption.tool.last_charge_amount && (
                      <div className="text-sm mb-4 opacity-80">
                        ${interruption.tool.last_charge_amount}/{interruption.tool.billing_frequency}
                        {interruption.tool.estimated_renewal_date && (
                          <span> • Renews {new Date(interruption.tool.estimated_renewal_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-3">
                      {interruption.possible_actions.includes('keep') && (
                        <button
                          onClick={() => resolveInterruption(interruption, 'keep')}
                          disabled={resolving === interruption.id}
                          className="bg-white hover:bg-opacity-90 text-slate-900 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Keep
                        </button>
                      )}
                      {interruption.possible_actions.includes('cancel') && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to mark this as cancelled?')) {
                              resolveInterruption(interruption, 'cancel');
                            }
                          }}
                          disabled={resolving === interruption.id}
                          className="bg-white hover:bg-opacity-90 text-slate-900 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                      {interruption.possible_actions.includes('assign_owner') && (
                        <button
                          onClick={() => resolveInterruption(interruption, 'assign_owner')}
                          disabled={resolving === interruption.id}
                          className="bg-white hover:bg-opacity-90 text-slate-900 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                        >
                          Assign Owner
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-slate-50 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-2">
            What are interruptions?
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Unspendify passively watches your company's subscriptions and only interrupts you when a decision
            is required. Unlike traditional dashboards that show insights, interruptions demand action:
            keep a tool, cancel it, or assign an owner. This ensures you never forget about a subscription
            that's silently renewing.
          </p>
        </div>
      </div>
    </div>
  );
}
