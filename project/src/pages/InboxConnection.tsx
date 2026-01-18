import { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailConnection {
  id: string;
  provider: string;
  email_address: string;
  is_active: boolean;
  last_scan_at: string | null;
  last_backfill_at: string | null;
  created_at: string;
}

export default function InboxConnection() {
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (member) {
        setOrganizationId(member.organization_id);

        const { data } = await supabase
          .from('email_connections')
          .select('*')
          .eq('organization_id', member.organization_id)
          .order('created_at', { ascending: false });

        setConnections(data || []);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  }

  async function connectInbox(provider: 'gmail' | 'outlook') {
    if (!organizationId) return;

    setConnecting(provider);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            provider,
            organizationId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate OAuth');
      }

      const { authUrl } = await response.json();

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setConnecting(null);
          loadConnections();
        }
      }, 500);
    } catch (err: any) {
      console.error('Error connecting inbox:', err);
      setError(err.message || 'Failed to connect inbox');
      setConnecting(null);
    }
  }

  async function disconnectInbox(connectionId: string) {
    if (!confirm('Disconnect this inbox? You will stop receiving updates from it.')) {
      return;
    }

    try {
      await supabase
        .from('email_connections')
        .update({ is_active: false })
        .eq('id', connectionId);

      loadConnections();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Connect Your Inbox
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Unspendify reads your email to automatically detect and track company subscriptions.
            No forwarding. No manual tagging. Just connect once and forget.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">
                  Connection Error
                </h3>
                <p className="text-red-800 text-sm mb-3">
                  {error}
                </p>
                {(error.includes('not configured') || error.includes('OAuth')) && (
                  <div className="text-sm text-red-700 bg-red-100 rounded p-3">
                    <p className="font-semibold mb-2">OAuth Setup Required</p>
                    <p className="mb-2">To connect Gmail or Outlook, you need to configure OAuth credentials:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Create OAuth credentials in Google Cloud Console or Azure Portal</li>
                      <li>Set environment variables in your Supabase project</li>
                      <li>Redeploy the oauth-initiate edge function</li>
                    </ol>
                    <p className="mt-3 text-xs">
                      See docs/EDGE_FUNCTIONS.md for detailed setup instructions.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setError(null)}
                  className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Read-Only Access
              </h3>
              <p className="text-blue-800 text-sm leading-relaxed mb-3">
                Unspendify can only read invoice-related emails. It cannot send, modify, or delete anything.
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✓ Reads sender, subject, and plain text body</li>
                <li>✓ Searches for keywords like "invoice", "subscription", "payment"</li>
                <li>✗ No access to attachments, PDFs, or credit card numbers</li>
                <li>✗ Cannot send, delete, or modify emails</li>
              </ul>
            </div>
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <button
              onClick={() => connectInbox('gmail')}
              disabled={connecting !== null}
              className="bg-white border-2 border-slate-200 rounded-xl p-8 hover:border-blue-500 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Connect Gmail
              </h3>
              <p className="text-slate-600 text-sm">
                Google Workspace and personal Gmail accounts
              </p>
              {connecting === 'gmail' && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Opening OAuth...</span>
                </div>
              )}
            </button>

            <button
              onClick={() => connectInbox('outlook')}
              disabled={connecting !== null}
              className="bg-white border-2 border-slate-200 rounded-xl p-8 hover:border-blue-500 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Connect Outlook
              </h3>
              <p className="text-slate-600 text-sm">
                Microsoft 365 and Outlook.com accounts
              </p>
              {connecting === 'outlook' && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Opening OAuth...</span>
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-12">
            <h2 className="text-2xl font-semibold text-slate-900">Connected Inboxes</h2>
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="bg-white border border-slate-200 rounded-lg p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    conn.is_active ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    {conn.is_active ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {conn.email_address}
                    </div>
                    <div className="text-sm text-slate-600 capitalize">
                      {conn.provider} • Connected {new Date(conn.created_at).toLocaleDateString()}
                    </div>
                    {conn.last_scan_at && (
                      <div className="text-xs text-slate-500">
                        Last scan: {new Date(conn.last_scan_at).toLocaleString()}
                      </div>
                    )}
                    {conn.last_backfill_at && (
                      <div className="text-xs text-green-600">
                        ✓ Historical scan completed
                      </div>
                    )}
                  </div>
                </div>
                {conn.is_active && (
                  <button
                    onClick={() => disconnectInbox(conn.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            ))}

            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Connect Another Inbox
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => connectInbox('gmail')}
                  disabled={connecting !== null}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:border-blue-500 hover:shadow transition-all disabled:opacity-50 text-center"
                >
                  <Mail className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <span className="font-medium text-slate-900">Add Gmail</span>
                </button>
                <button
                  onClick={() => connectInbox('outlook')}
                  disabled={connecting !== null}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:border-blue-500 hover:shadow transition-all disabled:opacity-50 text-center"
                >
                  <Mail className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <span className="font-medium text-slate-900">Add Outlook</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-50 rounded-lg p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            What Happens After You Connect?
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                1
              </div>
              <div>
                <div className="font-medium text-slate-900">Historical Backfill (Immediate)</div>
                <div className="text-sm text-slate-600">
                  Unspendify scans 6-12 months of your email history to find all existing subscriptions.
                  Within minutes, your dashboard will show tools you forgot about.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                2
              </div>
              <div>
                <div className="font-medium text-slate-900">Daily Automated Scanning</div>
                <div className="text-sm text-slate-600">
                  Every day at 2 AM, Unspendify automatically checks for new subscription emails.
                  No action required from you. Ever.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                3
              </div>
              <div>
                <div className="font-medium text-slate-900">Interruption-Only Alerts</div>
                <div className="text-sm text-slate-600">
                  Unspendify only interrupts you when a decision is required: trial ending, renewal coming,
                  no owner assigned, or silent renewals detected.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
