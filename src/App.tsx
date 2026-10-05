import React, { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { ProductionRecord, DispatchRecord } from './types';
import {
  loadProductionRecords,
  saveProductionRecords,
  loadDispatchRecords,
  saveDispatchRecords,
  resetToSeedData,
} from './utils/storage';
import { initAuth, googleSignIn, logout, getAccessToken, setAccessTokenManually } from './services/auth';
import { exportReportToDrive } from './services/googleDrive';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ProductionTable } from './components/ProductionTable';
import { ProductionFormModal } from './components/ProductionFormModal';
import { DispatchTable } from './components/DispatchTable';
import { DispatchFormModal } from './components/DispatchFormModal';
import { MonthlyYearlySummary } from './components/MonthlyYearlySummary';
import { PrintReportView } from './components/PrintReportView';
import { DriveModal } from './components/DriveModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Tab state
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'production' | 'dispatch' | 'summaries' | 'print'>(
    'dashboard'
  );

  // Data states
  const [production, setProduction] = useState<ProductionRecord[]>(() => loadProductionRecords());
  const [dispatch, setDispatch] = useState<DispatchRecord[]>(() => loadDispatchRecords());

  // Save changes to localStorage
  useEffect(() => {
    saveProductionRecords(production);
  }, [production]);

  useEffect(() => {
    saveDispatchRecords(dispatch);
  }, [dispatch]);

  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Initialize auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast(`Connected to Google Drive as ${result.user.displayName || result.user.email}!`);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      showToast(`Sign in error: ${err.message || 'Popup closed'}`, 'error');
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    showToast('Signed out of Google account.');
  };

  // Modal states
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [prodToEdit, setProdToEdit] = useState<ProductionRecord | null>(null);

  const [isDispModalOpen, setIsDispModalOpen] = useState(false);
  const [dispToEdit, setDispToEdit] = useState<DispatchRecord | null>(null);

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Print view states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'monthly' | 'yearly'>('monthly');
  const [printMonthKey, setPrintMonthKey] = useState<string | undefined>();
  const [ticketToPrint, setTicketToPrint] = useState<DispatchRecord | null>(null);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Production CRUD handlers
  const handleSaveProduction = (record: ProductionRecord) => {
    setProduction((prev) => {
      const exists = prev.some((p) => p.id === record.id);
      if (exists) {
        showToast(`Updated production entry for ${record.date} (${record.shift} shift)`);
        return prev.map((p) => (p.id === record.id ? record : p));
      } else {
        showToast(`Added new production log for ${record.date} (${record.totalProduction} MT)`);
        return [record, ...prev];
      }
    });
  };

  const handleDeleteProduction = (id: string, recordInfo: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Crushing Record',
      message: `Are you sure you want to permanently delete: "${recordInfo}"? This cannot be undone.`,
      confirmText: 'Delete Entry',
      isDanger: true,
      onConfirm: () => {
        setProduction((prev) => prev.filter((p) => p.id !== id));
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showToast('Production entry deleted.');
      },
    });
  };

  // Dispatch CRUD handlers
  const handleSaveDispatch = (record: DispatchRecord) => {
    setDispatch((prev) => {
      const exists = prev.some((d) => d.id === record.id);
      if (exists) {
        showToast(`Updated dispatch challan ${record.challanNo}`);
        return prev.map((d) => (d.id === record.id ? record : d));
      } else {
        showToast(`Issued new dispatch ticket ${record.challanNo} (${record.netWeight} MT)`);
        return [record, ...prev];
      }
    });
  };

  const handleDeleteDispatch = (id: string, recordInfo: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Dispatch Challan',
      message: `Are you sure you want to delete weighbridge ticket: "${recordInfo}"?`,
      confirmText: 'Delete Challan',
      isDanger: true,
      onConfirm: () => {
        setDispatch((prev) => prev.filter((d) => d.id !== id));
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showToast('Dispatch challan deleted.');
      },
    });
  };

  // Reset to seed data
  const handleResetData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset to 2026-027 Pushpendra Dataset',
      message:
        'This will reset all production and dispatch records to the default official FY 2026-27 seed data. Any newly entered records will be overwritten.',
      confirmText: 'Reset Data',
      isDanger: false,
      onConfirm: () => {
        const { production: p, dispatch: d } = resetToSeedData();
        setProduction(p);
        setDispatch(d);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showToast('Restored official FY 2026-27 Pushpendra Report dataset.');
      },
    });
  };

  // Import data from Google Drive or local file
  const handleImportData = (
    newProd: Partial<ProductionRecord>[],
    newDisp: Partial<DispatchRecord>[],
    sourceName: string
  ) => {
    if (newProd.length > 0) {
      setProduction((prev) => {
        const mapped = newProd.map((p, idx) => ({
          id: p.id || `imp-prod-${Date.now()}-${idx}`,
          date: p.date || new Date().toISOString().split('T')[0],
          shift: p.shift || 'Day',
          supervisor: p.supervisor || 'Pushpendra',
          quarryBench: p.quarryBench || 'Bench-3 Pushpendra Block',
          romFedTons: p.romFedTons || 1200,
          operatingHours: p.operatingHours || 8,
          breakdownHours: p.breakdownHours || 0,
          downtimeReason: p.downtimeReason || '',
          aggregate10mm: p.aggregate10mm || 0,
          aggregate20mm: p.aggregate20mm || 0,
          aggregate40mm: p.aggregate40mm || 0,
          gsb: p.gsb || 0,
          stoneDust: p.stoneDust || 0,
          ballast65mm: p.ballast65mm || 0,
          wasteReject: p.wasteReject || 0,
          totalProduction: p.totalProduction || 1150,
          recoveryPercent: p.recoveryPercent || 96.5,
          dieselLiters: p.dieselLiters || 140,
          electricityKwh: p.electricityKwh || 550,
          equipmentLogs: p.equipmentLogs || '',
          remarks: p.remarks || `Imported from ${sourceName}`,
          updatedAt: new Date().toISOString(),
        }));
        return [...mapped, ...prev];
      });
    }

    if (newDisp.length > 0) {
      setDispatch((prev) => {
        const mapped = newDisp.map((d, idx) => ({
          id: d.id || `imp-disp-${Date.now()}-${idx}`,
          challanNo: d.challanNo || `CH-2026-${idx + 100}`,
          date: d.date || new Date().toISOString().split('T')[0],
          time: d.time || '10:00',
          vehicleNo: d.vehicleNo || 'RJ-14-GA-9000',
          customerName: d.customerName || 'Highway Infra Partner',
          material: d.material || '20mm',
          grossWeight: d.grossWeight || 40,
          tareWeight: d.tareWeight || 14,
          netWeight: d.netWeight || 26,
          ratePerTon: d.ratePerTon || 500,
          totalAmount: d.totalAmount || 13000,
          royaltyPassNo: d.royaltyPassNo || 'DMG-PAID',
          paymentMode: d.paymentMode || 'Credit',
          supervisor: d.supervisor || 'Pushpendra',
          destination: d.destination || '',
          status: d.status || 'Completed',
          updatedAt: new Date().toISOString(),
        }));
        return [...mapped, ...prev];
      });
    }

    showToast(`Imported ${newProd.length} production and ${newDisp.length} dispatch rows from ${sourceName}!`);
  };

  // Export summary to Google Drive with explicit confirmation dialog (per skill)
  const handleExportSummaryToDrive = (reportName: string, csvContent: string) => {
    if (!accessToken) {
      setIsDriveModalOpen(true);
      showToast('Please connect your Google account first to export to Drive.', 'error');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Export to Google Drive',
      message: `Create a new file "${reportName}" in your Google Drive with the summarized operations data?`,
      confirmText: 'Upload to Drive',
      isDanger: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await exportReportToDrive(accessToken, reportName, csvContent, 'text/csv');
          showToast(`Report "${reportName}" saved to your Google Drive!`);
        } catch (err: any) {
          showToast(`Export failed: ${err.message}`, 'error');
        }
      },
    });
  };

  const totalProd = production.reduce((acc, p) => acc + (p.totalProduction || 0), 0);
  const totalDisp = dispatch.reduce((acc, d) => acc + (d.netWeight || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border text-xs sm:text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-zinc-900 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40'
                : 'bg-zinc-900 border-red-500/50 text-red-300 shadow-red-950/40'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Industrial Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        hasDriveToken={Boolean(accessToken)}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onResetData={handleResetData}
        totalProduction={totalProd}
        totalDispatched={totalDisp}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            production={production}
            dispatch={dispatch}
            onNavigate={setCurrentTab}
            onAddProduction={() => {
              setProdToEdit(null);
              setIsProdModalOpen(true);
            }}
            onAddDispatch={() => {
              setDispToEdit(null);
              setIsDispModalOpen(true);
            }}
          />
        )}

        {currentTab === 'production' && (
          <ProductionTable
            records={production}
            onAdd={() => {
              setProdToEdit(null);
              setIsProdModalOpen(true);
            }}
            onEdit={(record) => {
              setProdToEdit(record);
              setIsProdModalOpen(true);
            }}
            onDelete={handleDeleteProduction}
          />
        )}

        {currentTab === 'dispatch' && (
          <DispatchTable
            records={dispatch}
            onAdd={() => {
              setDispToEdit(null);
              setIsDispModalOpen(true);
            }}
            onEdit={(record) => {
              setDispToEdit(record);
              setIsDispModalOpen(true);
            }}
            onDelete={handleDeleteDispatch}
            onPrintTicket={(ticket) => {
              setTicketToPrint(ticket);
              setIsPrintModalOpen(true);
            }}
          />
        )}

        {currentTab === 'summaries' && (
          <MonthlyYearlySummary
            production={production}
            dispatch={dispatch}
            onOpenPrint={(mode, monthKey) => {
              setTicketToPrint(null);
              setPrintMode(mode);
              setPrintMonthKey(monthKey);
              setIsPrintModalOpen(true);
            }}
            onExportToDrive={handleExportSummaryToDrive}
          />
        )}

        {currentTab === 'print' && (
          <PrintReportView
            production={production}
            dispatch={dispatch}
            initialMode="monthly"
            ticketToPrint={null}
            onClose={() => setCurrentTab('dashboard')}
          />
        )}
      </main>

      {/* Production Form Modal */}
      <ProductionFormModal
        isOpen={isProdModalOpen}
        onClose={() => setIsProdModalOpen(false)}
        onSave={handleSaveProduction}
        recordToEdit={prodToEdit}
      />

      {/* Dispatch Form Modal */}
      <DispatchFormModal
        isOpen={isDispModalOpen}
        onClose={() => setIsDispModalOpen(false)}
        onSave={handleSaveDispatch}
        recordToEdit={dispToEdit}
      />

      {/* Google Drive Browser & Reader Modal */}
      <DriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        accessToken={accessToken}
        onGoogleSignIn={handleGoogleSignIn}
        onImportData={handleImportData}
        currentProduction={production}
        currentDispatch={dispatch}
      />

      {/* Dedicated Print Report Modal (When triggered from buttons) */}
      {isPrintModalOpen && (
        <PrintReportView
          production={production}
          dispatch={dispatch}
          initialMode={printMode}
          initialMonthKey={printMonthKey}
          ticketToPrint={ticketToPrint}
          onClose={() => {
            setIsPrintModalOpen(false);
            setTicketToPrint(null);
          }}
        />
      )}

      {/* Confirmation Modal for Destructive Operations */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        isDanger={confirmConfig.isDanger}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
