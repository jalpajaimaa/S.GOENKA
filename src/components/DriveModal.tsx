import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  FileSpreadsheet,
  Cloud,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  HardHat,
  FileText,
  ExternalLink,
} from 'lucide-react';
import type { DriveFileInfo, ProductionRecord, DispatchRecord } from '../types';
import { searchDriveFiles, readDriveFile, exportReportToDrive } from '../services/googleDrive';
import * as XLSX from 'xlsx';

interface DriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  onGoogleSignIn: () => void;
  onImportData: (
    newProd: Partial<ProductionRecord>[],
    newDisp: Partial<DispatchRecord>[],
    sourceName: string
  ) => void;
  currentProduction: ProductionRecord[];
  currentDispatch: DispatchRecord[];
}

export const DriveModal: React.FC<DriveModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  onGoogleSignIn,
  onImportData,
  currentProduction,
  currentDispatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('2026-027 Mines Crusher Pushpendra');
  const [files, setFiles] = useState<DriveFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [readingFileId, setReadingFileId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);

  // Search files on open or when token becomes available
  useEffect(() => {
    if (isOpen && accessToken) {
      handleSearch();
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const results = await searchDriveFiles(accessToken, searchQuery);
      setFiles(results);
      if (results.length === 0) {
        setStatusMessage({
          type: 'info',
          text: `No files found matching "${searchQuery}". You can adjust the search keywords or import a local file.`,
        });
      }
    } catch (err: any) {
      console.error('Drive search error:', err);
      setStatusMessage({
        type: 'error',
        text: `Failed to search Google Drive: ${err.message || 'Network error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadFile = async (file: DriveFileInfo) => {
    if (!accessToken) return;
    setReadingFileId(file.id);
    setStatusMessage(null);
    try {
      const result = await readDriveFile(accessToken, file.id, file.mimeType);
      const prodCount = result.productionRecords.length;
      const dispCount = result.dispatchRecords.length;

      if (prodCount === 0 && dispCount === 0) {
        setStatusMessage({
          type: 'info',
          text: `Read file "${file.name}" but found 0 recognizable production/dispatch rows.`,
        });
      } else {
        onImportData(result.productionRecords, result.dispatchRecords, file.name);
        setStatusMessage({
          type: 'success',
          text: `Successfully imported ${prodCount} production entries and ${dispCount} dispatch tickets from "${file.name}"!`,
        });
      }
    } catch (err: any) {
      console.error('Read file error:', err);
      setStatusMessage({
        type: 'error',
        text: `Error reading file: ${err.message}`,
      });
    } finally {
      setReadingFileId(null);
    }
  };

  // Local file import fallback
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const allProd: Partial<ProductionRecord>[] = [];
        const allDisp: Partial<DispatchRecord>[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
          const isDispatch = sheetName.toLowerCase().includes('disp') || sheetName.toLowerCase().includes('challan');

          rows.forEach((r, idx) => {
            if (isDispatch) {
              allDisp.push({
                id: `local-disp-${idx}-${Date.now()}`,
                challanNo: r['Challan No'] || r.challanNo || `CH-2026-${idx + 100}`,
                date: r.Date || r.date || new Date().toISOString().split('T')[0],
                time: r.Time || '10:00',
                vehicleNo: r['Vehicle No'] || r.vehicleNo || 'RJ-14-GA-9000',
                customerName: r.Customer || r.customerName || 'Local Project',
                material: r.Material || r.material || '20mm',
                grossWeight: Number(r['Gross Wt (MT)'] || r.grossWeight || 40),
                tareWeight: Number(r['Tare Wt (MT)'] || r.tareWeight || 14),
                netWeight: Number(r['Net Wt (MT)'] || r.netWeight || 26),
                ratePerTon: Number(r['Rate/MT'] || r.ratePerTon || 500),
                totalAmount: Number(r['Amount (INR)'] || r.totalAmount || 13000),
                royaltyPassNo: r['Royalty Pass'] || 'ROYALTY-OK',
                paymentMode: 'Credit',
                supervisor: r.Supervisor || 'Pushpendra',
                status: 'Completed',
                updatedAt: new Date().toISOString(),
              });
            } else {
              allProd.push({
                id: `local-prod-${idx}-${Date.now()}`,
                date: r.Date || r.date || new Date().toISOString().split('T')[0],
                shift: r.Shift || 'Day',
                supervisor: r.Supervisor || 'Pushpendra',
                quarryBench: r.Bench || 'Bench-3 Pushpendra Block',
                romFedTons: Number(r['ROM Fed (MT)'] || r.romFedTons || 1200),
                operatingHours: Number(r['Operating Hours'] || r.operatingHours || 8),
                breakdownHours: Number(r['Breakdown Hours'] || 0),
                aggregate10mm: Number(r['10mm (MT)'] || 200),
                aggregate20mm: Number(r['20mm (MT)'] || 400),
                aggregate40mm: Number(r['40mm (MT)'] || 180),
                gsb: Number(r['GSB (MT)'] || 180),
                stoneDust: Number(r['Dust (MT)'] || 180),
                ballast65mm: Number(r['65mm Ballast (MT)'] || 0),
                wasteReject: 20,
                totalProduction: Number(r['Total Crushed (MT)'] || 1160),
                recoveryPercent: 96.5,
                dieselLiters: Number(r['Diesel (L)'] || 140),
                electricityKwh: Number(r['Power (kWh)'] || 550),
                remarks: r.Remarks || 'Imported from local file',
                updatedAt: new Date().toISOString(),
              });
            }
          });
        });

        onImportData(allProd, allDisp, file.name);
        setStatusMessage({
          type: 'success',
          text: `Imported ${allProd.length} production and ${allDisp.length} dispatch rows from ${file.name}!`,
        });
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Failed to parse file: ${err.message}`,
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Export current data to Drive
  const handleExportAllToDrive = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const csvHeader = 'Date,Shift,Supervisor,Bench,ROM_Fed,Total_Produced,Recovery_Pct,Diesel_Ltr,Power_kWh\n';
      const csvRows = currentProduction
        .map(
          (p) =>
            `${p.date},${p.shift},"${p.supervisor}","${p.quarryBench}",${p.romFedTons},${p.totalProduction},${p.recoveryPercent},${p.dieselLiters},${p.electricityKwh}`
        )
        .join('\n');
      const csvContent = csvHeader + csvRows;

      const fileName = `S_Goenka_Lime_Report_2026-027_Pushpendra_${new Date().toISOString().split('T')[0]}.csv`;
      const res = await exportReportToDrive(accessToken, fileName, csvContent, 'text/csv');

      setStatusMessage({
        type: 'success',
        text: `Report saved to your Google Drive as "${fileName}"!`,
      });
    } catch (err: any) {
      console.error('Export to Drive error:', err);
      setStatusMessage({
        type: 'error',
        text: `Failed to save to Drive: ${err.message}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl my-8 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl text-zinc-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Google Drive: 2026-027 Mines &amp; Crusher Report</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Search, read, and import report files from Google Drive, or upload reports to Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-950/60 border border-red-500/40 text-red-200'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* If NOT authenticated with Google Drive */}
          {!accessToken ? (
            <div className="bg-zinc-950 rounded-2xl p-6 text-center border border-zinc-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Connect Google Drive</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                  Connect your Google account to read "2026-027 Mines &amp; Crusher Report (Pushpendra)" directly from
                  your Google Drive and save synchronized monthly &amp; yearly reports.
                </p>
              </div>

              <button
                onClick={onGoogleSignIn}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 transition shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Authorize &amp; Connect Google Drive</span>
              </button>
            </div>
          ) : (
            /* If authenticated: Drive search and file list */
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search Drive files: 2026-027, Mines, Crusher, Pushpendra..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search</span>
                </button>
              </div>

              {/* Files List */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center text-xs text-zinc-400 font-semibold uppercase">
                  <span>Drive Files Matching Query</span>
                  <span>{files.length} Found</span>
                </div>

                <div className="divide-y divide-zinc-850 max-h-56 overflow-y-auto">
                  {isLoading ? (
                    <div className="py-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      Searching your Google Drive...
                    </div>
                  ) : files.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-xs px-4">
                      No files matching "{searchQuery}" found in your Drive.
                      <p className="mt-1 text-zinc-600">
                        Try a broader search term like "Mines" or "Crusher", or upload a file directly below.
                      </p>
                    </div>
                  ) : (
                    files.map((file) => (
                      <div
                        key={file.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-zinc-900/60 transition gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate" title={file.name}>
                              {file.name}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {file.mimeType.includes('spreadsheet') ? 'Google Sheet' : 'File'} &bull;{' '}
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-zinc-400 hover:text-white rounded transition"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleReadFile(file)}
                            disabled={readingFileId === file.id}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition disabled:opacity-50"
                          >
                            {readingFileId === file.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Read &amp; Import</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Save Current Report to Drive */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">Save Current Operations Report to Drive</h4>
                  <p className="text-[11px] text-zinc-400">
                    Uploads current 2026-027 production &amp; dispatch dataset directly to your Google Drive
                  </p>
                </div>
                <button
                  onClick={handleExportAllToDrive}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition shadow-sm disabled:opacity-50 shrink-0"
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Save Report to Drive</span>
                </button>
              </div>
            </div>
          )}

          {/* Local File Upload Fallback */}
          <div className="pt-3 border-t border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Or Import from Local Device (.xlsx / .csv)
            </h4>
            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-zinc-700 hover:border-amber-500 cursor-pointer text-xs text-zinc-300 hover:text-amber-400 transition bg-zinc-950/40">
              <Upload className="w-4 h-4 text-amber-500" />
              <span>Choose "2026-027 Mines &amp; Crusher Report" file from your computer</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleLocalFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
