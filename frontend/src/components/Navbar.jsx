import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  const roleBadgeColors = {
    ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    BASE_COMMANDER: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    LOGISTICS_OFFICER: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };

  const roleLabels = {
    ADMIN: 'Admin',
    BASE_COMMANDER: 'Base Commander',
    LOGISTICS_OFFICER: 'Logistics Officer',
  };

  return (
    <nav className="bg-military-800 border-b border-slate-700/50 px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">MilAsset</h1>
          <p className="text-[10px] text-slate-400 -mt-0.5 uppercase tracking-widest">Asset Management</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${roleBadgeColors[user?.role] || ''}`}>
            {roleLabels[user?.role] || user?.role}
          </div>
          {user?.baseName && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              📍 {user.baseName}
            </span>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{user?.username}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-red-500/20 border border-slate-600/50 hover:border-red-500/30 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}
