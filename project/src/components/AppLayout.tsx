import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Package, Calendar, Bell, Settings, TrendingUp, LogOut, Check, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/router';
import { supabase } from '../lib/supabase';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

interface Notification {
  id: string;
  type: string;
  scheduled_for: string;
  sent_at: string | null;
  status: string;
  tool_id: string | null;
}

export default function AppLayout({ children, currentPath }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/app', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/app/interruptions', label: 'Interruptions', icon: AlertCircle },
    { path: '/app/tools', label: 'Tools', icon: Package },
    { path: '/app/inbox', label: 'Inbox', icon: Mail },
    { path: '/app/renewals', label: 'Renewals', icon: Calendar },
    { path: '/app/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/app/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <a href="/app" className="text-xl font-semibold text-slate-900">
                Unspendify
              </a>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <a
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                    <div className="p-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs text-slate-600">{unreadCount} new</span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="mx-auto mb-2 text-slate-400" size={32} />
                          <p className="text-sm text-slate-600">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {notifications.map((notification) => (
                            <div key={notification.id} className="p-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-900 capitalize">
                                    {notification.type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    Scheduled for {new Date(notification.scheduled_for).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-sm text-slate-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
