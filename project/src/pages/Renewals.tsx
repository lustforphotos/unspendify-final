import { useEffect, useState } from 'react';
import { Calendar, AlertCircle, Clock, DollarSign } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';

interface Tool {
  id: string;
  vendor_name: string;
  current_amount: number;
  billing_cycle: string;
  status: string;
}

interface Renewal {
  id: string;
  tool_id: string;
  renewal_date: string;
  amount: number;
}

interface RenewalWithTool {
  renewal: Renewal;
  tool: Tool;
}

interface RenewalGroup {
  date: string;
  renewals: RenewalWithTool[];
  totalCost: number;
}

export default function Renewals() {
  const [renewalGroups, setRenewalGroups] = useState<RenewalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'30' | '60' | '90'>('30');

  useEffect(() => {
    loadRenewals();
  }, [timeRange]);

  const loadRenewals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(timeRange));
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data: renewalsData, error: renewalsError } = await supabase
        .from('renewals')
        .select('*')
        .gte('renewal_date', today)
        .lte('renewal_date', endDateStr)
        .order('renewal_date', { ascending: true });

      if (renewalsError) throw renewalsError;

      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .eq('status', 'active');

      if (toolsError) throw toolsError;

      const toolsMap = new Map<string, Tool>();
      (toolsData || []).forEach((tool) => {
        toolsMap.set(tool.id, tool);
      });

      const renewalsWithTools: RenewalWithTool[] = (renewalsData || [])
        .map((renewal) => {
          const tool = toolsMap.get(renewal.tool_id);
          return tool ? { renewal, tool } : null;
        })
        .filter((item): item is RenewalWithTool => item !== null);

      const grouped = groupByDate(renewalsWithTools);
      setRenewalGroups(grouped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (renewalsWithTools: RenewalWithTool[]): RenewalGroup[] => {
    const groups: { [key: string]: RenewalWithTool[] } = {};

    renewalsWithTools.forEach((item) => {
      const date = item.renewal.renewal_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return Object.entries(groups)
      .map(([date, renewals]) => ({
        date,
        renewals,
        totalCost: renewals.reduce((sum, item) => sum + item.renewal.amount, 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const renewalDate = new Date(dateString);
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTotalUpcoming = () => {
    return renewalGroups.reduce((sum, group) => sum + group.totalCost, 0);
  };

  const getTotalRenewalsCount = () => {
    return renewalGroups.reduce((sum, group) => sum + group.renewals.length, 0);
  };

  if (loading) {
    return (
      <AppLayout currentPath="/app/renewals">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading renewals...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentPath="/app/renewals">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
            <p className="text-slate-900 font-medium mb-2">Failed to load renewals</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPath="/app/renewals">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Renewals</h1>
          <p className="text-slate-600">Track upcoming subscription renewals</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-600 mb-1">Upcoming Renewals</div>
              <div className="text-2xl font-semibold text-slate-900">{getTotalRenewalsCount()}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Total Cost</div>
              <div className="text-2xl font-semibold text-slate-900">${getTotalUpcoming().toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Time Range</div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '30' | '60' | '90')}
                className="text-lg font-semibold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="30">Next 30 days</option>
                <option value="60">Next 60 days</option>
                <option value="90">Next 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {renewalGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Calendar className="mx-auto mb-4 text-slate-400" size={48} />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming renewals</h3>
            <p className="text-slate-600">
              You have no renewals scheduled in the next {timeRange} days
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {renewalGroups.map((group) => {
              const daysUntil = getDaysUntil(group.date);
              return (
                <div key={group.date} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{formatDate(group.date)}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <Clock size={14} />
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days away`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600">Total</div>
                        <div className="text-xl font-semibold text-slate-900">${group.totalCost}</div>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {group.renewals.map((item) => (
                      <div key={item.renewal.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 mb-1">{item.tool.vendor_name}</div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span className="capitalize">{item.tool.billing_cycle} billing</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 font-medium text-slate-900">
                              <DollarSign size={16} />
                              {item.renewal.amount}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
