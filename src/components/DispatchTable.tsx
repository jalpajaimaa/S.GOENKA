import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Download,
  AlertCircle,
  Truck,
  Printer,
  FileText,
  DollarSign,
  Scale,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { DispatchRecord, MaterialType } from '../types';

interface DispatchTableProps {
  records: DispatchRecord[];
  onAdd: () => void;
  onEdit: (record: DispatchRecord) => void;
  onDelete: (id: string, recordInfo: string) => void;
  onPrintTicket: (record: DispatchRecord) => void;
}

export const DispatchTable: React.FC<DispatchTableProps> = ({
  records,
  onAdd,
  onEdit,
  onDelete,
  onPrintTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');

  // Available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.date.substring(0, 7)));
    return Array.from(set).sort();
  }, [records]);

  // Filtered
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (monthFilter !== 'ALL' && !r.date.startsWith(monthFilter)) return false;
      if (materialFilter !== 'ALL' && r.material !== materialFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const combined = `${r.challanNo} ${r.vehicleNo} ${r.customerName} ${r.destination || ''} ${r.royaltyPassNo} ${r.supervisor}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }
      return true;
    });
  }, [records, monthFilter, materialFilter, searchTerm]);

  // Summary
  const summary = useMemo(() => {
    const totalNetWeight = filtered.reduce((acc, r) => acc + (r.netWeight || 0), 0);
    const totalAmount = filtered.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    const avgRate = totalNetWeight > 0 ? Math.round(totalAmount / totalNetWeight) : 0;
    return {
      count: filtered.length,
      totalNetWeight: Number(totalNetWeight.toFixed(2)),
      totalAmount,
      avgRate,
    };
  }, [filtered]);

  const handleExportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((r) => ({
        'Challan No': r.challanNo,
        Date: r.date,
        Time: r.time,
        'Vehicle No': r.vehicleNo,
        Customer: r.customerName,
        Material: r.material,
        'Gross Wt (MT)': r.grossWeight,
        'Tare Wt (MT)': r.tareWeight,
        'Net Wt (MT)': r.netWeight,
        'Rate/MT': r.ratePerTon,
        'Amount (INR)': r.totalAmount,
        'Royalty Pass': r.royaltyPassNo,
        Payment: r.paymentMode,
        Destination: r.destination || '',
        Supervisor: r.supervisor,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weighbridge_Dispatches');
    XLSX.writeFile(workbook, `Mines_Dispatch_Report_${monthFilter}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Dispatched Challans</span>
          <span className="text-xl font-bold font-mono text-white">{summary.count} Trucks</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Total Net Dispatched</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{summary.totalNetWeight.toLocaleString()} MT</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Total Invoiced Value</span>
          <span className="text-xl font-bold font-mono text-amber-400">₹ {summary.totalAmount.toLocaleString()}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Average Realization</span>
          <span className="text-xl font-bold font-mono text-blue-400">₹ {summary.avgRate} / MT</span>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search challan, vehicle (RJ-14...), customer (L&T, NHAI)..."
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

          {/* Material Filter */}
          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-hidden"
          >
            <option value="ALL">All Materials</option>
            <option value="10mm">10mm</option>
            <option value="20mm">20mm</option>
            <option value="40mm">40mm</option>
            <option value="GSB">GSB</option>
            <option value="Stone Dust">Stone Dust</option>
            <option value="65mm Ballast">65mm Ballast</option>
            <option value="Boulder ROM">Boulder ROM</option>
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Dispatch Ticket</span>
          </button>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-zinc-300 divide-y divide-zinc-800">
            <thead className="bg-zinc-950 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Challan &amp; Date</th>
                <th className="px-3 py-3">Vehicle No.</th>
                <th className="px-3 py-3">Customer / Party</th>
                <th className="px-3 py-3">Material</th>
                <th className="px-3 py-3 text-right">Gross Wt</th>
                <th className="px-3 py-3 text-right">Tare Wt</th>
                <th className="px-3 py-3 text-right text-emerald-400">Net Wt (MT)</th>
                <th className="px-3 py-3 text-right">Rate/MT</th>
                <th className="px-3 py-3 text-right text-amber-400">Amount (₹)</th>
                <th className="px-3 py-3">Royalty Pass</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-zinc-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                    No dispatch tickets match current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="font-bold text-white text-xs">{r.challanNo}</div>
                      <div className="text-[11px] text-zinc-400 font-sans">
                        {r.date} <span className="text-zinc-500">({r.time})</span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-xs">
                        {r.vehicleNo}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 font-sans whitespace-nowrap">
                      <div className="font-semibold text-zinc-200 text-xs truncate max-w-[180px]" title={r.customerName}>
                        {r.customerName}
                      </div>
                      {r.destination && (
                        <div className="text-[10px] text-zinc-400 truncate max-w-[180px]" title={r.destination}>
                          Dest: {r.destination}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap font-sans">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium">
                        {r.material}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-right text-zinc-400">{r.grossWeight.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-400">{r.tareWeight.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-400 text-sm">
                      {r.netWeight.toFixed(2)}
                    </td>

                    <td className="px-3 py-2.5 text-right text-zinc-300">₹ {r.ratePerTon}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-amber-400">
                      ₹ {r.totalAmount.toLocaleString()}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-[11px] text-zinc-400 block truncate max-w-[130px]" title={r.royaltyPassNo}>
                        {r.royaltyPassNo}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-sans block">{r.paymentMode}</span>
                    </td>

                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onPrintTicket(r)}
                          className="p-1 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition"
                          title="Print Weighbridge Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(r)}
                          className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition"
                          title="Edit Ticket"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            onDelete(r.id, `Dispatch Challan ${r.challanNo} (${r.vehicleNo} - ${r.netWeight} MT)`)
                          }
                          className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition"
                          title="Delete Ticket"
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
