import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  ClipboardList,
  ScrollText,
} from 'lucide-react';

const allLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/purchases', label: 'Purchases', icon: ShoppingCart, roles: ['ADMIN', 'LOGISTICS_OFFICER'] },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'LOGISTICS_OFFICER'] },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList, roles: ['ADMIN', 'BASE_COMMANDER'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user } = useAuth();

  const visibleLinks = allLinks.filter((link) => link.roles.includes(user?.role));

  return (
    <aside className="w-56 bg-military-800 border-r border-slate-700/50 min-h-[calc(100vh-57px)] py-4 px-3 flex flex-col">
      <div className="mb-4 px-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Navigation</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
              }`
            }
          >
            <link.icon className="w-4.5 h-4.5 shrink-0 group-hover:scale-110 transition-transform" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-700/50 px-3">
        <p className="text-[10px] text-slate-600 text-center">v1.0.0 • Military Asset Mgmt</p>
      </div>
    </aside>
  );
}
