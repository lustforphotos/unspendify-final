import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Package, Calendar, AlertCircle } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';

interface Tool {
  id: string;
  vendor_name: string;
  current_amount: number;
  billing_cycle: string;
  status: string;
  first_detected_at: string;
}

interface SpendingData {
  totalMonthly: number;
  totalAnnual: number;
  byCategory: { [key: string]: number };
  topTools: { name: string; cost: number; billing: string }[];
}

export default function Analytics() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [spending, setSpending] = useState<SpendingData>({
    totalMonthly: 0,
    totalAnnual: 0,
    byCategory: {},
    topTools: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365'>('30');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('status', 'active')
        .order('current_amount', { ascending: false });

      if (error) throw error;

      const tools = data || [];
      setTools(tools);

      let totalMonthly = 0;
      let totalAnnual = 0;

      tools.forEach((tool) => {
        const cost = tool.current_amount || 0;
        if (tool.billing_cycle === 'monthly') {
          totalMonthly += cost;
          totalAnnual += cost * 12;
        } else if (tool.billing_cycle === 'yearly') {
          totalAnnual += cost;
          totalMonthly += cost / 12;
        }
      });

      const topTools = tools.slice(0, 5).map((tool) => ({
        name: tool.vendor_name,
        cost: tool.current_amount,
        billing: tool.billing_cycle,
      }));

      setSpending({
        totalMonthly: Math.round(totalMonthly),
        totalAnnual: Math.round(totalAnnual),
        byCategory: {},
        topTools,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyBreakdown = () => {
    const monthly = tools.filter((t) => t.billing_cycle === 'monthly').length;
    const annual = tools.filter((t) => t.billing_cycle === 'annual').length;
    const total = tools.length;

    return {
      monthly: { count: monthly, percentage: total > 0 ? Math.round((monthly / total) * 100) : 0 },
      annual: { count: annual, percentage: total > 0 ? Math.round((annual / total) * 100) : 0 },
    };
  };

  const getAverageCost = () => {
    if (tools.length === 0) return 0;
    return Math.round(spending.totalMonthly / tools.length);
  };

  const getGrowthRate = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentTools = tools.filter(
      (t) => new Date(t.first_detected_at) >= thirtyDaysAgo
    ).length;

    return recentTools;
  };

  const breakdown = getMonthlyBreakdown();

  if (loading) {
    return (
      <AppLayout currentPath="/app/analytics">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentPath="/app/analytics">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
            <p className="text-slate-900 font-medium mb-2">Failed to load analytics</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPath="/app/analytics">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Analytics</h1>
          <p className="text-slate-600">Insights into your subscription spending</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <DollarSign className="text-slate-700" size={20} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-slate-900 mb-1">
              ${spending.totalAnnual.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">Total annual spend</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <TrendingUp className="text-slate-700" size={20} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-slate-900 mb-1">
              ${spending.totalMonthly.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">Average monthly spend</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Package className="text-slate-700" size={20} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-slate-900 mb-1">{tools.length}</div>
            <div className="text-sm text-slate-600">Active subscriptions</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Calendar className="text-slate-700" size={20} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-slate-900 mb-1">${getAverageCost()}</div>
            <div className="text-sm text-slate-600">Avg cost per tool</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Billing Breakdown</h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Monthly Billing</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {breakdown.monthly.count} tools ({breakdown.monthly.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-slate-900 h-2 rounded-full transition-all"
                    style={{ width: `${breakdown.monthly.percentage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Annual Billing</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {breakdown.annual.count} tools ({breakdown.annual.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-slate-700 h-2 rounded-full transition-all"
                    style={{ width: `${breakdown.annual.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">New tools (last 30 days)</span>
                <span className="font-semibold text-slate-900">{getGrowthRate()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Top 5 Expenses</h2>

            {spending.topTools.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto mb-3 text-slate-400" size={32} />
                <p className="text-slate-600">No tools to display</p>
              </div>
            ) : (
              <div className="space-y-4">
                {spending.topTools.map((tool, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{tool.name}</div>
                        <div className="text-sm text-slate-600 capitalize">{tool.billing}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">${tool.cost}</div>
                      <div className="text-xs text-slate-600">
                        {tool.billing === 'monthly' ? '/mo' : '/yr'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Spending Insights</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-semibold text-blue-900 mb-1">
                ${Math.round(spending.totalMonthly * 12).toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">
                Projected annual spend based on current subscriptions
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-semibold text-green-900 mb-1">
                {breakdown.annual.count}
              </div>
              <div className="text-sm text-green-700">
                Tools with annual billing (typically 16% savings vs monthly)
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-semibold text-orange-900 mb-1">
                ${getAverageCost()}
              </div>
              <div className="text-sm text-orange-700">
                Average cost per tool per month
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
