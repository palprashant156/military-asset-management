import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ClipboardList, Flame, Plus } from 'lucide-react';

export default function Assignments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [assignForm, setAssignForm] = useState({ baseId: '', equipmentTypeId: '', quantity: '', assignedTo: '', date: '' });
  const [expendForm, setExpendForm] = useState({ baseId: '', equipmentTypeId: '', quantity: '', description: '', date: '' });

  useEffect(() => {
    Promise.all([
      api.get('/assets/bases'),
      api.get('/assets/equipment-types'),
    ]).then(([basesRes, eqRes]) => {
      setBases(basesRes.data.data);
      setEquipmentTypes(eqRes.data.data);
    });
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, eRes] = await Promise.all([
        api.get('/assignments', { params: { limit: 20 } }),
        api.get('/expenditures', { params: { limit: 20 } }),
      ]);
      setAssignments(aRes.data.data);
      setExpenditures(eRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/assignments', {
        baseId: Number(assignForm.baseId),
        equipmentTypeId: Number(assignForm.equipmentTypeId),
        quantity: Number(assignForm.quantity),
        assignedTo: assignForm.assignedTo,
        date: assignForm.date || undefined,
      });
      toast.success('Assignment created');
      setAssignForm({ baseId: '', equipmentTypeId: '', quantity: '', assignedTo: '', date: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenditure = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/expenditures', {
        baseId: Number(expendForm.baseId),
        equipmentTypeId: Number(expendForm.equipmentTypeId),
        quantity: Number(expendForm.quantity),
        description: expendForm.description,
        date: expendForm.date || undefined,
      });
      toast.success('Expenditure recorded');
      setExpendForm({ baseId: '', equipmentTypeId: '', quantity: '', description: '', date: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record expenditure');
    } finally {
      setSubmitting(false);
    }
  };

  const availableBases = user?.role === 'BASE_COMMANDER'
    ? bases.filter((b) => b.id === user.baseId)
    : bases;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Assignments & Expenditures</h1>
        <p className="text-sm text-slate-400 mt-1">Track personnel allocations and consumed assets</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-military-800 p-1 rounded-lg border border-slate-700/50 w-fit">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'assignments'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('expenditures')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'expenditures'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Flame className="w-4 h-4" />
          Expenditures
        </button>
      </div>

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <>
          <div className="bg-military-800 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">New Assignment</h3>
            </div>
            <form onSubmit={handleAssignment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <select value={assignForm.baseId} onChange={(e) => setAssignForm({ ...assignForm, baseId: e.target.value })} className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required>
                <option value="">Select Base</option>
                {availableBases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={assignForm.equipmentTypeId} onChange={(e) => setAssignForm({ ...assignForm, equipmentTypeId: e.target.value })} className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required>
                <option value="">Select Equipment</option>
                {equipmentTypes.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
              <input type="number" value={assignForm.quantity} onChange={(e) => setAssignForm({ ...assignForm, quantity: e.target.value })} placeholder="Qty" min="1" className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required />
              <input type="text" value={assignForm.assignedTo} onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })} placeholder="Assigned To (Name)" className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required />
              <input type="date" value={assignForm.date} onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })} className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {submitting ? 'Saving...' : 'Assign'}
              </button>
            </form>
          </div>

          <div className="bg-military-800 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Base</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Equipment</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Qty</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">No assignments found</td></tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a.id} className="border-b border-slate-700/30 hover:bg-military-700/30 transition-colors">
                        <td className="px-5 py-3 text-slate-300">{new Date(a.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-white font-medium">{a.base?.name}</td>
                        <td className="px-5 py-3 text-slate-300">{a.equipmentType?.name}</td>
                        <td className="px-5 py-3 text-right font-semibold text-amber-400">-{a.quantity.toLocaleString()}</td>
                        <td className="px-5 py-3 text-slate-300">{a.assignedTo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Expenditures Tab */}
      {activeTab === 'expenditures' && (
        <>
          <div className="bg-military-800 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Record Expenditure</h3>
            </div>
            <form onSubmit={handleExpenditure} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <select value={expendForm.baseId} onChange={(e) => setExpendForm({ ...expendForm, baseId: e.target.value })} className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required>
                <option value="">Select Base</option>
                {availableBases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={expendForm.equipmentTypeId} onChange={(e) => setExpendForm({ ...expendForm, equipmentTypeId: e.target.value })} className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required>
                <option value="">Select Equipment</option>
                {equipmentTypes.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
              <input type="number" value={expendForm.quantity} onChange={(e) => setExpendForm({ ...expendForm, quantity: e.target.value })} placeholder="Qty" min="1" className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required />
              <input type="text" value={expendForm.description} onChange={(e) => setExpendForm({ ...expendForm, description: e.target.value })} placeholder="Description / Reason" className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" required />
              <input type="date" value={expendForm.date} onChange={(e) => setExpendForm({ ...expendForm, date: e.target.value })} className="px-3 py-2.5 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {submitting ? 'Saving...' : 'Record'}
              </button>
            </form>
          </div>

          <div className="bg-military-800 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Base</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Equipment</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Qty</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : expenditures.length === 0 ? (
                    <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">No expenditures found</td></tr>
                  ) : (
                    expenditures.map((e) => (
                      <tr key={e.id} className="border-b border-slate-700/30 hover:bg-military-700/30 transition-colors">
                        <td className="px-5 py-3 text-slate-300">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-white font-medium">{e.base?.name}</td>
                        <td className="px-5 py-3 text-slate-300">{e.equipmentType?.name}</td>
                        <td className="px-5 py-3 text-right font-semibold text-red-400">-{e.quantity.toLocaleString()}</td>
                        <td className="px-5 py-3 text-slate-400">{e.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
