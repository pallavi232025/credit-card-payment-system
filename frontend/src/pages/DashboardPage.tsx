/**
 * User Dashboard with stats cards, recent transactions, and quick actions.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api';
import type { DashboardStats } from '../types';
import { CreditCard, Wallet, CheckCircle2, XCircle, Clock, TrendingUp, Plus, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.getDashboard().then(r => setStats(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-100/50 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Saved Cards', value: stats?.card_count || 0, icon: CreditCard, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10' },
    { label: 'Total Transactions', value: stats?.total_transactions || 0, icon: Wallet, color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-500/10' },
    { label: 'Successful', value: stats?.successful_payments || 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10' },
    { label: 'Failed', value: stats?.failed_payments || 0, icon: XCircle, color: 'from-red-500 to-rose-500', bg: 'bg-red-500/10' },
  ];

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      SUCCESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[s] || 'bg-slate-500/10 text-slate-400'}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.first_name}!</h1>
          <p className="text-slate-400 mt-1">Here&apos;s an overview of your account</p>
        </div>
        <div className="flex gap-3">
          <Link to="/cards/add" className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-300/50 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
            <Plus className="w-4 h-4" /> Add Card
          </Link>
          <Link to="/payment" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r -white hover:from-indigo-600 hover:to-purple-700 transition-all">
            <Wallet className="w-4 h-4" /> Quick Pay
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-5 hover:border-slate-300/50 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 bg-gradient-to-r ${color} bg-clip-text text-transparent`} style={{ color: 'inherit' }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Total amount */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-indigo-400" />
          <div>
            <p className="text-sm text-slate-400">Total Successful Amount</p>
            <p className="text-3xl font-bold text-slate-900">₹{Number(stats?.total_success_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
          <Link to="/transactions" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {stats?.recent_transactions?.length ? (
          <div className="divide-y divide-slate-200">
            {stats.recent_transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-100/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${tx.status === 'SUCCESS' ? 'bg-emerald-400' : tx.status === 'FAILED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{tx.description || tx.transaction_reference}</p>
                    <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={statusBadge(tx.status)}>{tx.status}</span>
                  <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No transactions yet</p>
            <Link to="/payment" className="text-indigo-400 text-sm hover:underline mt-1 inline-block">Make your first payment</Link>
          </div>
        )}
      </div>
    </div>
  );
}
