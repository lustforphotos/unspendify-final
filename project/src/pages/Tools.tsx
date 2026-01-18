import { useEffect, useState } from 'react';
import { Package, Search, Filter, DollarSign, Calendar, AlertCircle, X, Save } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import ToolClassificationActions from '../components/ToolClassificationActions';
import { supabase } from '../lib/supabase';
import { getCategoryLabel, getCategoryColor } from '../lib/classification';

interface Tool {
  id: string;
  vendor_name: string;
  last_charge_amount: number;
  billing_frequency: string;
  status: string;
  first_seen_date: string;
  organization_id: string;
  marketing_relevance_score: number;
  tool_category: string;
  classification_confidence: number;
  estimated_renewal_date: string | null;
  confirmed_owner_id: string | null;
}

interface ToolWithDetails extends Tool {
  owner_email?: string | null;
}

export default function Tools() {
  const [tools, setTools] = useState<ToolWithDetails[]>([]);
  const [filteredTools, setFilteredTools] = useState<ToolWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setcategoryFilter] = useState<string>('all');
  const [editingTool, setEditingTool] = useState<ToolWithDetails | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  useEffect(() => {
    filterTools();
  }, [tools, searchQuery, statusFilter, categoryFilter]);

  const loadTools = async () => {
    try {
      const { data: toolsData, error: toolsError } = await supabase
        .from('detected_tools')
        .select('*')
        .order('vendor_name', { ascending: true });

      if (toolsError) throw toolsError;

      const toolsWithDetails: ToolWithDetails[] = (toolsData || []).map((tool) => ({
        ...tool,
        owner_email: null,
      }));

      setTools(toolsWithDetails);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterTools = () => {
    let filtered = [...tools];

    if (searchQuery) {
      filtered = filtered.filter((tool) =>
        tool.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((tool) => tool.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((tool) => tool.tool_category === categoryFilter);
    }

    setFilteredTools(filtered);
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool({ ...tool });
  };

  const handleSave = async () => {
    if (!editingTool) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('detected_tools')
        .update({
          status: editingTool.status,
        })
        .eq('id', editingTool.id);

      if (error) throw error;

      setTools(tools.map((t) => (t.id === editingTool.id ? editingTool : t)));
      setEditingTool(null);
    } catch (err: any) {
      alert('Failed to update tool: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTotalSpend = () => {
    return tools.reduce((total, tool) => {
      if (tool.status !== 'active') return total;
      const cost = tool.last_charge_amount || 0;
      if (tool.billing_frequency === 'monthly') {
        return total + (cost * 12);
      } else if (tool.billing_frequency === 'yearly') {
        return total + cost;
      }
      return total;
    }, 0);
  };

  if (loading) {
    return (
      <AppLayout currentPath="/app/tools">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading tools...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentPath="/app/tools">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
            <p className="text-slate-900 font-medium mb-2">Failed to load tools</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPath="/app/tools">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Tools</h1>
          <p className="text-slate-600">Manage all your subscription tools</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-600 mb-1">Total Tools</div>
              <div className="text-2xl font-semibold text-slate-900">{tools.length}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Active</div>
              <div className="text-2xl font-semibold text-slate-900">
                {tools.filter((t) => t.status === 'active').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Annual Spend</div>
              <div className="text-2xl font-semibold text-slate-900">${getTotalSpend().toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-slate-400" size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setcategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="marketing">Marketing</option>
                  <option value="marketing_adjacent">Marketing-Related</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Tool Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Billing
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Next Renewal
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTools.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Package className="mx-auto mb-3 text-slate-400" size={32} />
                      <p className="text-slate-600">No tools found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTools.map((tool) => (
                    <tr key={tool.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{tool.vendor_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-900">
                          <DollarSign size={14} />
                          {tool.last_charge_amount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-600 capitalize">{tool.billing_frequency}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar size={14} />
                          {formatDate(tool.estimated_renewal_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-600">{tool.owner_email || 'Unassigned'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <ToolClassificationActions
                          toolId={tool.id}
                          currentCategory={tool.tool_category}
                          onUpdate={loadTools}
                          compact={true}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            tool.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : tool.status === 'trial'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tool.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEdit(tool)}
                          className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingTool && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Edit Tool</h2>
              <button
                onClick={() => setEditingTool(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Vendor Name</label>
                <input
                  type="text"
                  value={editingTool.vendor_name}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={editingTool.status}
                  onChange={(e) => setEditingTool({ ...editingTool, status: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingTool(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
