import React, { useMemo } from 'react';
import {
  HardHat,
  Truck,
  TrendingUp,
  Layers,
  Fuel,
  Zap,
  Clock,
  Printer,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import type { ProductionRecord, DispatchRecord } from '../types';
import { computeMonthlySummaries, computeYearlySummary } from '../utils/storage';

interface DashboardProps {
  production: ProductionRecord[];
  dispatch: DispatchRecord[];
  onNavigate: (tab: 'production' | 'dispatch' | 'summaries' | 'print') => void;
  onAddProduction: () => void;
  onAddDispatch: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  production,
  dispatch,
  onNavigate,
  onAddProduction,
  onAddDispatch,
}) => {
  const monthlySummaries = useMemo(
    () => computeMonthlySummaries(production, dispatch),
    [production, dispatch]
  );
  const yearly = useMemo(
    () => computeYearlySummary(monthlySummaries, '2026-027'),
    [monthlySummaries]
  );

  // Totals
  const totalRom = yearly.totalRomFed;
  const totalProd = yearly.totalProduction;
  const totalDisp = yearly.totalDispatched;
  const totalRevenue = yearly.totalRevenue;
  const totalDiesel = yearly.totalDiesel;
  const totalPower = yearly.totalElectricity;

  // Aggregate breakdown across all production
  const p10 = production.reduce((acc, p) => acc + (p.aggregate10mm || 0), 0);
  const p20 = production.reduce((acc, p) => acc + (p.aggregate20mm || 0), 0);
  const p40 = production.reduce((acc, p) => acc + (p.aggregate40mm || 0), 0);
  const gsb = production.reduce((acc, p) => acc + (p.gsb || 0), 0);
  const dust = production.reduce((acc, p) => acc + (p.stoneDust || 0), 0);
  const ballast = production.reduce((acc, p) => acc + (p.ballast65mm || 0), 0);

  // Recent 4 production
  const recentProduction = useMemo(() => {
    return [...production].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [production]);

  // Recent 4 dispatches
  const recentDispatches = useMemo(() => {
    return [...dispatch].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Top Welcome / Status Hero Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/30 border border-zinc-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Report No. 2026-027
              </span>
              <span className="text-xs text-zinc-400">Mines &amp; Stone Crushing Operations &bull; Pushpendra</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              S.GOENKA LIME &amp; CHEMICALS LTD.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl">
              Registered Office: Station Road, Katni - 483501 &bull; Tel: +91 7470710385 &bull; sgoenkalime@gmail.com
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onAddProduction}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 transition shadow-sm"
            >
              + Crushing Entry
            </button>
            <button
              onClick={onAddDispatch}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 transition shadow-sm"
            >
              + Weighbridge Dispatch
            </button>
            <button
              onClick={() => onNavigate('print')}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
            >
              <Printer className="w-4 h-4 inline-block mr-1.5" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">ROM Fed</span>
            <HardHat className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {totalRom.toLocaleString()} <span className="text-xs font-sans text-zinc-400">MT</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Raw boulder crushed</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Output</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {totalProd.toLocaleString()} <span className="text-xs font-sans text-zinc-400">MT</span>
          </div>
          <p className="text-[10px] text-emerald-500 mt-1">Recovery: {yearly.avgRecoveryPercent}%</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Dispatches</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-blue-400">
            {totalDisp.toLocaleString()} <span className="text-xs font-sans text-zinc-400">MT</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Weighbridge net weight</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
            ₹ {totalRevenue.toLocaleString()}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">FY 2026-27 Invoiced</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Plant TPH</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400">{yearly.avgTph} TPH</div>
          <p className="text-[10px] text-zinc-400 mt-1">Avg crushing rate</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Yard Closing Stock</span>
            <Scale className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">
            {yearly.closingStockEstimate.toLocaleString()} <span className="text-xs font-sans text-zinc-400">MT</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Opening + Crushed - Dispatched</p>
        </div>
      </div>

      {/* Aggregate Product Distribution Strip */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Aggregates Sizing &amp; Production Mix (FY 2026-27)</h3>
            <p className="text-xs text-zinc-400">Total Crushed Material Output: {totalProd.toLocaleString()} MT</p>
          </div>
          <button
            onClick={() => onNavigate('summaries')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>Detailed Summaries</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block">20mm Concrete</span>
            <span className="text-lg font-bold font-mono text-amber-400">{p20.toLocaleString()} MT</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              {totalProd > 0 ? ((p20 / totalProd) * 100).toFixed(1) : 0}% of total
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block">10mm Fine Stone</span>
            <span className="text-lg font-bold font-mono text-blue-400">{p10.toLocaleString()} MT</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              {totalProd > 0 ? ((p10 / totalProd) * 100).toFixed(1) : 0}% of total
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block">40mm Road Base</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{p40.toLocaleString()} MT</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              {totalProd > 0 ? ((p40 / totalProd) * 100).toFixed(1) : 0}% of total
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block">GSB Sub-Base</span>
            <span className="text-lg font-bold font-mono text-purple-400">{gsb.toLocaleString()} MT</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              {totalProd > 0 ? ((gsb / totalProd) * 100).toFixed(1) : 0}% of total
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block">Stone Dust / M-Sand</span>
            <span className="text-lg font-bold font-mono text-cyan-400">{dust.toLocaleString()} MT</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              {totalProd > 0 ? ((dust / totalProd) * 100).toFixed(1) : 0}% of total
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block">Diesel Consumed</span>
            <span className="text-lg font-bold font-mono text-orange-400">{totalDiesel.toLocaleString()} L</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              {totalProd > 0 ? (totalDiesel / totalProd).toFixed(2) : 0} Ltr / MT
            </span>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Production Logs & Recent Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Crushing Entries */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Crushing Logs</h3>
            </div>
            <button
              onClick={() => onNavigate('production')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              View All ({production.length})
            </button>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {recentProduction.map((r) => (
              <div key={r.id} className="p-3.5 hover:bg-zinc-800/40 transition flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{r.date}</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                      {r.shift} Shift
                    </span>
                    <span className="text-zinc-400 font-medium">{r.supervisor}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Bench: {r.quarryBench} &bull; {r.operatingHours}h Run
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-emerald-400">{r.totalProduction.toLocaleString()} MT</div>
                  <div className="text-[10px] text-zinc-400">from {r.romFedTons.toLocaleString()} ROM ({r.recoveryPercent}%)</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Weighbridge Dispatches */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Weighbridge Dispatches</h3>
            </div>
            <button
              onClick={() => onNavigate('dispatch')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              View All ({dispatch.length})
            </button>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {recentDispatches.map((r) => (
              <div key={r.id} className="p-3.5 hover:bg-zinc-800/40 transition flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">{r.challanNo}</span>
                    <span className="font-mono text-amber-400 text-[11px]">{r.vehicleNo}</span>
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-300">
                      {r.material}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[200px]" title={r.customerName}>
                    {r.customerName}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-emerald-400">{r.netWeight.toFixed(2)} MT</div>
                  <div className="text-[10px] text-amber-400">₹ {r.totalAmount.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
