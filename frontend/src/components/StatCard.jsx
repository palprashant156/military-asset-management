export default function StatCard({ label, value, icon: Icon, color, onClick, subtitle }) {
  const colorClasses = {
    blue: 'border-l-blue-500 bg-blue-500/5',
    emerald: 'border-l-emerald-500 bg-emerald-500/5',
    purple: 'border-l-purple-500 bg-purple-500/5',
    amber: 'border-l-amber-500 bg-amber-500/5',
    red: 'border-l-red-500 bg-red-500/5',
  };

  const textColors = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-military-800 border border-slate-700/50 border-l-4 ${colorClasses[color] || colorClasses.blue} rounded-xl p-5 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {Icon && <Icon className={`w-5 h-5 ${textColors[color] || 'text-slate-400'}`} />}
      </div>
      <p className={`text-3xl font-bold ${textColors[color] || 'text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
