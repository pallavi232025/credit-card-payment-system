/**
 * Admin Activity Logs page.
 */
import { useEffect, useState } from 'react';
import { adminAPI } from '../../api';
import type { AdminLog, Pagination } from '../../types';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, page_size: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLogs = (page = 1) => {
    setLoading(true);
    adminAPI.getLogs({ page, page_size: 20 })
      .then(r => { setLogs(r.data.data.logs); setPagination(r.data.data.pagination); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const actionColor = (action: string) => {
    if (action.includes('ACTIVATE')) return 'text-emerald-400';
    if (action.includes('DEACTIVATE')) return 'text-red-400';
    if (action.includes('EXPORT')) return 'text-blue-400';
    if (action.includes('VIEW')) return 'text-slate-400';
    return 'text-amber-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
        <p className="text-slate-400 mt-1">Admin operation audit trail</p>
      </div>

      <div className="bg-white/80 rounded-2xl border border-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">{[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-slate-100/50 rounded-lg" />)}</div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center"><ScrollText className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-900 font-medium">No logs yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Admin</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Entity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-100/20 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-indigo-400">{log.admin_email}</td>
                    <td className="px-6 py-3"><span className={`text-sm font-medium ${actionColor(log.action)}`}>{log.action}</span></td>
                    <td className="px-6 py-3 text-sm text-slate-700">{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</td>
                    <td className="px-6 py-3 text-sm text-slate-400 max-w-[250px] truncate">{log.description}</td>
                    <td className="px-6 py-3 text-sm text-slate-400 font-mono">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50">
            <p className="text-sm text-slate-400">Page {pagination.page} of {pagination.total_pages}</p>
            <div className="flex gap-2">
              <button onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => fetchLogs(pagination.page + 1)} disabled={pagination.page >= pagination.total_pages} className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
