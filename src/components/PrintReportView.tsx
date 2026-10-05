import React, { useState } from 'react';
import { Printer, X, Download, ShieldCheck, HardHat, Truck } from 'lucide-react';
import type { ProductionRecord, DispatchRecord, MonthlySummaryData, YearlySummaryData } from '../types';
import { computeMonthlySummaries, computeYearlySummary } from '../utils/storage';

interface PrintReportViewProps {
  production: ProductionRecord[];
  dispatch: DispatchRecord[];
  initialMode?: 'monthly' | 'yearly';
  initialMonthKey?: string;
  ticketToPrint?: DispatchRecord | null;
  onClose: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  production,
  dispatch,
  initialMode = 'monthly',
  initialMonthKey,
  ticketToPrint,
  onClose,
}) => {
  const [printMode, setPrintMode] = useState<'monthly' | 'yearly' | 'ticket'>(
    ticketToPrint ? 'ticket' : initialMode
  );

  const monthlySummaries = computeMonthlySummaries(production, dispatch);
  const yearlySummary = computeYearlySummary(monthlySummaries, '2026-027');

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (initialMonthKey) return initialMonthKey;
    return monthlySummaries.length > 0 ? monthlySummaries[monthlySummaries.length - 1].monthKey : '2026-04';
  });

  const monthData = monthlySummaries.find((m) => m.monthKey === selectedMonth) || monthlySummaries[0];

  const monthProductionRecords = production.filter((p) => p.date.startsWith(selectedMonth));
  const monthDispatchRecords = dispatch.filter((d) => d.date.startsWith(selectedMonth));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-xs p-4 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* On-Screen Print Navigation Header - Hidden on Print */}
      <div className="max-w-5xl mx-auto mb-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg print:hidden text-zinc-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Print Official Operations Report</h2>
            <p className="text-xs text-zinc-400">
              Formatted for A4 printer, PDF export, or official audit submission
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!ticketToPrint && (
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setPrintMode('monthly')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  printMode === 'monthly' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400'
                }`}
              >
                Monthly Summary
              </button>
              <button
                onClick={() => setPrintMode('yearly')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  printMode === 'yearly' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400'
                }`}
              >
                Yearly Audit (2026-027)
              </button>
            </div>
          )}

          {printMode === 'monthly' && !ticketToPrint && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-1.5 font-medium"
            >
              {monthlySummaries.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.monthName}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* The Printable Document Area */}
      <div className="max-w-5xl mx-auto bg-white text-zinc-900 rounded-2xl shadow-2xl p-8 sm:p-12 print:p-0 print:shadow-none print:rounded-none print:max-w-none print:text-black">
        {/* Document Letterhead */}
        <div className="border-b-2 border-zinc-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-amber-700 mb-0.5">
                Mines, Minerals &amp; Stone Crushing Division
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
                S.GOENKA LIME &amp; CHEMICALS LTD.
              </h1>
              <p className="text-xs text-zinc-700 mt-1 font-medium">
                <span className="font-bold text-zinc-900">Registered Office:</span> Station Road, Katni - 483501 (M.P.)
              </p>
              <p className="text-xs text-zinc-700 mt-0.5">
                <span className="font-bold text-zinc-900">Mobile No:</span> +91 7470710385 &bull;{' '}
                <span className="font-bold text-zinc-900">Email Id:</span> sgoenkalime@gmail.com
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block bg-zinc-900 text-white font-mono text-xs font-bold px-3 py-1 rounded">
                REPORT NO: 2026-027
              </span>
              <div className="text-xs text-zinc-500 mt-1 font-mono">
                Date: {new Date().toLocaleDateString('en-GB')}
              </div>
              <div className="text-xs font-semibold text-zinc-800 mt-0.5">
                Mines Incharge: Pushpendra
              </div>
            </div>
          </div>
        </div>

        {/* Case 1: Individual Weighbridge Challan Ticket */}
        {printMode === 'ticket' && ticketToPrint && (
          <div className="space-y-6">
            <div className="text-center pb-2 border-b border-zinc-300">
              <h2 className="text-lg font-bold uppercase tracking-wider">OFFICIAL WEIGHBRIDGE OUTWARD DISPATCH SLIP</h2>
              <p className="text-xs text-zinc-600">Computerized Weighbridge Record &bull; Original Consignee Copy</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div>
                  <span className="text-zinc-500">Challan / Ticket No:</span>{' '}
                  <strong className="font-mono text-sm">{ticketToPrint.challanNo}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Date &amp; Time:</span>{' '}
                  <strong>{ticketToPrint.date} at {ticketToPrint.time}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Vehicle / Truck No:</span>{' '}
                  <strong className="font-mono text-sm text-zinc-950 bg-zinc-200 px-2 py-0.5 rounded">
                    {ticketToPrint.vehicleNo}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500">Material Dispatched:</span>{' '}
                  <strong className="text-sm">{ticketToPrint.material} Aggregate</strong>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div>
                  <span className="text-zinc-500">Customer / Consignee:</span>{' '}
                  <strong>{ticketToPrint.customerName}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Destination Site:</span>{' '}
                  <strong>{ticketToPrint.destination || 'Highway Site Project'}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Royalty / e-Pass No:</span>{' '}
                  <strong className="font-mono text-zinc-800">{ticketToPrint.royaltyPassNo}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Payment Mode:</span>{' '}
                  <strong>{ticketToPrint.paymentMode}</strong>
                </div>
              </div>
            </div>

            {/* Weighbridge Weights Box */}
            <div className="border-2 border-zinc-900 rounded-xl p-4 bg-zinc-50">
              <div className="grid grid-cols-3 text-center divide-x-2 divide-zinc-300">
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold">Gross Weight</div>
                  <div className="text-xl font-bold font-mono">{ticketToPrint.grossWeight.toFixed(2)} MT</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold">Tare (Empty) Wt</div>
                  <div className="text-xl font-bold font-mono">{ticketToPrint.tareWeight.toFixed(2)} MT</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-900 uppercase font-bold text-amber-800">Net Weight Loaded</div>
                  <div className="text-2xl font-black font-mono text-zinc-950">{ticketToPrint.netWeight.toFixed(2)} MT</div>
                </div>
              </div>
            </div>

            {/* Billing Calculation */}
            <div className="flex justify-between items-center p-3 rounded-lg border border-zinc-300 text-xs">
              <div>
                <span className="text-zinc-500">Agreed Rate per MT:</span>{' '}
                <strong className="font-mono">₹ {ticketToPrint.ratePerTon}</strong>
              </div>
              <div>
                <span className="text-zinc-500">Total Invoiced Value:</span>{' '}
                <strong className="font-mono text-base text-zinc-950">₹ {ticketToPrint.totalAmount.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Case 2: Monthly Summary Report */}
        {printMode === 'monthly' && monthData && (
          <div className="space-y-6">
            <div className="text-center pb-2 border-b border-zinc-300">
              <h2 className="text-lg font-bold uppercase tracking-wider">
                MONTHLY MINES &amp; CRUSHER OPERATIONS REPORT — {monthData.monthName.toUpperCase()}
              </h2>
              <p className="text-xs text-zinc-600">
                Report Reference: 2026-027 &bull; Prepared by Shift Incharge Pushpendra
              </p>
            </div>

            {/* Monthly KPI Grid */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">ROM Boulder Fed</div>
                <div className="text-lg font-bold font-mono text-zinc-950">{monthData.totalRomFed.toLocaleString()} MT</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Crushed Production</div>
                <div className="text-lg font-bold font-mono text-zinc-950">{monthData.totalProduction.toLocaleString()} MT</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Total Dispatched</div>
                <div className="text-lg font-bold font-mono text-zinc-950">{monthData.totalDispatched.toLocaleString()} MT</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Total Billing</div>
                <div className="text-lg font-bold font-mono text-zinc-950">₹ {monthData.dispatchAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Product Production Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-2">
                1. Product-Wise Crushed Aggregate Yields
              </h3>
              <table className="w-full text-left text-xs border border-zinc-300 divide-y divide-zinc-300">
                <thead className="bg-zinc-100 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Material / Product Grade</th>
                    <th className="p-2 text-right">Production (MT)</th>
                    <th className="p-2 text-right">Yield %</th>
                    <th className="p-2">Primary Application</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  <tr>
                    <td className="p-2 font-sans font-medium">20mm Crushed Aggregate</td>
                    <td className="p-2 text-right font-bold">{monthData.prod20mm.toLocaleString()} MT</td>
                    <td className="p-2 text-right">{((monthData.prod20mm / (monthData.totalProduction || 1)) * 100).toFixed(1)}%</td>
                    <td className="p-2 font-sans text-zinc-600">Standard Concrete &amp; Asphalt Wearing</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-medium">10mm Fine Aggregate</td>
                    <td className="p-2 text-right font-bold">{monthData.prod10mm.toLocaleString()} MT</td>
                    <td className="p-2 text-right">{((monthData.prod10mm / (monthData.totalProduction || 1)) * 100).toFixed(1)}%</td>
                    <td className="p-2 font-sans text-zinc-600">RMC &amp; Concrete Pavers</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-medium">40mm Road Base Aggregate</td>
                    <td className="p-2 text-right font-bold">{monthData.prod40mm.toLocaleString()} MT</td>
                    <td className="p-2 text-right">{((monthData.prod40mm / (monthData.totalProduction || 1)) * 100).toFixed(1)}%</td>
                    <td className="p-2 font-sans text-zinc-600">WMM &amp; Road Base Courses</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-medium">GSB (Granular Sub Base)</td>
                    <td className="p-2 text-right font-bold">{monthData.prodGsb.toLocaleString()} MT</td>
                    <td className="p-2 text-right">{((monthData.prodGsb / (monthData.totalProduction || 1)) * 100).toFixed(1)}%</td>
                    <td className="p-2 font-sans text-zinc-600">Highway Sub-base Layer</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-medium">Stone Dust / M-Sand</td>
                    <td className="p-2 text-right font-bold">{monthData.prodDust.toLocaleString()} MT</td>
                    <td className="p-2 text-right">{((monthData.prodDust / (monthData.totalProduction || 1)) * 100).toFixed(1)}%</td>
                    <td className="p-2 font-sans text-zinc-600">Plaster, Block making, GSB filler</td>
                  </tr>
                </tbody>
                <tfoot className="bg-zinc-100 font-mono font-bold">
                  <tr>
                    <td className="p-2 font-sans">TOTAL MONTHLY OUTPUT</td>
                    <td className="p-2 text-right">{monthData.totalProduction.toLocaleString()} MT</td>
                    <td className="p-2 text-right">100.0%</td>
                    <td className="p-2 font-sans text-zinc-600">Recovery: ~97.2% of ROM</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Daily Production Shifts Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-2">
                2. Shift Crushing &amp; Machine Log Register
              </h3>
              <table className="w-full text-left text-xs border border-zinc-300 divide-y divide-zinc-300">
                <thead className="bg-zinc-100 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-1.5">Date</th>
                    <th className="p-1.5">Shift</th>
                    <th className="p-1.5">Bench</th>
                    <th className="p-1.5 text-right">ROM (MT)</th>
                    <th className="p-1.5 text-right">Crushed (MT)</th>
                    <th className="p-1.5 text-right">Run Hrs</th>
                    <th className="p-1.5 text-right">Diesel (L)</th>
                    <th className="p-1.5">Remarks / Downtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono text-[11px]">
                  {monthProductionRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="p-1.5 font-sans font-medium">{r.date}</td>
                      <td className="p-1.5 font-sans">{r.shift}</td>
                      <td className="p-1.5 font-sans">{r.quarryBench}</td>
                      <td className="p-1.5 text-right font-bold">{r.romFedTons}</td>
                      <td className="p-1.5 text-right">{r.totalProduction}</td>
                      <td className="p-1.5 text-right">{r.operatingHours}h</td>
                      <td className="p-1.5 text-right">{r.dieselLiters}</td>
                      <td className="p-1.5 font-sans text-zinc-600 truncate max-w-[200px]">
                        {r.downtimeReason || r.remarks || 'Normal operations'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Case 3: Yearly Audit Summary Report */}
        {printMode === 'yearly' && (
          <div className="space-y-6">
            <div className="text-center pb-2 border-b border-zinc-300">
              <h2 className="text-lg font-bold uppercase tracking-wider">
                ANNUAL AUDIT &amp; OPERATIONS REPORT — FY 2026-27
              </h2>
              <p className="text-xs text-zinc-600">
                Official Report Reference: 2026-027 &bull; Site Manager / Incharge: Pushpendra
              </p>
            </div>

            {/* Annual KPI Table */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Annual ROM Excavated</div>
                <div className="text-lg font-bold font-mono text-zinc-950">{yearlySummary.totalRomFed.toLocaleString()} MT</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Annual Crushed Production</div>
                <div className="text-lg font-bold font-mono text-zinc-950">{yearlySummary.totalProduction.toLocaleString()} MT</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Annual Dispatched Net</div>
                <div className="text-lg font-bold font-mono text-zinc-950">{yearlySummary.totalDispatched.toLocaleString()} MT</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-300 bg-zinc-50">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Gross Sales Revenue</div>
                <div className="text-lg font-bold font-mono text-zinc-950">₹ {yearlySummary.totalRevenue.toLocaleString()}</div>
              </div>
            </div>

            {/* Month-by-Month Matrix */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-2">
                Monthly Performance &amp; Production Matrix (FY 2026-27)
              </h3>
              <table className="w-full text-left text-xs border border-zinc-300 divide-y divide-zinc-300">
                <thead className="bg-zinc-100 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Month</th>
                    <th className="p-2 text-right">ROM Fed (MT)</th>
                    <th className="p-2 text-right">Crushed (MT)</th>
                    <th className="p-2 text-right">Dispatched (MT)</th>
                    <th className="p-2 text-right">Revenue (₹)</th>
                    <th className="p-2 text-right">TPH</th>
                    <th className="p-2 text-right">Diesel (L)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {monthlySummaries.map((m) => (
                    <tr key={m.monthKey}>
                      <td className="p-2 font-sans font-medium">{m.monthName}</td>
                      <td className="p-2 text-right">{m.totalRomFed.toLocaleString()}</td>
                      <td className="p-2 text-right font-bold">{m.totalProduction.toLocaleString()}</td>
                      <td className="p-2 text-right">{m.totalDispatched.toLocaleString()}</td>
                      <td className="p-2 text-right">₹ {m.dispatchAmount.toLocaleString()}</td>
                      <td className="p-2 text-right">{m.avgTph}</td>
                      <td className="p-2 text-right">{m.totalDiesel.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-100 font-mono font-bold">
                  <tr>
                    <td className="p-2 font-sans text-zinc-950">YEAR TOTAL</td>
                    <td className="p-2 text-right">{yearlySummary.totalRomFed.toLocaleString()}</td>
                    <td className="p-2 text-right">{yearlySummary.totalProduction.toLocaleString()}</td>
                    <td className="p-2 text-right">{yearlySummary.totalDispatched.toLocaleString()}</td>
                    <td className="p-2 text-right">₹ {yearlySummary.totalRevenue.toLocaleString()}</td>
                    <td className="p-2 text-right">{yearlySummary.avgTph}</td>
                    <td className="p-2 text-right">{yearlySummary.totalDiesel.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Stock Reconciliation Section */}
            <div className="border border-zinc-300 rounded-lg p-4 bg-zinc-50 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-zinc-800 mb-2">
                Stock Reconciliation &amp; Yard Balance
              </h4>
              <div className="grid grid-cols-4 gap-4 font-mono">
                <div>
                  <span className="text-zinc-500 block">Initial Opening Stock:</span>
                  <span className="font-bold">450.0 MT</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Total Crushed Added:</span>
                  <span className="font-bold text-emerald-800">+{yearlySummary.totalProduction.toLocaleString()} MT</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Total Dispatched Out:</span>
                  <span className="font-bold text-red-800">-{yearlySummary.totalDispatched.toLocaleString()} MT</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Estimated Yard Closing Stock:</span>
                  <span className="font-bold text-zinc-950 text-sm">{yearlySummary.closingStockEstimate.toLocaleString()} MT</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authorized Signatures Strip */}
        <div className="mt-12 pt-8 border-t-2 border-zinc-800 text-xs">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="h-12 border-b border-zinc-400 border-dashed" />
              <div className="mt-2 font-bold text-zinc-900">Computer Operator</div>
              <div className="text-[10px] text-zinc-500">Data Entry &amp; Weighbridge</div>
            </div>

            <div>
              <div className="h-12 border-b border-zinc-400 border-dashed flex items-end justify-center pb-1">
                <span className="font-serif italic font-bold text-zinc-800 text-sm">Pushpendra</span>
              </div>
              <div className="mt-2 font-bold text-zinc-900">Pushpendra (Mines Incharge)</div>
              <div className="text-[10px] text-zinc-500">Report 2026-027 Verified</div>
            </div>

            <div>
              <div className="h-12 border-b border-zinc-400 border-dashed" />
              <div className="mt-2 font-bold text-zinc-900">For S.GOENKA LIME &amp; CHEMICALS LTD.</div>
              <div className="text-[10px] text-zinc-500">Authorized Signatory / Director</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
