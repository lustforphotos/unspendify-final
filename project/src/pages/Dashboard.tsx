import { useEffect, useState } from 'react';
import { Package, DollarSign, Calendar, AlertCircle, Shield, Mail, ArrowRight, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DetectedTool {
  id: string;
  vendor_name: string;
  last_charge_amount: number | null;
  billing_frequency: string;
  estimated_renewal_date: string | null;
  first_seen_date: string;
  confidence_score: number;
  status: string;
  renewal_count: number;
}

interface Interruption {
  id: string;
  priority: string;
  message: string;
  tool: {
    vendor_name: string;
  };
}

interface DashboardStats {
  totalTools: number;
  monthlySpend: number;
  annualSpend: number;
  upcomingRenewals: number;
  activeInterruptions: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tools, setTools] = useState<DetectedTool[]>([]);
  const [interruptions, setInterruptions] = useState<Interruption[]>([]);
  const [hasConnection, setHasConnection] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalTools: 0,
    monthlySpend: 0,
    annualSpend: 0,
    upcomingRenewals: 0,
    activeInterruptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!member) return;

      const { data: connections } = await supabase
        .from('email_connections')
        .select('id')
        .eq('organization_id', member.organization_id)
        .eq('is_active', true);

      setHasConnection((connections?.length || 0) > 0);

      const { data: toolsData } = await supabase
        .from('detected_tools')
        .select('*')
        .eq('organization_id', member.organization_id)
        .eq('status', 'active')
        .order('first_seen_date', { ascending: false });

      setTools(toolsData || []);

      const { data: interruptionsData } = await supabase
        .from('interruptions')
        .select(`
          *,
          tool:detected_tools(vendor_name)
        `)
        .eq('organization_id', member.organization_id)
        .is('resolved_at', null)
        .order('priority', { ascending: true })
        .limit(3);

      setInterruptions(interruptionsData || []);

      let monthlySpend = 0;
      let annualSpend = 0;

      toolsData?.forEach((tool) => {
        const cost = tool.last_charge_amount || 0;
        if (tool.billing_frequency === 'monthly') {
          monthlySpend += cost;
          annualSpend += cost * 12;
        } else if (tool.billing_frequency === 'annual' || tool.billing_frequency === 'yearly') {
          annualSpend += cost;
          monthlySpend += cost / 12;
        }
      });

      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const upcomingRenewals = toolsData?.filter((tool) => {
        if (!tool.estimated_renewal_date) return false;
        const renewalDate = new Date(tool.estimated_renewal_date);
        return renewalDate >= today && renewalDate <= thirtyDaysFromNow;
      }).length || 0;

      setStats({
        totalTools: toolsData?.length || 0,
        monthlySpend: Math.round(monthlySpend),
        annualSpend: Math.round(annualSpend),
        upcomingRenewals,
        activeInterruptions: interruptionsData?.length || 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-300 bg-red-50 text-red-900';
      case 'high':
        return 'border-orange-300 bg-orange-50 text-orange-900';
      default:
        return 'border-yellow-300 bg-yellow-50 text-yellow-900';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <p className="text-slate-900 font-medium mb-2">Failed to load dashboard</p>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Your company's subscription memory layer</p>
        </div>

        {!hasConnection && (
          <div className="mb-8 bg-blue-600 rounded-xl p-8 text-white">
            <div className="flex items-start gap-6">
              <Eye className="w-12 h-12 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-3">
                  Connect Your Inbox to Get Started
                </h2>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  Unspendify reads your email inbox to automatically detect and track company subscriptions.
                  No forwarding. No manual entry. Just connect once and we'll scan your history and watch going forward.
                </p>
                <a
                  href="/app/inbox"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Connect Your Inbox
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {stats.activeInterruptions > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Action Required ({stats.activeInterruptions})
              </h2>
              <a
                href="/app/interruptions"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </a>
            </div>
            <div className="space-y-3">
              {interruptions.map((interruption) => (
                <a
                  key={interruption.id}
                  href="/app/interruptions"
                  className={`block border-2 rounded-lg p-4 ${getPriorityColor(interruption.priority)} hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold mb-1">{interruption.tool.vendor_name}</div>
                      <div className="text-sm">{interruption.message}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 flex-shrink-0 ml-4" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <a
            href="/app/tools?from=dashboard"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Package className="text-slate-600" size={18} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-slate-900 mb-1">{stats.totalTools}</div>
            <div className="text-sm text-slate-600">Detected Tools</div>
          </a>

          <a
            href="/app/analytics?from=dashboard"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <DollarSign className="text-slate-600" size={18} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-slate-900 mb-1">${stats.monthlySpend.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Monthly Spend</div>
          </a>

          <a
            href="/app/renewals?from=dashboard"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Calendar className="text-slate-600" size={18} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-slate-900 mb-1">{stats.upcomingRenewals}</div>
            <div className="text-sm text-slate-600">Renewals (30d)</div>
          </a>

          <a
            href="/app/interruptions?from=dashboard"
            className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <AlertCircle className="text-slate-600" size={18} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-slate-900 mb-1">{stats.activeInterruptions}</div>
            <div className="text-sm text-slate-600">Need Attention</div>
          </a>
        </div>

        {tools.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Recently Detected</h2>
              <a
                href="/app/tools?from=dashboard&sort=first_seen_date&order=desc"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all tools →
              </a>
            </div>
            <div className="space-y-3">
              {tools.slice(0, 5).map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div>
                    <div className="font-medium text-slate-900 mb-1">{tool.vendor_name}</div>
                    <div className="text-sm text-slate-600">
                      {tool.last_charge_amount && `$${tool.last_charge_amount}/${tool.billing_frequency}`}
                      {tool.renewal_count > 0 && ` • ${tool.renewal_count} renewals detected`}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    Found {new Date(tool.first_seen_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
              <Shield className="text-slate-600" size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Unspendify is watching quietly
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                We automatically scan your connected inboxes daily. You'll only hear from us when a decision is required.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-sm font-medium text-slate-900 mb-1">Automated scanning</div>
              <div className="text-xs text-slate-600">Daily inbox checks, zero user action</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-sm font-medium text-slate-900 mb-1">Memory layer</div>
              <div className="text-xs text-slate-600">Remembers every subscription for you</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-sm font-medium text-slate-900 mb-1">Decision-only alerts</div>
              <div className="text-xs text-slate-600">Interrupt only when action is needed</div>
            </div>
          </div>
        </div>
    </div>
  );
}
