import { Package, Calendar, TrendingUp, DollarSign } from 'lucide-react';

interface ProductScreenshotProps {
  variant?: 'dashboard' | 'tools' | 'analytics' | 'renewals';
  className?: string;
}

export default function ProductScreenshot({ variant = 'dashboard', className = '' }: ProductScreenshotProps) {
  if (variant === 'dashboard') {
    return (
      <div className={`screenshot-frame ${className}`}>
        <div className="screenshot-inner p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Active Subscriptions</h3>
              <div className="text-2xl font-semibold text-slate-200">12 tools</div>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Monthly Spend</h3>
              <div className="text-2xl font-semibold text-indigo-400">$2,847</div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Analytics Platform', cost: '$499', date: 'Renews Dec 15' },
              { name: 'Email Service', cost: '$299', date: 'Renews Dec 22' },
              { name: 'CRM Suite', cost: '$899', date: 'Renews Jan 3' },
              { name: 'Design Tools', cost: '$240', date: 'Renews Jan 8' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-soft min-w-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-200 truncate">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.date}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-300 ml-2 whitespace-nowrap">{item.cost}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'tools') {
    return (
      <div className={`screenshot-frame ${className}`}>
        <div className="screenshot-inner p-6">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search tools..."
                className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-soft rounded-lg text-sm text-slate-200 placeholder-slate-500"
                disabled
              />
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg whitespace-nowrap">
              Add Tool
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Slack', users: '24 users', status: 'active' },
              { name: 'Notion', users: '18 users', status: 'active' },
              { name: 'Figma', users: '12 users', status: 'trial' },
              { name: 'GitHub', users: '32 users', status: 'active' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-soft min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{item.name}</div>
                    <div className="text-xs text-slate-500 truncate">{item.users}</div>
                  </div>
                </div>
                <div className={`inline-block px-2 py-0.5 rounded text-xs ${
                  item.status === 'active'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'renewals') {
    return (
      <div className={`screenshot-frame ${className}`}>
        <div className="screenshot-inner p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Upcoming Renewals</h3>
            <div className="text-2xl font-semibold text-slate-200">Next 30 Days</div>
          </div>

          <div className="space-y-3">
            {[
              { name: 'HubSpot Enterprise', cost: '$450', date: 'Renews in 3 days', urgent: true },
              { name: 'Mailchimp Pro', cost: '$49', date: 'Renews in 12 days', urgent: false },
              { name: 'Ahrefs Suite', cost: '$99', date: 'Renews in 24 days', urgent: false },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border ${item.urgent ? 'border-yellow-500/30' : 'border-soft'} min-w-0`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.urgent ? 'bg-yellow-500/10' : 'bg-indigo-500/10'}`}>
                    <Calendar size={16} className={item.urgent ? 'text-yellow-400' : 'text-indigo-400'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-200 truncate">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.date}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-300 ml-2 whitespace-nowrap">{item.cost}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`screenshot-frame ${className}`}>
      <div className="screenshot-inner p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-soft">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-indigo-400" />
              <span className="text-xs text-slate-400">Annual Spend</span>
            </div>
            <div className="text-xl font-semibold text-slate-200">$34,164</div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-soft">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-xs text-slate-400">This Month</span>
            </div>
            <div className="text-xl font-semibold text-slate-200">$2,847</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Top 5 Expenses</span>
            <span>Monthly</span>
          </div>
          {[
            { name: 'CRM Suite', amount: 899, width: 100 },
            { name: 'Analytics', amount: 499, width: 60 },
            { name: 'Email Service', amount: 299, width: 35 },
            { name: 'Design Tools', amount: 240, width: 30 },
            { name: 'Storage', amount: 180, width: 22 },
          ].map((item, i) => (
            <div key={i} className="space-y-1 min-w-0">
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-slate-300 truncate">{item.name}</span>
                <span className="text-slate-400 whitespace-nowrap">${item.amount}</span>
              </div>
              <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${item.width}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
