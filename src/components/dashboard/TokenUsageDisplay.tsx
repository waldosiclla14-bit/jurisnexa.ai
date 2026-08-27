'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';

interface TokenUsage {
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  created_at: string;
}

interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  requests: number;
}

export function TokenUsageDisplay() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<TokenUsage[]>([]);
  const [totals, setTotals] = useState<UsageTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchUsage();
  }, [period]);

  const fetchUsage = async () => {
    try {
      const res = await fetch(`/api/user?action=usage&days=${period}`);
      const data = await res.json();
      setUsage(data.usage || []);
      setTotals(data.totals);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const queriesRemaining = user.queries_limit - user.queries_used;
  const usagePercent = (user.queries_used / user.queries_limit) * 100;

  return (
    <div className="space-y-6">
      {/* Query usage */}
      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 className="text-sm font-medium text-white mb-3">Uso del plan</h3>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-400">Consultas este mes</span>
          <span className="text-white">{user.queries_used} / {user.queries_limit}</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent > 90 ? 'bg-red-500' :
              usagePercent > 70 ? 'bg-yellow-500' :
              'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          {queriesRemaining > 0
            ? `Te quedan ${queriesRemaining} consultas`
            : 'Has alcanzado el límite de tu plan'}
        </p>
        {(usagePercent > 80 || queriesRemaining <= 2) && (
          <a
            href="/precios"
            className="mt-3 block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
          >
            Mejorar plan
          </a>
        )}
      </div>

      {/* Token usage */}
      {totals && (
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Consumo de tokens</h3>
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
            >
              <option value={7}>7 días</option>
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-400">Entrada</p>
              <p className="text-white font-medium">{totals.inputTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-zinc-400">Salida</p>
              <p className="text-white font-medium">{totals.outputTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-zinc-400">Consultas</p>
              <p className="text-white font-medium">{totals.requests}</p>
            </div>
            <div>
              <p className="text-zinc-400">Costo</p>
              <p className="text-white font-medium">${totals.totalCost.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Plan info */}
      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 className="text-sm font-medium text-white mb-3">Tu plan</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Plan actual</span>
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              user.plan === 'pro' ? 'bg-emerald-600 text-white' :
              user.plan === 'professional' ? 'bg-blue-600 text-white' :
              'bg-zinc-700 text-zinc-300'
            }`}>
              {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">País seleccionado</span>
            <span className="text-white text-xs">Perú / Chile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
