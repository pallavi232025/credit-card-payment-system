/**
 * Card management page - view, add, and delete saved cards.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cardAPI } from '../api';
import type { Card } from '../types';
import { CreditCard, Plus, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const brandColors: Record<string, string> = {
  VISA: 'from-blue-600 to-blue-800',
  MASTERCARD: 'from-red-600 to-orange-700',
  AMEX: 'from-emerald-600 to-teal-700',
  OTHER: 'from-slate-600 to-slate-800',
};

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/cards/add') setShowAddForm(true);
  }, [location]);

  const fetchCards = () => {
    setLoading(true);
    cardAPI.list().then(r => setCards(r.data.data)).catch(() => toast.error('Failed to load cards')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCards(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await cardAPI.delete(id);
      setCards(cards.filter(c => c.id !== id));
      toast.success('Card deleted');
    } catch { toast.error('Failed to delete card'); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Cards</h1>
          <p className="text-slate-400 mt-1">Manage your saved payment cards</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r -white hover:from-indigo-600 hover:to-purple-700 transition-all">
          <Plus className="w-4 h-4" /> Add Card
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-slate-100/50 rounded-2xl" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white/80 rounded-2xl border border-slate-200/50 p-16 text-center">
          <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No cards saved</h3>
          <p className="text-slate-400 mb-4">Add a card to start making payments</p>
          <button onClick={() => setShowAddForm(true)} className="px-6 py-2.5 bg-gradient-to-r -white font-medium">
            Add Your First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <div key={card.id} className={`relative bg-gradient-to-br ${brandColors[card.card_brand] || brandColors.OTHER} rounded-2xl p-6 h-48 flex flex-col justify-between overflow-hidden group`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-50" />
              <div className="relative flex justify-between items-start">
                <p className="text-sm font-semibold text-slate-900/80">{card.card_brand}</p>
                <p className="text-xs text-slate-900/60 uppercase">{card.card_type}</p>
              </div>
              <div className="relative">
                <p className="text-lg font-mono text-slate-900 tracking-[0.25em]">
                  •••• •••• •••• {card.last_four_digits}
                </p>
              </div>
              <div className="relative flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-900/50 uppercase">Card Holder</p>
                  <p className="text-sm font-medium text-slate-900">{card.card_holder_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-900/50 uppercase">Expires</p>
                  <p className="text-sm font-medium text-slate-900">{String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}</p>
                </div>
              </div>
              {/* Delete button */}
              <button onClick={() => setDeleteId(card.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-slate-900/60 hover:bg-red-500/30 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      {showAddForm && <AddCardModal onClose={() => setShowAddForm(false)} onSuccess={() => { setShowAddForm(false); fetchCards(); }} />}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-semibold text-slate-900">Delete Card?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">This action cannot be undone. The card will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 rounded-xl text-sm text-slate-900 bg-red-600 hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddCardModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ card_number: '', card_holder_name: '', expiry_month: '', expiry_year: '', cvv: '', card_type: 'CREDIT' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.card_number.replace(/\s/g, '')) newErrors.card_number = 'Required';
    if (!form.card_holder_name.trim()) newErrors.card_holder_name = 'Required';
    if (!form.expiry_month) newErrors.expiry_month = 'Required';
    if (!form.expiry_year) newErrors.expiry_year = 'Required';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      // CVV is NOT sent to the server - it's only for the frontend payment flow
      await cardAPI.add({
        card_number: form.card_number.replace(/\s/g, ''),
        card_holder_name: form.card_holder_name,
        expiry_month: parseInt(form.expiry_month),
        expiry_year: parseInt(form.expiry_year),
        card_type: form.card_type,
      });
      toast.success('Card added successfully!');
      onSuccess();
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors?.length) {
        const mapped: Record<string, string> = {};
        apiErrors.forEach((e: any) => { mapped[e.field] = e.message; });
        setErrors(mapped);
      }
      toast.error(err.response?.data?.message || 'Failed to add card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Add New Card</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Number</label>
            <input type="text" value={form.card_number} onChange={e => update('card_number', e.target.value)}
              className="w-full px-4 py-3 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
              placeholder="4111 1111 1111 1111" maxLength={19} />
            {errors.card_number && <p className="text-red-400 text-xs mt-1">{errors.card_number}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Holder Name</label>
            <input type="text" value={form.card_holder_name} onChange={e => update('card_holder_name', e.target.value)}
              className="w-full px-4 py-3 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="John Doe" />
            {errors.card_holder_name && <p className="text-red-400 text-xs mt-1">{errors.card_holder_name}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Month</label>
              <select value={form.expiry_month} onChange={e => update('expiry_month', e.target.value)}
                className="w-full px-3 py-3 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                <option value="">MM</option>
                {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>)}
              </select>
              {errors.expiry_month && <p className="text-red-400 text-xs mt-1">{errors.expiry_month}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Year</label>
              <select value={form.expiry_year} onChange={e => update('expiry_year', e.target.value)}
                className="w-full px-3 py-3 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                <option value="">YYYY</option>
                {[...Array(15)].map((_, i) => { const y = new Date().getFullYear() + i; return <option key={y} value={y}>{y}</option>; })}
              </select>
              {errors.expiry_year && <p className="text-red-400 text-xs mt-1">{errors.expiry_year}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">CVV</label>
              <input type="password" value={form.cvv} onChange={e => update('cvv', e.target.value)}
                className="w-full px-3 py-3 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="•••" maxLength={4} />
              <p className="text-slate-600 text-[10px] mt-1">Not stored</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Type</label>
            <div className="flex gap-3">
              {['CREDIT', 'DEBIT'].map(t => (
                <button key={t} type="button" onClick={() => update('card_type', t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.card_type === t ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-100/50 border-slate-300/50 text-slate-400 hover:text-slate-900'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r -white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save Card'}
          </button>
        </form>
      </div>
    </div>
  );
}
