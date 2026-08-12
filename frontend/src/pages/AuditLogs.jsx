import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ScrollText, Filter } from 'lucide-react';

const actionColors = {
  PURCHASE: 'bg-blue-500/20 text-blue-300',
  TRANSFER: 'bg-emerald-500/20 text-emerald-300',
  ASSIGNMENT: 'bg-amber-500/20 text-amber-300',
  EXPENDITURE: 'bg-red-500/20 text-red-300',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterAction) params.action = filterAction;
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Complete history of all system mutations</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-military-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="">All Actions</option>
            <option value="PURCHASE">Purchases</option>
            <option value="TRANSFER">Transfers</option>
            <option value="ASSIGNMENT">Assignments</option>
            <option value="EXPENDITURE">Expenditures</option>
          </select>
        </div>
      </div>

      <div className="bg-military-800 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500">No audit logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-700/30 hover:bg-military-700/30 transition-colors">
                    <td className="px-5 py-3 text-slate-400 text-xs font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{log.user?.username}</span>
                        <span className="text-xs text-slate-500">({log.user?.role})</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || ''}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-300 max-w-md truncate">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex gap-2">
              <button onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1 text-xs bg-military-700 rounded disabled:opacity-30 text-slate-300 hover:bg-military-600 transition-colors">Previous</button>
              <button onClick={() => fetchLogs(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1 text-xs bg-military-700 rounded disabled:opacity-30 text-slate-300 hover:bg-military-600 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
