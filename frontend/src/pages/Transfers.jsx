import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeftRight, Plus } from 'lucide-react';

const statusColors = {
  PENDING: 'bg-amber-500/20 text-amber-300',
  IN_TRANSIT: 'bg-blue-500/20 text-blue-300',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300',
};

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [form, setForm] = useState({ sourceBaseId: '', destinationBaseId: '', equipmentTypeId: '', quantity: '' });

  useEffect(() => {
    Promise.all([
      api.get('/assets/bases'),
      api.get('/assets/equipment-types'),
    ]).then(([basesRes, eqRes]) => {
      setBases(basesRes.data.data);
      setEquipmentTypes(eqRes.data.data);
    });
    fetchTransfers();
  }, []);

  const fetchTransfers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/transfers', { params: { page, limit: 10 } });
      setTransfers(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.sourceBaseId === form.destinationBaseId) {
      toast.error('Source and destination cannot be the same');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/transfers', {
        sourceBaseId: Number(form.sourceBaseId),
        destinationBaseId: Number(form.destinationBaseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
      });
      toast.success('Transfer completed successfully');
      setForm({ sourceBaseId: '', destinationBaseId: '', equipmentTypeId: '', quantity: '' });
      fetchTransfers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Transfers</h1>
        <p className="text-sm text-slate-400 mt-1">Manage cross-base asset movements</p>
      </div>

      {/* Transfer Form */}
      <div className="bg-military-800 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Initiate Transfer</h3>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={form.sourceBaseId}
            onChange={(e) => setForm({ ...form, sourceBaseId: e.target.value })}
            className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            required
          >
            <option value="">Source Base</option>
            {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <select
            value={form.destinationBaseId}
            onChange={(e) => setForm({ ...form, destinationBaseId: e.target.value })}
            className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            required
          >
            <option value="">Destination Base</option>
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

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            {submitting ? 'Processing...' : 'Transfer'}
          </button>
        </form>
      </div>

      {/* Transfers Table */}
      <div className="bg-military-800 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">From</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">To</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Equipment</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : transfers.length === 0 ? (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-slate-500">No transfers found</td></tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="border-b border-slate-700/30 hover:bg-military-700/30 transition-colors">
                    <td className="px-5 py-3 text-slate-300">{new Date(t.timestamp).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-red-300 font-medium">{t.sourceBase?.name}</td>
                    <td className="px-5 py-3 text-emerald-300 font-medium">{t.destinationBase?.name}</td>
                    <td className="px-5 py-3 text-slate-300">{t.equipmentType?.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-white">{t.quantity.toLocaleString()}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[t.status] || ''}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{t.initiator?.username}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => fetchTransfers(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1 text-xs bg-military-700 rounded disabled:opacity-30 text-slate-300 hover:bg-military-600 transition-colors">Previous</button>
              <button onClick={() => fetchTransfers(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1 text-xs bg-military-700 rounded disabled:opacity-30 text-slate-300 hover:bg-military-600 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
