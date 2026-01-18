import { useEffect, useState } from 'react';
import { Bell, AlertCircle, CheckCircle, Mail, Calendar, Package } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  notification_type: string;
  tool_id: string | null;
  subject: string;
  sent_at: string;
  read_at: string | null;
  tool_name: string | null;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          tools:tool_id (
            tool_name
          )
        `)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications = (data || []).map((notif: any) => ({
        ...notif,
        tool_name: notif.tools?.tool_name || null,
      }));

      setNotifications(formattedNotifications);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      const now = new Date().toISOString();
      setNotifications(notifications.map((n) => ({ ...n, read_at: n.read_at || now })));
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'renewal_reminder':
        return <Calendar className="text-blue-600" size={20} />;
      case 'new_tool_detected':
        return <Package className="text-green-600" size={20} />;
      case 'trial_ending':
        return <AlertCircle className="text-orange-600" size={20} />;
      default:
        return <Bell className="text-slate-600" size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.read_at)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (loading) {
    return (
      <AppLayout currentPath="/app/notifications">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading notifications...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentPath="/app/notifications">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
            <p className="text-slate-900 font-medium mb-2">Failed to load notifications</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPath="/app/notifications">
      <div>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 mb-2">Notifications</h1>
              <p className="text-slate-600">Stay updated on your subscriptions</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  filter === 'unread'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-slate-900 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="mx-auto mb-4 text-slate-400" size={48} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="text-slate-600">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : "You'll see notifications about renewals and new tools here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                    !notification.read_at ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={() => !notification.read_at && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {getIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="font-medium text-slate-900">{notification.subject}</div>
                        <div className="text-sm text-slate-500 flex-shrink-0">
                          {formatDate(notification.sent_at)}
                        </div>
                      </div>
                      {notification.tool_name && (
                        <div className="text-sm text-slate-600">
                          Related to: <span className="font-medium">{notification.tool_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-slate-500 capitalize">
                          {notification.notification_type.replace(/_/g, ' ')}
                        </span>
                        {!notification.read_at && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
