/**
 * Transaction history page with filters, search, pagination, and status badges.
 */
import { useEffect, useState } from 'react';
import { transactionAPI } from '../api';
import type { Transaction, Pagination } from '../types';
import { Search, Filter, ChevronLeft, ChevronRight, History } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, page_size: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', from_date: '', to_date: '', min_amount: '', max_amount: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchTransactions = (page = 1) => {
    setLoading(true);
    const params: Record<string, string | number> = { page, page_size: 20 };
    if (filters.status) params.status = filters.status;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.min_amount) params.min_amount = filters.min_amount;
    if (filters.max_amount) params.max_amount = filters.max_amount;
    if (filters.search) params.search = filters.search;

    transactionAPI.list(params)
      .then(r => {
        setTransactions(r.data.data.transactions);
        setPagination(r.data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      SUCCESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[s] || ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-400 mt-1">View your payment history</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-300/50 rounded-xl text-sm text-slate-700 hover:bg-slate-200">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white/80 rounded-2xl border border-slate-200/50 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Search Reference</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="TXN-..." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
              <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                <option value="">All</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">From Date</label>
              <input type="date" value={filters.from_date} onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">To Date</label>
              <input type="date" value={filters.to_date} onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Min Amount</label>
              <input type="number" value={filters.min_amount} onChange={e => setFilters(f => ({ ...f, min_amount: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Amount</label>
              <input type="number" value={filters.max_amount} onChange={e => setFilters(f => ({ ...f, max_amount: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="999999" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => fetchTransactions(1)} className="px-4 py-2 bg-indigo-600 text-slate-900 rounded-xl text-sm font-medium hover:bg-indigo-700">Apply Filters</button>
            <button onClick={() => { setFilters({ status: '', from_date: '', to_date: '', min_amount: '', max_amount: '', search: '' }); fetchTransactions(1); }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm hover:bg-slate-200">Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100/50 rounded-lg" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-900 font-medium">No transactions found</p>
            <p className="text-slate-400 text-sm mt-1">Adjust your filters or make a payment</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Reference</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Card</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-100/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-indigo-400">{tx.transaction_reference}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-semibold">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{tx.card_brand ? `${tx.card_brand} ****${tx.card_last_four}` : '-'}</td>
                      <td className="px-6 py-4"><span className={statusBadge(tx.status)}>{tx.status}</span></td>
                      <td className="px-6 py-4 text-sm text-slate-400 max-w-[200px] truncate">{tx.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50">
                <p className="text-sm text-slate-400">Showing {((pagination.page - 1) * pagination.page_size) + 1}-{Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total}</p>
                <div className="flex gap-2">
                  <button onClick={() => fetchTransactions(pagination.page - 1)} disabled={pagination.page <= 1}
                    className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => fetchTransactions(pagination.page + 1)} disabled={pagination.page >= pagination.total_pages}
                    className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
