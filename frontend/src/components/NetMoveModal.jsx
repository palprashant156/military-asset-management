import { X, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';

export default function NetMoveModal({ metrics, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-military-800 border border-slate-700/50 rounded-2xl max-w-md w-full mx-4 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-white">Net Movement Breakdown</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300">Purchases</span>
            </div>
            <span className="text-sm font-semibold text-blue-400">
              +{(metrics?.purchases || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">Transfers In</span>
            </div>
            <span className="text-sm font-semibold text-emerald-400">
              +{(metrics?.transfersIn || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-slate-300">Transfers Out</span>
            </div>
            <span className="text-sm font-semibold text-red-400">
              -{(metrics?.transfersOut || 0).toLocaleString()}
            </span>
          </div>

          <hr className="border-slate-700/50" />

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-bold text-white">Total Net Movement</span>
            <span className={`text-lg font-bold ${(metrics?.netMovement || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(metrics?.netMovement || 0) >= 0 ? '+' : ''}{(metrics?.netMovement || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
