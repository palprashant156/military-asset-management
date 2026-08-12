import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import NetMoveModal from '../components/NetMoveModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, TrendingUp, Warehouse, Flame, Filter } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([
      api.get('/assets/bases'),
      api.get('/assets/equipment-types'),
    ]).then(([basesRes, eqRes]) => {
      setBases(basesRes.data.data);
      setEquipmentTypes(eqRes.data.data);
    });
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [selectedBase, selectedEquipment, startDate, endDate]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBase) params.baseId = selectedBase;
      if (selectedEquipment) params.equipmentTypeId = selectedEquipment;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/assets/dashboard', { params });
      setMetrics(res.data.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build chart data from equipment types
  const barData = equipmentTypes.map((eq) => ({
    name: eq.name.length > 15 ? eq.name.substring(0, 15) + '...' : eq.name,
    category: eq.category,
  }));

  const categoryData = equipmentTypes.reduce((acc, eq) => {
    const existing = acc.find((c) => c.name === eq.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: eq.category, value: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Inventory overview {user?.role === 'BASE_COMMANDER' && user?.baseName ? `for ${user.baseName}` : '— all bases'}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-military-800 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Base</label>
            <select
              value={selectedBase}
              onChange={(e) => setSelectedBase(e.target.value)}
              disabled={user?.role === 'BASE_COMMANDER'}
              className="w-full px-3 py-2 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
            >
              <option value="">All Bases</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Equipment Type</label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-3 py-2 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">All Types</option>
              {equipmentTypes.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-military-800 border border-slate-700/50 rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Opening Balance"
            value={metrics?.openingBalance || 0}
            icon={Warehouse}
            color="blue"
          />
          <StatCard
            label="Net Movement"
            value={metrics?.netMovement || 0}
            icon={TrendingUp}
            color="emerald"
            onClick={() => setShowModal(true)}
            subtitle="Click for breakdown"
          />
          <StatCard
            label="Closing Balance"
            value={metrics?.closingBalance || 0}
            icon={Package}
            color="purple"
          />
          <StatCard
            label="Total Expended"
            value={metrics?.expended || 0}
            icon={Flame}
            color="amber"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-military-800 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Equipment Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={5}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-military-800 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Period Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Purchases', value: metrics?.purchases || 0, color: 'text-blue-400', sign: '+' },
              { label: 'Transfers In', value: metrics?.transfersIn || 0, color: 'text-emerald-400', sign: '+' },
              { label: 'Transfers Out', value: metrics?.transfersOut || 0, color: 'text-red-400', sign: '-' },
              { label: 'Assigned', value: metrics?.assigned || 0, color: 'text-amber-400', sign: '-' },
              { label: 'Expended', value: metrics?.expended || 0, color: 'text-orange-400', sign: '-' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 px-3 bg-military-700/30 rounded-lg">
                <span className="text-sm text-slate-300">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>
                  {item.sign}{item.value.toLocaleString()}
                </span>
              </div>
            ))}
            <hr className="border-slate-700/50" />
            <div className="flex items-center justify-between py-2.5 px-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <span className="text-sm font-bold text-white">Closing Balance</span>
              <span className="text-lg font-bold text-emerald-400">
                {(metrics?.closingBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Movement Modal */}
      {showModal && <NetMoveModal metrics={metrics} onClose={() => setShowModal(false)} />}
    </div>
  );
}
