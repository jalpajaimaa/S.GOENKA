import type {
  ProductionRecord,
  DispatchRecord,
  MonthlySummaryData,
  YearlySummaryData,
} from '../types';
import { INITIAL_PRODUCTION_RECORDS, INITIAL_DISPATCH_RECORDS } from '../data/seedData';

const PROD_KEY = 'mines_crusher_production_v1';
const DISP_KEY = 'mines_crusher_dispatch_v1';

export function loadProductionRecords(): ProductionRecord[] {
  try {
    const raw = localStorage.getItem(PROD_KEY);
    if (!raw) {
      saveProductionRecords(INITIAL_PRODUCTION_RECORDS);
      return INITIAL_PRODUCTION_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTION_RECORDS;
  } catch (err) {
    console.error('Failed to load production records from localStorage:', err);
    return INITIAL_PRODUCTION_RECORDS;
  }
}

export function saveProductionRecords(records: ProductionRecord[]) {
  try {
    localStorage.setItem(PROD_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save production records:', err);
  }
}

export function loadDispatchRecords(): DispatchRecord[] {
  try {
    const raw = localStorage.getItem(DISP_KEY);
    if (!raw) {
      saveDispatchRecords(INITIAL_DISPATCH_RECORDS);
      return INITIAL_DISPATCH_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DISPATCH_RECORDS;
  } catch (err) {
    console.error('Failed to load dispatch records from localStorage:', err);
    return INITIAL_DISPATCH_RECORDS;
  }
}

export function saveDispatchRecords(records: DispatchRecord[]) {
  try {
    localStorage.setItem(DISP_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save dispatch records:', err);
  }
}

export function resetToSeedData() {
  saveProductionRecords(INITIAL_PRODUCTION_RECORDS);
  saveDispatchRecords(INITIAL_DISPATCH_RECORDS);
  return {
    production: INITIAL_PRODUCTION_RECORDS,
    dispatch: INITIAL_DISPATCH_RECORDS,
  };
}

export function computeMonthlySummaries(
  production: ProductionRecord[],
  dispatch: DispatchRecord[]
): MonthlySummaryData[] {
  // Collect all month keys YYYY-MM
  const monthMap = new Map<
    string,
    {
      production: ProductionRecord[];
      dispatch: DispatchRecord[];
    }
  >();

  for (const p of production) {
    const m = p.date.substring(0, 7);
    if (!monthMap.has(m)) monthMap.set(m, { production: [], dispatch: [] });
    monthMap.get(m)!.production.push(p);
  }

  for (const d of dispatch) {
    const m = d.date.substring(0, 7);
    if (!monthMap.has(m)) monthMap.set(m, { production: [], dispatch: [] });
    monthMap.get(m)!.dispatch.push(d);
  }

  // Sort months chronologically
  const sortedMonths = Array.from(monthMap.keys()).sort();

  return sortedMonths.map((mKey) => {
    const entry = monthMap.get(mKey)!;
    const pList = entry.production;
    const dList = entry.dispatch;

    const uniqueDays = new Set(pList.map((p) => p.date)).size;
    const totalRomFed = pList.reduce((acc, curr) => acc + (curr.romFedTons || 0), 0);
    const totalOpHours = pList.reduce((acc, curr) => acc + (curr.operatingHours || 0), 0);
    const totalBdHours = pList.reduce((acc, curr) => acc + (curr.breakdownHours || 0), 0);

    const prod10mm = pList.reduce((acc, curr) => acc + (curr.aggregate10mm || 0), 0);
    const prod20mm = pList.reduce((acc, curr) => acc + (curr.aggregate20mm || 0), 0);
    const prod40mm = pList.reduce((acc, curr) => acc + (curr.aggregate40mm || 0), 0);
    const prodGsb = pList.reduce((acc, curr) => acc + (curr.gsb || 0), 0);
    const prodDust = pList.reduce((acc, curr) => acc + (curr.stoneDust || 0), 0);
    const prodBallast = pList.reduce((acc, curr) => acc + (curr.ballast65mm || 0), 0);
    const totalProduction = pList.reduce((acc, curr) => acc + (curr.totalProduction || 0), 0);

    const totalDispatched = dList.reduce((acc, curr) => acc + (curr.netWeight || 0), 0);
    const dispatchAmount = dList.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    const totalDiesel = pList.reduce((acc, curr) => acc + (curr.dieselLiters || 0), 0);
    const totalPowerKwh = pList.reduce((acc, curr) => acc + (curr.electricityKwh || 0), 0);

    const [yr, mn] = mKey.split('-');
    const dateObj = new Date(Number(yr), Number(mn) - 1, 1);
    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

    return {
      monthKey: mKey,
      monthName,
      operatingDays: uniqueDays,
      totalRomFed,
      totalOperatingHours: totalOpHours,
      totalBreakdownHours: totalBdHours,
      avgTph: totalOpHours > 0 ? Number((totalRomFed / totalOpHours).toFixed(1)) : 0,
      totalProduction,
      prod10mm,
      prod20mm,
      prod40mm,
      prodGsb,
      prodDust,
      prodBallast,
      totalDispatched: Number(totalDispatched.toFixed(1)),
      dispatchAmount: Math.round(dispatchAmount),
      totalDiesel,
      dieselPerTon: totalProduction > 0 ? Number((totalDiesel / totalProduction).toFixed(2)) : 0,
      totalPowerKwh,
      powerPerTon: totalProduction > 0 ? Number((totalPowerKwh / totalProduction).toFixed(2)) : 0,
    };
  });
}

export function computeYearlySummary(
  monthlySummaries: MonthlySummaryData[],
  fiscalYear = '2026-027'
): YearlySummaryData {
  const totalRomFed = monthlySummaries.reduce((acc, m) => acc + m.totalRomFed, 0);
  const totalProduction = monthlySummaries.reduce((acc, m) => acc + m.totalProduction, 0);
  const totalDispatched = monthlySummaries.reduce((acc, m) => acc + m.totalDispatched, 0);
  const totalRevenue = monthlySummaries.reduce((acc, m) => acc + m.dispatchAmount, 0);
  const totalDiesel = monthlySummaries.reduce((acc, m) => acc + m.totalDiesel, 0);
  const totalElectricity = monthlySummaries.reduce((acc, m) => acc + m.totalPowerKwh, 0);
  const totalHours = monthlySummaries.reduce((acc, m) => acc + m.totalOperatingHours, 0);

  const avgRecoveryPercent = totalRomFed > 0 ? Number(((totalProduction / totalRomFed) * 100).toFixed(1)) : 0;
  const avgTph = totalHours > 0 ? Number((totalRomFed / totalHours).toFixed(1)) : 0;

  // Approximate starting stock of 450 MT
  const initialStock = 450;
  const closingStockEstimate = Number((initialStock + totalProduction - totalDispatched).toFixed(1));

  return {
    year: 2026,
    fiscalYear,
    months: monthlySummaries,
    totalRomFed,
    totalProduction,
    totalDispatched,
    totalRevenue,
    totalDiesel,
    totalElectricity,
    avgRecoveryPercent,
    avgTph,
    closingStockEstimate,
  };
}
