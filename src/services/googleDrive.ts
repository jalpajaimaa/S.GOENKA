import * as XLSX from 'xlsx';
import type { DriveFileInfo, ProductionRecord, DispatchRecord } from '../types';

export async function searchDriveFiles(
  accessToken: string,
  searchQuery = '2026-027 Mines Crusher Pushpendra'
): Promise<DriveFileInfo[]> {
  const queryTerms = searchQuery
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `name contains '${term.replace(/'/g, "\\'")}'`)
    .join(' or ');

  // Look for spreadsheets, csv, xlsx, or matching names
  const q = queryTerms
    ? `trashed = false and (${queryTerms} or mimeType = 'application/vnd.google-apps.spreadsheet' or name contains 'Mines' or name contains 'Crusher')`
    : `trashed = false and (mimeType = 'application/vnd.google-apps.spreadsheet' or name contains 'Mines' or name contains 'Crusher' or name contains 'Report')`;

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id, name, mimeType, modifiedTime, size, webViewLink)');
  url.searchParams.set('pageSize', '25');
  url.searchParams.set('orderBy', 'modifiedTime desc');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive search failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return (data.files || []) as DriveFileInfo[];
}

export async function readDriveFile(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<{
  productionRecords: Partial<ProductionRecord>[];
  dispatchRecords: Partial<DispatchRecord>[];
  rawRows: Record<string, unknown>[];
  fileName?: string;
}> {
  let arrayBuffer: ArrayBuffer;

  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    // Export Google Sheet as XLSX
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      // Fallback export as CSV
      const csvUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
      const csvRes = await fetch(csvUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!csvRes.ok) throw new Error('Could not export Google Sheet');
      arrayBuffer = await csvRes.arrayBuffer();
    } else {
      arrayBuffer = await res.arrayBuffer();
    }
  } else {
    // Direct file download (alt=media)
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Could not download file content: ${res.statusText}`);
    arrayBuffer = await res.arrayBuffer();
  }

  // Parse with SheetJS
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  
  const allProduction: Partial<ProductionRecord>[] = [];
  const allDispatch: Partial<DispatchRecord>[] = [];
  let rawRows: Record<string, unknown>[] = [];

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    rawRows = [...rawRows, ...rows];

    // Detect if this sheet contains production data or dispatch data
    const isDispatch =
      sheetName.toLowerCase().includes('dispatch') ||
      sheetName.toLowerCase().includes('sales') ||
      sheetName.toLowerCase().includes('challan') ||
      rows.some((r) => 'vehicle' in r || 'challan' in r || 'customer' in r || 'gross' in r);

    for (const [idx, row] of rows.entries()) {
      const keys = Object.keys(row).map((k) => k.toLowerCase().trim());
      
      const findVal = (terms: string[]) => {
        for (const term of terms) {
          const matchKey = Object.keys(row).find((k) =>
            k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(term)
          );
          if (matchKey && row[matchKey] !== undefined && row[matchKey] !== '') {
            return row[matchKey];
          }
        }
        return undefined;
      };

      if (isDispatch) {
        const gross = Number(findVal(['gross', 'grosswt', 'grossweight']) || 0);
        const tare = Number(findVal(['tare', 'tarewt', 'tareweight']) || 0);
        const net = Number(findVal(['net', 'netwt', 'weight', 'qty', 'tons']) || (gross > tare ? gross - tare : 0));
        const rate = Number(findVal(['rate', 'price', 'rateperton']) || 450);

        allDispatch.push({
          id: `imp-disp-${fileId.slice(0, 5)}-${idx}-${Date.now()}`,
          challanNo: String(findVal(['challan', 'ticket', 'gatepass', 'invoiceno']) || `CH-2026-${String(idx + 100).padStart(4, '0')}`),
          date: String(findVal(['date', 'challandate']) || new Date().toISOString().split('T')[0]),
          time: String(findVal(['time']) || '10:00'),
          vehicleNo: String(findVal(['vehicle', 'truck', 'tipper', 'dumper']) || 'RJ-14-GA-9000'),
          customerName: String(findVal(['customer', 'party', 'client', 'buyer']) || 'Local Infra Partner'),
          material: (String(findVal(['material', 'item', 'product', 'size']) || '20mm') as any),
          grossWeight: gross,
          tareWeight: tare,
          netWeight: net,
          ratePerTon: rate,
          totalAmount: net * rate,
          royaltyPassNo: String(findVal(['royalty', 'epass', 'passno']) || 'ROYALTY-PAID'),
          paymentMode: 'Credit',
          supervisor: String(findVal(['supervisor', 'incharge']) || 'Pushpendra'),
          status: 'Completed',
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Production sheet
        const rom = Number(findVal(['rom', 'boulder', 'feed', 'fedtons', 'rawstone']) || 0);
        const p10 = Number(findVal(['10mm', 'gitti10', 'agg10']) || 0);
        const p20 = Number(findVal(['20mm', 'gitti20', 'agg20']) || 0);
        const p40 = Number(findVal(['40mm', 'gitti40', 'agg40']) || 0);
        const gsb = Number(findVal(['gsb', 'subbase']) || 0);
        const dust = Number(findVal(['dust', 'msand', 'sand']) || 0);
        const ballast = Number(findVal(['ballast', '65mm']) || 0);
        const total = p10 + p20 + p40 + gsb + dust + ballast || rom * 0.95;

        allProduction.push({
          id: `imp-prod-${fileId.slice(0, 5)}-${idx}-${Date.now()}`,
          date: String(findVal(['date']) || new Date().toISOString().split('T')[0]),
          shift: (String(findVal(['shift']) || 'Day') as any),
          supervisor: String(findVal(['supervisor', 'incharge', 'manager']) || 'Pushpendra'),
          quarryBench: String(findVal(['bench', 'pit', 'face', 'location']) || 'Bench-1 Mining Block'),
          romFedTons: rom || total,
          operatingHours: Number(findVal(['operatinghours', 'hours', 'runhours']) || 8),
          breakdownHours: Number(findVal(['breakdown', 'downtime', 'idle']) || 0),
          downtimeReason: String(findVal(['reason', 'remarks']) || ''),
          aggregate10mm: p10,
          aggregate20mm: p20,
          aggregate40mm: p40,
          gsb,
          stoneDust: dust,
          ballast65mm: ballast,
          wasteReject: Number(findVal(['reject', 'waste', 'scalping']) || 0),
          totalProduction: total,
          recoveryPercent: rom > 0 ? (total / rom) * 100 : 96.5,
          dieselLiters: Number(findVal(['diesel', 'fuel', 'hsd']) || 120),
          electricityKwh: Number(findVal(['power', 'electricity', 'units', 'kwh']) || 450),
          remarks: String(findVal(['remarks', 'note']) || 'Imported from Drive 2026-027 Mines Report'),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  return {
    productionRecords: allProduction,
    dispatchRecords: allDispatch,
    rawRows,
  };
}

export async function exportReportToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType = 'text/csv'
): Promise<{ fileId: string; webViewLink?: string }> {
  const metadata = {
    name: fileName,
    mimeType,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload to Google Drive (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return {
    fileId: result.id,
    webViewLink: result.webViewLink,
  };
}
