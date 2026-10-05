export type ShiftType = 'Day' | 'Night' | 'General';

export interface ProductionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  supervisor: string; // e.g. "Pushpendra"
  quarryBench: string; // e.g. "Bench-3 North Face"
  romFedTons: number; // Raw boulder / ROM fed into primary jaw
  operatingHours: number;
  breakdownHours: number;
  downtimeReason?: string;
  // Product outputs in Metric Tons
  aggregate10mm: number;
  aggregate20mm: number;
  aggregate40mm: number;
  gsb: number; // Granular Sub Base
  stoneDust: number; // M-sand / stone dust
  ballast65mm: number; // 65mm railway/heavy aggregate
  wasteReject: number; // Scalping / overburden reject
  totalProduction: number; // sum of aggregates
  recoveryPercent: number; // (totalProduction / romFedTons) * 100
  // Utilities & Energy
  dieselLiters: number;
  electricityKwh: number;
  blastingHoles?: number;
  explosiveKg?: number;
  equipmentLogs?: string;
  remarks?: string;
  updatedAt: string;
}

export type MaterialType = '10mm' | '20mm' | '40mm' | 'GSB' | 'Stone Dust' | '65mm Ballast' | 'Boulder ROM';

export interface DispatchRecord {
  id: string;
  challanNo: string; // e.g. "CH-2026-0128"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  vehicleNo: string; // e.g. "RJ-14-GA-9421"
  customerName: string;
  material: MaterialType;
  grossWeight: number; // MT
  tareWeight: number; // MT
  netWeight: number; // MT
  ratePerTon: number; // INR or currency unit
  totalAmount: number; // netWeight * ratePerTon
  royaltyPassNo: string; // e.g. "E-PASS-2026-9812"
  paymentMode: 'Credit' | 'Cash' | 'Bank Transfer' | 'Advance';
  supervisor: string; // e.g. "Pushpendra"
  destination?: string;
  status: 'Completed' | 'Pending Weight' | 'Cancelled';
  updatedAt: string;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export interface MonthlySummaryData {
  monthKey: string; // YYYY-MM
  monthName: string;
  operatingDays: number;
  totalRomFed: number;
  totalOperatingHours: number;
  totalBreakdownHours: number;
  avgTph: number; // Tons per hour
  totalProduction: number;
  prod10mm: number;
  prod20mm: number;
  prod40mm: number;
  prodGsb: number;
  prodDust: number;
  prodBallast: number;
  totalDispatched: number;
  dispatchAmount: number;
  totalDiesel: number;
  dieselPerTon: number; // Liters / ton
  totalPowerKwh: number;
  powerPerTon: number; // kWh / ton
}

export interface YearlySummaryData {
  year: number; // e.g. 2026
  fiscalYear: string; // e.g. "2026-027"
  months: MonthlySummaryData[];
  totalRomFed: number;
  totalProduction: number;
  totalDispatched: number;
  totalRevenue: number;
  totalDiesel: number;
  totalElectricity: number;
  avgRecoveryPercent: number;
  avgTph: number;
  closingStockEstimate: number;
}
