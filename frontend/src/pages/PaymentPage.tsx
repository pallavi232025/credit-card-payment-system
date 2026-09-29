/**
 * Payment page - select card, enter amount, process payment.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { cardAPI, paymentAPI } from '../api';
import type { Card, PaymentResponse } from '../types';
import { Wallet, Loader2, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from '../utils/uuid';

export default function PaymentPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<PaymentResponse | null>(null);
  const [form, setForm] = useState({ card_id: '', amount: '', currency: 'INR', description: '' });

  useEffect(() => {
    cardAPI.list().then(r => setCards(r.data.data)).catch(() => toast.error('Failed to load cards')).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.card_id || !form.amount) { toast.error('Please fill all required fields'); return; }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > 999999.99) { toast.error('Amount exceeds maximum limit'); return; }

    setProcessing(true);
    setResult(null);

    try {
      const idempotencyKey = uuidv4();
      const res = await paymentAPI.process({
        card_id: parseInt(form.card_id),
        amount,
        currency: form.currency,
        description: form.description,
      }, idempotencyKey);

      setResult(res.data.data as PaymentResponse);
      if (res.data.data?.status === 'SUCCESS') {
        toast.success('Payment successful!');
      } else {
        toast.error(res.data.data?.failure_reason || 'Payment failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const selectedCard = cards.find(c => c.id === parseInt(form.card_id));

  if (result) {
    const isSuccess = result.status === 'SUCCESS';
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-8 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {isSuccess ? <CheckCircle2 className="w-10 h-10 text-emerald-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment {isSuccess ? 'Successful' : 'Failed'}</h2>
          <p className="text-slate-400 mb-6">{result.message}</p>
          {result.failure_reason && <p className="text-red-400 text-sm mb-4">Reason: {result.failure_reason}</p>}

          <div className="bg-slate-100/50 rounded-xl p-4 text-left space-y-3 mb-6">
            <div className="flex justify-between"><span className="text-slate-400 text-sm">Reference</span><span className="text-slate-900 text-sm font-mono">{result.transaction_reference}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 text-sm">Amount</span><span className="text-slate-900 text-sm font-semibold">₹{Number(result.amount).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 text-sm">Currency</span><span className="text-slate-900 text-sm">{result.currency}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 text-sm">Status</span>
              <span className={`text-sm font-medium ${isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>{result.status}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => { setResult(null); setForm({ card_id: '', amount: '', currency: 'INR', description: '' }); }}
              className="px-6 py-2.5 bg-slate-100 border border-slate-300/50 rounded-xl text-sm text-slate-700 hover:bg-slate-200 transition-colors">
              New Payment
            </button>
            <Link to="/transactions" className="px-6 py-2.5 bg-gradient-to-r -white font-medium">
              View Transactions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Make Payment</h1>
        <p className="text-slate-400 mt-1">Process a secure payment using your saved card</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white/80 rounded-2xl border border-slate-200/50 p-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-900 font-medium mb-2">No cards available</p>
          <p className="text-slate-400 text-sm mb-4">Add a card before making a payment</p>
          <Link to="/cards/add" className="px-6 py-2.5 bg-gradient-to-r -white font-medium inline-block">
            Add Card
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Card</label>
            <select value={form.card_id} onChange={e => setForm(f => ({ ...f, card_id: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
              <option value="">Choose a card...</option>
              {cards.map(c => (
                <option key={c.id} value={c.id}>{c.card_brand} •••• {c.last_four_digits} ({c.card_holder_name})</option>
              ))}
            </select>
          </div>

          {selectedCard && (
            <div className={`bg-gradient-to-br ${selectedCard.card_brand === 'VISA' ? 'from-blue-600/20 to-blue-800/20' : selectedCard.card_brand === 'MASTERCARD' ? 'from-red-600/20 to-orange-700/20' : 'from-emerald-600/20 to-teal-700/20'} rounded-xl p-4 border border-white/5`}>
              <p className="text-xs text-slate-400">{selectedCard.card_brand} • {selectedCard.card_type}</p>
              <p className="text-slate-900 font-mono mt-1">•••• •••• •••• {selectedCard.last_four_digits}</p>
              <p className="text-slate-400 text-xs mt-1">{selectedCard.card_holder_name} • Exp {String(selectedCard.expiry_month).padStart(2, '0')}/{selectedCard.expiry_year}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full pl-8 pr-4 py-3 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-100/50 border border-slate-300/50 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="What's this payment for?" maxLength={255} />
          </div>

          {/* Payment summary */}
          {form.card_id && form.amount && (
            <div className="bg-slate-100/30 rounded-xl p-4 space-y-2 border border-slate-300/30">
              <p className="text-xs font-semibold text-slate-400 uppercase">Payment Summary</p>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Card</span><span className="text-slate-900">•••• {selectedCard?.last_four_digits}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Amount</span><span className="text-slate-900 font-semibold">₹{Number(form.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Currency</span><span className="text-slate-900">{form.currency}</span></div>
            </div>
          )}

          <button type="submit" disabled={processing || !form.card_id || !form.amount}
            className="w-full py-3 px-4 bg-gradient-to-r -white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Wallet className="w-5 h-5" /> Pay Now</>}
          </button>
        </form>
      )}
    </div>
  );
}
