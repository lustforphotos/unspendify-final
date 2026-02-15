import { useEffect, useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  users: {
    email: string;
  } | null;
}

export default function Settings() {
  const { user } = useAuth();
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      if (!user) return;

      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;
      if (!memberData) throw new Error('No organization found');

      setOrgId(memberData.organization_id);

      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('id, user_id, role, created_at, users(email)')
        .eq('organization_id', memberData.organization_id)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      setOrganizationMembers(members || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
            <p className="text-slate-900 font-medium mb-2">Failed to load settings</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your organization and account</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users className="text-slate-700" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Organization Members</h2>
                <p className="text-sm text-slate-600">Manage who can access your subscription data</p>
              </div>
            </div>

            {organizationMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto mb-3 text-slate-400" size={32} />
                <p className="text-slate-600">No organization members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {organizationMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{member.users?.email || 'Unknown'}</div>
                      <div className="text-sm text-slate-600">
                        Joined {formatDate(member.created_at)} • {member.role}
                      </div>
                    </div>
                    {member.user_id === user?.id && (
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
