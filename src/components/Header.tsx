import React from 'react';
import type { User } from 'firebase/auth';
import {
  HardHat,
  Cloud,
  Printer,
  Calendar,
  Layers,
  Truck,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'production' | 'dispatch' | 'summaries' | 'print';
  setCurrentTab: (tab: 'dashboard' | 'production' | 'dispatch' | 'summaries' | 'print') => void;
  user: User | null;
  hasDriveToken: boolean;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onOpenDriveModal: () => void;
  onResetData: () => void;
  totalProduction: number;
  totalDispatched: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  hasDriveToken,
  onGoogleSignIn,
  onSignOut,
  onOpenDriveModal,
  onResetData,
  totalProduction,
  totalDispatched,
}) => {
  return (
    <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40 text-zinc-100 shadow-md">
      {/* Top Banner with Industrial Branding & Auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <HardHat className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Report 2026-027
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  Incharge: Pushpendra
                </span>
                <span className="text-xs font-mono text-zinc-400 hidden sm:inline">FY 2026-27</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
                S.GOENKA LIME &amp; CHEMICALS LTD.
              </h1>
              <p className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-2">
                <span>Station Road, Katni - 483501</span>
                <span className="hidden sm:inline">&bull;</span>
                <span className="text-zinc-300 font-mono">Mob: 7470710385</span>
                <span className="hidden sm:inline">&bull;</span>
                <span className="text-amber-400/90">sgoenkalime@gmail.com</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Crushed</span>
                <span className="font-bold text-amber-400 font-mono">{totalProduction.toLocaleString()} MT</span>
              </div>
              <div className="w-px h-6 bg-zinc-800" />
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Dispatched</span>
                <span className="font-bold text-emerald-400 font-mono">{totalDispatched.toLocaleString()} MT</span>
              </div>
            </div>

            {/* Google Drive Status & Trigger */}
            <button
              onClick={onOpenDriveModal}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border transition shadow-xs ${
                hasDriveToken
                  ? 'bg-blue-950/60 border-blue-500/40 text-blue-200 hover:bg-blue-900/60'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Search and read files from Google Drive"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span>Drive: Read 2026-027</span>
              {hasDriveToken && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Google Sign In / Profile */}
            {user ? (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="max-w-[100px] truncate text-zinc-300 text-xs" title={user.email || ''}>
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={onSignOut}
                  className="p-1 text-zinc-400 hover:text-red-400 rounded transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 transition shadow-sm"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}

            <button
              onClick={onResetData}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
              title="Reset to 2026-027 Pushpendra Seed Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-3 pt-2.5 border-t border-zinc-850 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Dashboard &amp; Overview</span>
          </button>

          <button
            onClick={() => setCurrentTab('production')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              currentTab === 'production'
                ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>Daily Crushing (CRUD)</span>
          </button>

          <button
            onClick={() => setCurrentTab('dispatch')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              currentTab === 'dispatch'
                ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Weighbridge Dispatches (CRUD)</span>
          </button>

          <button
            onClick={() => setCurrentTab('summaries')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              currentTab === 'summaries'
                ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Monthly &amp; Yearly Summaries</span>
          </button>

          <button
            onClick={() => setCurrentTab('print')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              currentTab === 'print'
                ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
