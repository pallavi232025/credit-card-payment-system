/**
 * Admin Reports page - daily payment summary with export.
 */
import { useEffect, useState } from 'react';
import { adminAPI } from '../../api';
import type { DailySummary } from '../../types';
import { BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchSummary = () => {
    setLoading(true);
    adminAPI.getDailySummary({ days })
      .then(r => setSummary(r.data.data.daily_summary))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSummary(); }, [days]);

  const exportCSV = async () => {
    try {
      const res = await adminAPI.exportCSV({});
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  const chartData = summary.slice(0, 14).reverse().map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: Number(d.successful_amount),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-400 mt-1">Daily payment summary and analytics</p>
        </div>
        <div className="flex gap-3">
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="px-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 rounded-xl text-sm text-slate-900 font-medium hover:bg-emerald-700">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Amount Chart */}
      <div className="bg-white/80 rounded-2xl border border-slate-200/50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Successful Amount</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-400 text-center py-12">No data for this period</p>}
      </div>

      {/* Summary Table */}
      <div className="bg-white/80 rounded-2xl border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-900">Daily Summary</h3>
        </div>
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-100/50 rounded-lg" />)}</div>
        ) : summary.length === 0 ? (
          <div className="p-16 text-center"><BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-900">No data</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Success</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Failed</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Success Amt</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Failed Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {summary.map(d => (
                  <tr key={d.date} className="hover:bg-slate-100/20">
                    <td className="px-6 py-3 text-sm text-slate-900">{d.date}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{d.total_transactions}</td>
                    <td className="px-6 py-3 text-sm text-emerald-400">{d.successful_transactions}</td>
                    <td className="px-6 py-3 text-sm text-red-400">{d.failed_transactions}</td>
                    <td className="px-6 py-3 text-sm text-amber-400">{d.pending_transactions}</td>
                    <td className="px-6 py-3 text-sm text-slate-900 font-medium">₹{Number(d.successful_amount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3 text-sm text-slate-400">₹{Number(d.failed_amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
