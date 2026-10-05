import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Layers,
  TrendingUp,
  BarChart3,
  HardHat,
  Truck,
  Fuel,
  Zap,
  Printer,
  Download,
  CloudUpload,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ProductionRecord, DispatchRecord, MonthlySummaryData } from '../types';
import { computeMonthlySummaries, computeYearlySummary } from '../utils/storage';

interface MonthlyYearlySummaryProps {
  production: ProductionRecord[];
  dispatch: DispatchRecord[];
  onOpenPrint: (mode: 'monthly' | 'yearly', monthKey?: string) => void;
  onExportToDrive: (reportName: string, content: string) => void;
}

export const MonthlyYearlySummary: React.FC<MonthlyYearlySummaryProps> = ({
  production,
  dispatch,
  onOpenPrint,
  onExportToDrive,
}) => {
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');

  const monthlySummaries = useMemo(
    () => computeMonthlySummaries(production, dispatch),
    [production, dispatch]
  );

  const yearlySummary = useMemo(
    () => computeYearlySummary(monthlySummaries, '2026-027'),
    [monthlySummaries]
  );

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    return monthlySummaries.length > 0 ? monthlySummaries[monthlySummaries.length - 1].monthKey : '2026-04';
  });

  const currentMonthData = useMemo(() => {
    return monthlySummaries.find((m) => m.monthKey === selectedMonthKey) || monthlySummaries[0];
  }, [monthlySummaries, selectedMonthKey]);

  // Production breakdown for selected month
  const totalMonthProd = currentMonthData?.totalProduction || 1;
  const p10Pct = Number(((currentMonthData?.prod10mm || 0) / totalMonthProd * 100).toFixed(1));
  const p20Pct = Number(((currentMonthData?.prod20mm || 0) / totalMonthProd * 100).toFixed(1));
  const p40Pct = Number(((currentMonthData?.prod40mm || 0) / totalMonthProd * 100).toFixed(1));
  const gsbPct = Number(((currentMonthData?.prodGsb || 0) / totalMonthProd * 100).toFixed(1));
  const dustPct = Number(((currentMonthData?.prodDust || 0) / totalMonthProd * 100).toFixed(1));
  const ballastPct = Number(((currentMonthData?.prodBallast || 0) / totalMonthProd * 100).toFixed(1));

  // Export summary to Excel
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Monthly summaries
    const monthRows = monthlySummaries.map((m) => ({
      Month: m.monthName,
      'Operating Days': m.operatingDays,
      'ROM Fed (MT)': m.totalRomFed,
      'Crushed Output (MT)': m.totalProduction,
      'Dispatched (MT)': m.totalDispatched,
      'Revenue (INR)': m.dispatchAmount,
      'Operating Hours': m.totalOperatingHours,
      'Breakdown Hours': m.totalBreakdownHours,
      'Plant TPH': m.avgTph,
      'Diesel (Litres)': m.totalDiesel,
      'Diesel/Ton': m.dieselPerTon,
      'Power (kWh)': m.totalPowerKwh,
      'Power/Ton': m.powerPerTon,
    }));
    const monthSheet = XLSX.utils.json_to_sheet(monthRows);
    XLSX.utils.book_append_sheet(workbook, monthSheet, 'Monthly_Summaries');

    // Sheet 2: Product Breakdown
    const prodRows = monthlySummaries.map((m) => ({
      Month: m.monthName,
      '10mm (MT)': m.prod10mm,
      '20mm (MT)': m.prod20mm,
      '40mm (MT)': m.prod40mm,
      'GSB (MT)': m.prodGsb,
      'Stone Dust (MT)': m.prodDust,
      '65mm Ballast (MT)': m.prodBallast,
      'Total Production (MT)': m.totalProduction,
    }));
    const prodSheet = XLSX.utils.json_to_sheet(prodRows);
    XLSX.utils.book_append_sheet(workbook, prodSheet, 'Product_Yields');

    XLSX.writeFile(workbook, `S_Goenka_Lime_Report_2026-027_Summary.xlsx`);
  };

  const handleDriveUpload = () => {
    if (reportType === 'monthly') {
      const csv = [
        'Month,Operating Days,ROM Fed (MT),Crushed Production (MT),Dispatched (MT),Revenue (INR),Plant TPH,Diesel (Ltr),Power (kWh)',
        `${currentMonthData?.monthName},${currentMonthData?.operatingDays},${currentMonthData?.totalRomFed},${currentMonthData?.totalProduction},${currentMonthData?.totalDispatched},${currentMonthData?.dispatchAmount},${currentMonthData?.avgTph},${currentMonthData?.totalDiesel},${currentMonthData?.totalPowerKwh}`,
      ].join('\n');
      onExportToDrive(`S_Goenka_Lime_Report_2026-027_${currentMonthData?.monthKey}_Summary.csv`, csv);
    } else {
      const csv = [
        'Fiscal Year,Total ROM Fed (MT),Total Crushed (MT),Total Dispatched (MT),Total Revenue (INR),Avg TPH,Diesel (L),Closing Stock (MT)',
        `${yearlySummary.fiscalYear},${yearlySummary.totalRomFed},${yearlySummary.totalProduction},${yearlySummary.totalDispatched},${yearlySummary.totalRevenue},${yearlySummary.avgTph},${yearlySummary.totalDiesel},${yearlySummary.closingStockEstimate}`,
      ].join('\n');
      onExportToDrive(`S_Goenka_Lime_Report_2026-027_Yearly_Audit_Summary.csv`, csv);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controller: Toggle Monthly / Yearly & Quick Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
              reportType === 'monthly'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly Report Breakdown
          </button>
          <button
            onClick={() => setReportType('yearly')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
              reportType === 'yearly'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Yearly Audit Summary (2026-027)
          </button>
        </div>

        {reportType === 'monthly' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Select Month:</span>
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs sm:text-sm rounded-xl px-3 py-1.5 font-medium focus:border-amber-500"
            >
              {monthlySummaries.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.monthName} ({m.totalProduction.toLocaleString()} MT)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
            title="Download formatted Excel workbook"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel Workbook</span>
          </button>

          <button
            onClick={handleDriveUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-600/40 text-blue-200 transition"
            title="Save summary file to Google Drive"
          >
            <CloudUpload className="w-3.5 h-3.5 text-blue-400" />
            <span>Save to Drive</span>
          </button>

          <button
            onClick={() => onOpenPrint(reportType, selectedMonthKey)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {reportType === 'monthly' && currentMonthData && (
        <div className="space-y-6">
          {/* Monthly KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">ROM Boulder Fed</span>
                <HardHat className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {currentMonthData.totalRomFed.toLocaleString()} <span className="text-xs font-sans text-zinc-400">MT</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Over {currentMonthData.operatingDays} operating days ({currentMonthData.totalOperatingHours} running hrs)
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Crushed Output</span>
                <Layers className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {currentMonthData.totalProduction.toLocaleString()} <span className="text-xs font-sans text-zinc-400">MT</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-1">
                Avg Crushing Rate: <strong>{currentMonthData.avgTph} TPH</strong>
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Outward Dispatched</span>
                <Truck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-400">
                {currentMonthData.totalDispatched.toLocaleString()} <span className="text-xs font-sans text-zinc-400">MT</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Invoiced: <strong className="text-amber-400">₹ {currentMonthData.dispatchAmount.toLocaleString()}</strong>
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Energy &amp; Fuel</span>
                <Fuel className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-300">
                {currentMonthData.totalDiesel.toLocaleString()} <span className="text-xs font-sans text-zinc-400">Ltr</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Fuel: <strong>{currentMonthData.dieselPerTon} L/MT</strong> | Power: <strong>{currentMonthData.powerPerTon} kWh/MT</strong>
              </p>
            </div>
          </div>

          {/* Product Yield Breakdown Bars */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {currentMonthData.monthName} — Crushed Product Yield Distribution
                </h3>
                <p className="text-xs text-zinc-400">
                  Total Aggregate Yield: {currentMonthData.totalProduction.toLocaleString()} MT
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                Supervisor: Pushpendra
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-zinc-200">20mm Aggregate (Standard Concrete)</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {currentMonthData.prod20mm.toLocaleString()} MT ({p20Pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${p20Pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-zinc-200">10mm Aggregate (Fine Gitti)</span>
                    <span className="text-blue-400 font-mono font-bold">
                      {currentMonthData.prod10mm.toLocaleString()} MT ({p10Pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${p10Pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-zinc-200">40mm Aggregate (Road Base / Subgrade)</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {currentMonthData.prod40mm.toLocaleString()} MT ({p40Pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${p40Pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-zinc-200">GSB (Granular Sub Base Highway)</span>
                    <span className="text-purple-400 font-mono font-bold">
                      {currentMonthData.prodGsb.toLocaleString()} MT ({gsbPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${gsbPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-zinc-200">Stone Dust / Manufactured Sand</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {currentMonthData.prodDust.toLocaleString()} MT ({dustPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full transition-all" style={{ width: `${dustPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Stock Movement Summary for Month */}
              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                    Monthly Stock &amp; Inventory Balance
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-zinc-850">
                      <span className="text-zinc-400">Total Crushed Added to Yard:</span>
                      <span className="text-emerald-400 font-bold">+{currentMonthData.totalProduction.toLocaleString()} MT</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-850">
                      <span className="text-zinc-400">Total Weighbridge Dispatches:</span>
                      <span className="text-blue-400 font-bold">-{currentMonthData.totalDispatched.toLocaleString()} MT</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-850">
                      <span className="text-zinc-400">Net Stock Differential:</span>
                      <span
                        className={`font-bold ${
                          currentMonthData.totalProduction >= currentMonthData.totalDispatched
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {currentMonthData.totalProduction >= currentMonthData.totalDispatched ? '+' : ''}
                        {(currentMonthData.totalProduction - currentMonthData.totalDispatched).toFixed(1)} MT
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-400">Crusher Availability %:</span>
                      <span className="text-white font-bold">
                        {currentMonthData.totalOperatingHours > 0
                          ? (
                              (currentMonthData.totalOperatingHours /
                                (currentMonthData.totalOperatingHours + currentMonthData.totalBreakdownHours)) *
                              100
                            ).toFixed(1)
                          : '100'}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Certified by Mines Incharge:</span>
                  <span className="font-bold text-zinc-200">Pushpendra (Report 2026-027)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yearly Report Summary View */}
      {reportType === 'yearly' && (
        <div className="space-y-6">
          {/* Yearly Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">FY 2026-27 ROM</span>
              <span className="text-xl font-bold font-mono text-white">{yearlySummary.totalRomFed.toLocaleString()} MT</span>
              <span className="text-[10px] text-zinc-500 block mt-1">Boulder Extracted</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Total Output</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {yearlySummary.totalProduction.toLocaleString()} MT
              </span>
              <span className="text-[10px] text-emerald-500 block mt-1">
                Yield {yearlySummary.avgRecoveryPercent}%
              </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Total Dispatches</span>
              <span className="text-xl font-bold font-mono text-blue-400">
                {yearlySummary.totalDispatched.toLocaleString()} MT
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">Via Weighbridge</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Annual Revenue</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                ₹ {yearlySummary.totalRevenue.toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">Invoiced Sales</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Overall Plant TPH</span>
              <span className="text-xl font-bold font-mono text-purple-400">{yearlySummary.avgTph} TPH</span>
              <span className="text-[10px] text-zinc-500 block mt-1">Crushing Speed</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Yard Closing Stock</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {yearlySummary.closingStockEstimate.toLocaleString()} MT
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">Estimated In-Yard</span>
            </div>
          </div>

          {/* Month-by-Month Annual Comparative Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  S.GOENKA LIME &amp; CHEMICALS LTD. — Mines &amp; Crusher Operations Matrix (Report 2026-027)
                </h3>
                <p className="text-xs text-zinc-400">Station Road, Katni &bull; Incharge: Pushpendra &bull; FY 2026-27</p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                Report No. 2026-027
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-zinc-300 divide-y divide-zinc-800">
                <thead className="bg-zinc-950 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-3 py-3 text-right">Days</th>
                    <th className="px-3 py-3 text-right">ROM Fed (MT)</th>
                    <th className="px-3 py-3 text-right text-emerald-400">Crushed (MT)</th>
                    <th className="px-3 py-3 text-right text-blue-400">Dispatched (MT)</th>
                    <th className="px-3 py-3 text-right text-amber-400">Revenue (₹)</th>
                    <th className="px-3 py-3 text-right">Plant TPH</th>
                    <th className="px-3 py-3 text-right">Diesel (L)</th>
                    <th className="px-3 py-3 text-right">Power (kWh)</th>
                    <th className="px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {monthlySummaries.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-zinc-800/40 transition">
                      <td className="px-4 py-3 font-sans font-bold text-white">{m.monthName}</td>
                      <td className="px-3 py-3 text-right text-zinc-400">{m.operatingDays}d</td>
                      <td className="px-3 py-3 text-right font-bold text-zinc-100">{m.totalRomFed.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-400">
                        {m.totalProduction.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-blue-400">
                        {m.totalDispatched.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-amber-400">
                        ₹ {m.dispatchAmount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-200">{m.avgTph}</td>
                      <td className="px-3 py-3 text-right text-zinc-300">{m.totalDiesel.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-zinc-400">{m.totalPowerKwh.toLocaleString()}</td>
                      <td className="px-3 py-3 text-center font-sans">
                        <button
                          onClick={() => {
                            setSelectedMonthKey(m.monthKey);
                            setReportType('monthly');
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-950 font-mono font-bold text-white border-t-2 border-zinc-700">
                  <tr>
                    <td className="px-4 py-3 font-sans text-amber-400">FY 2026-27 TOTAL</td>
                    <td className="px-3 py-3 text-right text-zinc-400">
                      {monthlySummaries.reduce((a, b) => a + b.operatingDays, 0)}d
                    </td>
                    <td className="px-3 py-3 text-right text-zinc-100">{yearlySummary.totalRomFed.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-emerald-400">
                      {yearlySummary.totalProduction.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-400">
                      {yearlySummary.totalDispatched.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-400">
                      ₹ {yearlySummary.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-purple-400">{yearlySummary.avgTph}</td>
                    <td className="px-3 py-3 text-right">{yearlySummary.totalDiesel.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{yearlySummary.totalElectricity.toLocaleString()}</td>
                    <td className="px-3 py-3 text-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
