import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Download,
  AlertCircle,
  HardHat,
  Fuel,
  Zap,
  TrendingUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ProductionRecord } from '../types';

interface ProductionTableProps {
  records: ProductionRecord[];
  onAdd: () => void;
  onEdit: (record: ProductionRecord) => void;
  onDelete: (id: string, recordInfo: string) => void;
}

export const ProductionTable: React.FC<ProductionTableProps> = ({
  records,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');

  // Available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.date.substring(0, 7)));
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (monthFilter !== 'ALL' && !r.date.startsWith(monthFilter)) return false;
      if (shiftFilter !== 'ALL' && r.shift !== shiftFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const combined = `${r.date} ${r.shift} ${r.supervisor} ${r.quarryBench} ${r.downtimeReason || ''} ${r.remarks || ''}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }
      return true;
    });
  }, [records, monthFilter, shiftFilter, searchTerm]);

  // Summary of filtered rows
  const summary = useMemo(() => {
    const rom = filtered.reduce((acc, r) => acc + (r.romFedTons || 0), 0);
    const prod = filtered.reduce((acc, r) => acc + (r.totalProduction || 0), 0);
    const diesel = filtered.reduce((acc, r) => acc + (r.dieselLiters || 0), 0);
    const kwh = filtered.reduce((acc, r) => acc + (r.electricityKwh || 0), 0);
    const opHours = filtered.reduce((acc, r) => acc + (r.operatingHours || 0), 0);
    const recovery = rom > 0 ? Number(((prod / rom) * 100).toFixed(1)) : 0;
    const tph = opHours > 0 ? Number((rom / opHours).toFixed(1)) : 0;
    return { rom, prod, diesel, kwh, recovery, tph, count: filtered.length };
  }, [filtered]);

  const handleExportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((r) => ({
        Date: r.date,
        Shift: r.shift,
        Supervisor: r.supervisor,
        Bench: r.quarryBench,
        'ROM Fed (MT)': r.romFedTons,
        'Operating Hours': r.operatingHours,
        'Breakdown Hours': r.breakdownHours,
        '10mm (MT)': r.aggregate10mm,
        '20mm (MT)': r.aggregate20mm,
        '40mm (MT)': r.aggregate40mm,
        'GSB (MT)': r.gsb,
        'Dust (MT)': r.stoneDust,
        '65mm Ballast (MT)': r.ballast65mm,
        'Total Crushed (MT)': r.totalProduction,
        'Recovery %': r.recoveryPercent,
        'Diesel (L)': r.dieselLiters,
        'Power (kWh)': r.electricityKwh,
        Downtime: r.downtimeReason || '',
        Remarks: r.remarks || '',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Production_Data');
    XLSX.writeFile(workbook, `Mines_Crusher_Production_Report_${monthFilter}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Entries Logged</span>
          <span className="text-xl font-bold font-mono text-white">{summary.count} Shifts</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">ROM Boulder Fed</span>
          <span className="text-xl font-bold font-mono text-amber-400">{summary.rom.toLocaleString()} MT</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Crushed Production</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{summary.prod.toLocaleString()} MT</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Avg Plant TPH</span>
          <span className="text-xl font-bold font-mono text-blue-400">{summary.tph} TPH</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Recovery Yield</span>
          <span className="text-xl font-bold font-mono text-purple-400">{summary.recovery}%</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Total Fuel</span>
          <span className="text-xl font-bold font-mono text-amber-300">{summary.diesel.toLocaleString()} Ltr</span>
        </div>
      </div>

      {/* Control Bar: Search, Month, Shift, Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search date, supervisor (Pushpendra), bench, remarks..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-hidden"
            >
              <option value="ALL">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-hidden"
          >
            <option value="ALL">All Shifts</option>
            <option value="Day">Day Shift</option>
            <option value="Night">Night Shift</option>
            <option value="General">General Shift</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Crushing Entry</span>
          </button>
        </div>
      </div>

      {/* Production Records Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-zinc-300 divide-y divide-zinc-800">
            <thead className="bg-zinc-950 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Date &amp; Shift</th>
                <th className="px-3 py-3">Supervisor / Bench</th>
                <th className="px-3 py-3 text-right">ROM Feed (MT)</th>
                <th className="px-3 py-3 text-right">10mm</th>
                <th className="px-3 py-3 text-right">20mm</th>
                <th className="px-3 py-3 text-right">40mm</th>
                <th className="px-3 py-3 text-right">GSB</th>
                <th className="px-3 py-3 text-right">Dust</th>
                <th className="px-3 py-3 text-right text-emerald-400">Total MT</th>
                <th className="px-3 py-3 text-right">Recovery</th>
                <th className="px-3 py-3 text-right">Hours</th>
                <th className="px-3 py-3 text-right">Fuel</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-zinc-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                    No crushing entries match current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="font-sans font-bold text-white text-xs">{r.date}</div>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold mt-0.5 ${
                          r.shift === 'Day'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {r.shift} Shift
                      </span>
                    </td>

                    <td className="px-3 py-2.5 font-sans whitespace-nowrap">
                      <div className="font-semibold text-zinc-200 text-xs">{r.supervisor}</div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[130px]" title={r.quarryBench}>
                        {r.quarryBench}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-right font-bold text-amber-400">{r.romFedTons.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{r.aggregate10mm}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-100 font-semibold">{r.aggregate20mm}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{r.aggregate40mm}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{r.gsb}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{r.stoneDust}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-400 text-sm">
                      {r.totalProduction.toLocaleString()}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                          r.recoveryPercent >= 97
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {r.recoveryPercent}%
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className="text-zinc-200">{r.operatingHours}h</span>
                      {r.breakdownHours > 0 && (
                        <span className="text-[10px] text-red-400 block" title={r.downtimeReason || 'Breakdown'}>
                          -{r.breakdownHours}h BD
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-zinc-300">
                      <span>{r.dieselLiters} L</span>
                      <span className="text-[10px] text-zinc-500 block">{r.electricityKwh} kWh</span>
                    </td>

                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(r)}
                          className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            onDelete(r.id, `Crushing entry for ${r.date} (${r.shift} Shift - ${r.romFedTons} MT)`)
                          }
                          className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
