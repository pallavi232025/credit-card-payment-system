/**
 * Admin Cards page - view all saved cards (masked only).
 */
import { useEffect, useState } from 'react';
import { adminAPI } from '../../api';
import type { Card, Pagination } from '../../types';
import { Search, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';

export default function AdminCardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, page_size: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCards = (page = 1) => {
    setLoading(true);
    const params: Record<string, string | number> = { page, page_size: 20 };
    if (search) params.search = search;
    adminAPI.getCards(params)
      .then(r => { setCards(r.data.data.cards); setPagination(r.data.data.pagination); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCards(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Cards</h1>
        <p className="text-slate-400 mt-1">View saved cards across all users (masked data only)</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchCards(1)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Search by name, last 4 digits, or email..." />
        </div>
        <button onClick={() => fetchCards(1)} className="px-4 py-2.5 bg-indigo-600 text-slate-900 rounded-xl text-sm font-medium hover:bg-indigo-700">Search</button>
      </div>

      <div className="bg-white/80 rounded-2xl border border-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100/50 rounded-lg" />)}</div>
        ) : cards.length === 0 ? (
          <div className="p-16 text-center"><CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-900 font-medium">No cards found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Card Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Holder</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Brand</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Expires</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {cards.map(c => (
                  <tr key={c.id} className="hover:bg-slate-100/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-indigo-400">{c.user_email}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-mono">{c.masked_card_number}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{c.card_holder_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{c.card_brand}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{c.card_type}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{String(c.expiry_month).padStart(2, '0')}/{c.expiry_year}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
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
              <button onClick={() => fetchCards(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => fetchCards(pagination.page + 1)} disabled={pagination.page >= pagination.total_pages} className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
