import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, ShoppingCart } from 'lucide-react';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Form state
  const [form, setForm] = useState({ baseId: '', equipmentTypeId: '', quantity: '', date: '' });

  useEffect(() => {
    Promise.all([
      api.get('/assets/bases'),
      api.get('/assets/equipment-types'),
    ]).then(([basesRes, eqRes]) => {
      setBases(basesRes.data.data);
      setEquipmentTypes(eqRes.data.data);
    });
    fetchPurchases();
  }, []);

  const fetchPurchases = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/purchases', { params: { page, limit: 10 } });
      setPurchases(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/purchases', {
        baseId: Number(form.baseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
        date: form.date || undefined,
      });
      toast.success('Purchase created successfully');
      setForm({ baseId: '', equipmentTypeId: '', quantity: '', date: '' });
      fetchPurchases();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create purchase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Purchases</h1>
        <p className="text-sm text-slate-400 mt-1">Log incoming asset acquisitions</p>
      </div>

      {/* New Purchase Form */}
      <div className="bg-military-800 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">New Purchase</h3>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={form.baseId}
            onChange={(e) => setForm({ ...form, baseId: e.target.value })}
            className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            required
          >
            <option value="">Select Base</option>
            {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <select
            value={form.equipmentTypeId}
            onChange={(e) => setForm({ ...form, equipmentTypeId: e.target.value })}
            className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            required
          >
            <option value="">Select Equipment</option>
            {equipmentTypes.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
          </select>

          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Quantity"
            min="1"
            className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            required
          />

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Add Purchase'}
          </button>
        </form>
      </div>

      {/* Purchases Table */}
      <div className="bg-military-800 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Base</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Equipment</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">No purchases found</td></tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="border-b border-slate-700/30 hover:bg-military-700/30 transition-colors">
                    <td className="px-5 py-3 text-slate-300">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-white font-medium">{p.base?.name}</td>
                    <td className="px-5 py-3 text-slate-300">{p.equipmentType?.name}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.equipmentType?.category === 'WEAPON' ? 'bg-red-500/20 text-red-300' :
                        p.equipmentType?.category === 'VEHICLE' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {p.equipmentType?.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-400">+{p.quantity.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPurchases(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-xs bg-military-700 rounded disabled:opacity-30 text-slate-300 hover:bg-military-600 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchPurchases(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-xs bg-military-700 rounded disabled:opacity-30 text-slate-300 hover:bg-military-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
