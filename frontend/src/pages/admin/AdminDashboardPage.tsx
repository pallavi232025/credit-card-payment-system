/**
 * Admin Dashboard with summary metrics, charts, and quick actions.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api';
import type { AdminDashboardStats, DailySummary } from '../../types';
import { Users, CreditCard, FileText, CheckCircle2, XCircle, Clock, TrendingUp, Download, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getDashboard(),
      adminAPI.getDailySummary({ days: 7 }),
    ]).then(([statsRes, summaryRes]) => {
      setStats(statsRes.data.data);
      setDailySummary(summaryRes.data.data.daily_summary);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-slate-100 rounded-xl w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100/50 rounded-2xl" />)}
      </div>
    </div>;
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Cards', value: stats?.total_cards || 0, icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Transactions', value: stats?.total_transactions || 0, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Today', value: stats?.today_transactions || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Successful', value: stats?.successful_payments || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Failed', value: stats?.failed_payments || 0, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  const pieData = [
    { name: 'Success', value: stats?.successful_payments || 0, color: '#10b981' },
    { name: 'Failed', value: stats?.failed_payments || 0, color: '#ef4444' },
    { name: 'Pending', value: stats?.pending_payments || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const barData = dailySummary.slice(0, 7).reverse().map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Successful: d.successful_transactions,
    Failed: d.failed_transactions,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">System overview and analytics</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/reports" className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-300/50 rounded-xl text-sm text-slate-700 hover:bg-slate-200">
            <BarChart3 className="w-4 h-4" /> Reports
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white/80 rounded-2xl border border-slate-200/50 p-4 hover:border-slate-300/50 transition-all">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Total Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-sm text-slate-400">Total Successful Amount</p>
              <p className="text-2xl font-bold text-slate-900">₹{Number(stats?.total_success_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-slate-400">Today&apos;s Amount</p>
              <p className="text-2xl font-bold text-slate-900">₹{Number(stats?.today_success_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white/80 rounded-2xl border border-slate-200/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Payments by Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-center py-12">No data</p>}
        </div>

        {/* Bar Chart */}
        <div className="bg-white/80 rounded-2xl border border-slate-200/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Payment Volume (7 days)</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="Successful" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-center py-12">No data</p>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/admin/users', label: 'Manage Users', icon: Users, color: 'from-blue-500 to-cyan-500' },
          { to: '/admin/cards', label: 'View Cards', icon: CreditCard, color: 'from-purple-500 to-pink-500' },
          { to: '/admin/transactions', label: 'Transactions', icon: FileText, color: 'from-indigo-500 to-blue-500' },
          { to: '/admin/reports', label: 'Export CSV', icon: Download, color: 'from-emerald-500 to-teal-500' },
        ].map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to} className="bg-white/80 rounded-2xl border border-slate-200/50 p-5 hover:border-slate-300/50 transition-all group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5 text-slate-900" />
            </div>
            <p className="text-sm font-medium text-slate-900">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
