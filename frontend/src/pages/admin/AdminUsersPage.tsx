/**
 * Admin User Management page - list, search, filter, activate/deactivate users.
 */
import { useEffect, useState } from 'react';
import { adminAPI } from '../../api';
import type { User, Pagination } from '../../types';
import { Search, ChevronLeft, ChevronRight, UserCheck, UserX, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, page_size: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = (page = 1) => {
    setLoading(true);
    const params: Record<string, string | number> = { page, page_size: 20 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    adminAPI.getUsers(params)
      .then(r => { setUsers(r.data.data.users); setPagination(r.data.data.pagination); })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (userId: number, isActive: boolean) => {
    setTogglingId(userId);
    try {
      await adminAPI.updateUser(userId, { is_active: !isActive });
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-400 mt-1">Manage system users</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Search by name or email..." />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); }}
          className="px-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button onClick={() => fetchUsers(1)} className="px-4 py-2.5 bg-indigo-600 text-slate-900 rounded-xl text-sm font-medium hover:bg-indigo-700">Search</button>
      </div>

      {/* Table */}
      <div className="bg-white/80 rounded-2xl border border-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100/50 rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Cards</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Transactions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-100/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br -white text-xs font-bold">
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                        {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{u.card_count ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{u.transaction_count ?? 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.id !== currentUser?.id ? (
                        <button onClick={() => toggleActive(u.id, u.is_active)} disabled={togglingId === u.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                          {togglingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : u.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : <span className="text-xs text-slate-600">Current user</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50">
            <p className="text-sm text-slate-400">Page {pagination.page} of {pagination.total_pages} ({pagination.total} users)</p>
            <div className="flex gap-2">
              <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.total_pages} className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
