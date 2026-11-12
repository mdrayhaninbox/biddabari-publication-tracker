import ExcelJS from 'exceljs';
import { 
  BookRecord, 
  PressPaymentRecord, 
  PressOrderRecord, 
  PressDeliveryRecord, 
  ChannelCollectionRecord, 
  ChannelConfig 
} from '../types/book';
import { 
  calculateBookMetrics, 
  calculatePressAccounts, 
  calculateChannelDueAccounts 
} from './calculations';
import { Language, tr } from './i18n';
import { PrintScope } from '../components/PrintableReport';

export interface ExcelReportOptions {
  books: BookRecord[];
  allBooksCount: number;
  reportTitle: string;
  periodTitle: string;
  currentDate: string;
  language: Language;
  channels: ChannelConfig[];
  pressPayments: PressPaymentRecord[];
  pressOrders: PressOrderRecord[];
  pressDeliveries: PressDeliveryRecord[];
  channelCollections: ChannelCollectionRecord[];
  salesMode?: 'all' | 'online' | 'offline' | 'none';
  includePressAccounts?: boolean;
  includePressPayments?: boolean;
  includeOnlineDue?: boolean;
  includeOfflineDue?: boolean;
  includeSignatures?: boolean;
  scope?: PrintScope;
}

// Color palette matching Royal Navy theme and executive documents
const NAVY_MAIN = '1E3A8A';       // #1e3a8a
const NAVY_DARK = '0F172A';       // #0f172a
const NAVY_LIGHT = '2563EB';      // #2563eb
const NAVY_BG = 'EFF6FF';         // #eff6ff
const ZEBRA_ROW = 'F8FAFC';       // #f8fafc
const TOTAL_ROW_BG = 'E2E8F0';    // #e2e8f0
const EMERALD_MAIN = '059669';    // #059669
const EMERALD_BG = 'ECFDF5';      // #ecfdf5
const BORDER_COLOR = 'CBD5E1';    // #cbd5e1

// Border helpers
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BORDER_COLOR } },
  left: { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
  right: { style: 'thin', color: { argb: BORDER_COLOR } },
};

const totalRowBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: NAVY_DARK } },
  left: { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'double', color: { argb: NAVY_DARK } },
  right: { style: 'thin', color: { argb: BORDER_COLOR } },
};

// Formats
const FMT_CURRENCY = '"৳"#,##0';
const FMT_CURRENCY_DECIMAL = '"৳"#,##0.00';
const FMT_QTY = '#,##0';
const FMT_PERCENT = '0.0%';

/**
 * Auto-adjust column widths based on maximum string length in each column
 */
function autoFitColumns(worksheet: ExcelJS.Worksheet, minWidth = 12) {
  worksheet.columns.forEach((column) => {
    let maxLen = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      // Ignore merged banners spanning many columns
      if (Number(cell.row) <= 4) return;
      const val = cell.value;
      let text = '';
      if (typeof val === 'string') text = val;
      else if (typeof val === 'number') text = val.toLocaleString();
      else if (typeof val === 'object' && val && 'result' in val) {
        text = String((val as { result?: unknown }).result || '');
      }
      if (text.length > maxLen) maxLen = text.length;
    });
    column.width = Math.max(maxLen + 3, minWidth);
  });
}

/**
 * Adds official publication header banner (Rows 1 to 4)
 */
function addPublicationHeader(
  ws: ExcelJS.Worksheet,
  title: string,
  periodTitle: string,
  currentDate: string,
  endColLetter: string,
  language: Language
) {
  // Row 1: Company Name
  ws.mergeCells(`A1:${endColLetter}1`);
  const r1 = ws.getCell('A1');
  r1.value = tr('বিদ্যাবাড়ি পাবলিকেশন (Biddabari Publication)', 'Biddabari Publication', language);
  r1.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  r1.alignment = { vertical: 'middle', horizontal: 'center' };
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MAIN } };
  ws.getRow(1).height = 36;

  // Row 2: Sub-title & Office Info
  ws.mergeCells(`A2:${endColLetter}2`);
  const r2 = ws.getCell('A2');
  r2.value = tr(
    'প্রধান কার্যালয়, ঢাকা • বুক পাবলিকেশন অ্যান্ড ডিস্ট্রিবিউশন ডিপার্টমেন্ট',
    'Head Office, Dhaka • Book Publication & Distribution Department',
    language
  );
  r2.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FFFFFF' } };
  r2.alignment = { vertical: 'middle', horizontal: 'center' };
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_LIGHT } };
  ws.getRow(2).height = 20;

  // Row 3: Report Scope Title
  ws.mergeCells(`A3:${endColLetter}3`);
  const r3 = ws.getCell('A3');
  r3.value = title;
  r3.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: NAVY_DARK } };
  r3.alignment = { vertical: 'middle', horizontal: 'center' };
  r3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  ws.getRow(3).height = 24;

  // Row 4: Period & Generation Date
  ws.mergeCells(`A4:${endColLetter}4`);
  const r4 = ws.getCell('A4');
  r4.value = `${tr('রিপোর্টের সময়কাল:', 'Period:', language)} ${periodTitle}   |   ${tr('প্রস্তুতের তারিখ:', 'Report Date:', language)} ${currentDate}`;
  r4.font = { name: 'Segoe UI', size: 10, color: { argb: '475569' } };
  r4.alignment = { vertical: 'middle', horizontal: 'center' };
  r4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
  ws.getRow(4).height = 20;

  ws.getRow(5).height = 12; // Empty spacer row
}

/**
 * Appends 3 official signature blocks at the end of a worksheet
 */
function appendSignatures(
  ws: ExcelJS.Worksheet,
  startRow: number,
  sign1Col: string,
  sign2Col: string,
  sign3Col: string,
  language: Language
) {
  const rHeader = startRow + 2;
  const rLine = startRow + 5;
  const rTitle = startRow + 6;
  const rDept = startRow + 7;

  // Signature Section Header
  ws.getCell(`A${rHeader}`).value = tr('অফিসিয়াল অনুমোদন ও যাচাইকরণ স্বাক্ষর:', 'Official Verification & Approval Signatures:', language);
  ws.getCell(`A${rHeader}`).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: NAVY_DARK } };

  // Signature lines
  const cols = [
    {
      col: sign1Col,
      title: tr('প্রস্তুতকারী কর্মকর্তা', 'Prepared By', language),
      dept: tr('বিদ্যাবাড়ি পাবলিকেশন শাখা', 'Biddabari Publication Dept.', language),
    },
    {
      col: sign2Col,
      title: tr('হিসাবরক্ষণ কর্মকর্তা', 'Accounts Officer', language),
      dept: tr('অ্যাকাউন্টিং অ্যান্ড ফিন্যান্স', 'Accounting & Finance Dept.', language),
    },
    {
      col: sign3Col,
      title: tr('অনুমোদনকারী / পরিচালক', 'Authorized Executive / Director', language),
      dept: tr('বিদ্যাবাড়ি পাবলিকেশন ঢাকা', 'Biddabari Publication Dhaka', language),
    },
  ];

  cols.forEach(({ col, title, dept }) => {
    const cLine = ws.getCell(`${col}${rLine}`);
    cLine.value = '_______________________________';
    cLine.font = { name: 'Segoe UI', size: 10, color: { argb: '94A3B8' } };
    cLine.alignment = { horizontal: 'center' };

    const cTitle = ws.getCell(`${col}${rTitle}`);
    cTitle.value = title;
    cTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: NAVY_DARK } };
    cTitle.alignment = { horizontal: 'center' };

    const cDept = ws.getCell(`${col}${rDept}`);
    cDept.value = dept;
    cDept.font = { name: 'Segoe UI', size: 9, color: { argb: '64748B' } };
    cDept.alignment = { horizontal: 'center' };
  });

  return rDept + 2;
}

/**
 * Main Report Exporter: Generates executive formatted Excel workbook with live formulas
 */
export async function exportReportToExcel(options: ExcelReportOptions): Promise<void> {
  const {
    books,
    reportTitle,
    periodTitle,
    currentDate,
    language,
    channels,
    pressPayments,
    pressOrders,
    channelCollections,
    scope = 'all',
  } = options;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Biddabari Publication System';
  wb.created = new Date();

  const pressAccounts = calculatePressAccounts(books, pressPayments, pressOrders);
  const channelAccounts = calculateChannelDueAccounts(books, channelCollections, channels);

  // ====================================================================
  // SPECIAL FLOW 1: Press Payment Vouchers Scope (10/page formatting)
  // ====================================================================
  if (scope === 'press_vouchers') {
    const ws = wb.addWorksheet(tr('প্রেস পেমেন্ট ভাউচার', 'Press Payment Vouchers', language), {
      properties: { tabColor: { argb: NAVY_MAIN } },
      views: [{ state: 'frozen', ySplit: 6 }],
    });

    addPublicationHeader(ws, reportTitle, periodTitle, currentDate, 'G', language);

    // Summary Card Box (Row 6)
    ws.getCell('A6').value = tr('মোট পেমেন্ট ভাউচার:', 'Total Payment Vouchers:', language);
    ws.getCell('B6').value = `${pressPayments.length} ${tr('টি', '', language)}`;
    ws.getCell('B6').font = { bold: true, color: { argb: NAVY_MAIN } };

    ws.getCell('E6').value = tr('মোট পরিশোধিত টাকা:', 'Total Paid Amount:', language);
    ws.getCell('F6').value = { formula: pressPayments.length > 0 ? `SUM(G8:G${7 + pressPayments.length})` : '0', result: pressAccounts.totalPaidToPress };
    ws.getCell('F6').numFmt = FMT_CURRENCY;
    ws.getCell('F6').font = { bold: true, color: { argb: NAVY_MAIN } };

    // Headers (Row 7)
    const headers = [
      tr('ক্রমিক', 'SL', language),
      tr('তারিখ', 'Date', language),
      tr('ভাউচার নং', 'Voucher No', language),
      tr('খাত / বইয়ের নাম ও সংস্করণ', 'Category / Book & Edition', language),
      tr('মাধ্যম', 'Method', language),
      tr('বিবরণ ও রেফারেন্স', 'Notes & Ref', language),
      tr('টাকার পরিমাণ (৳)', 'Amount (BDT)', language),
    ];

    const hRow = ws.getRow(7);
    headers.forEach((h, idx) => {
      const cell = hRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MAIN } };
      cell.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 1 || idx === 2 || idx === 4 ? 'center' : idx === 6 ? 'right' : 'left' };
      cell.border = thinBorder;
    });
    hRow.height = 26;

    let curRow = 8;
    pressPayments.forEach((p, idx) => {
      const row = ws.getRow(curRow);
      const isEven = idx % 2 === 0;
      const bg = isEven ? ZEBRA_ROW : 'FFFFFF';

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = p.date;
      row.getCell(3).value = p.voucherNo || `VCH-${idx + 1}`;
      row.getCell(4).value = p.bookName || tr('সার্বিক প্রেস অর্ডার বাবদ', 'General Press Order', language);
      row.getCell(5).value = p.paymentMethod.toUpperCase();
      row.getCell(6).value = p.notes || '—';
      row.getCell(7).value = p.amount;
      row.getCell(7).numFmt = FMT_CURRENCY;

      for (let c = 1; c <= 7; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Segoe UI', size: 9.5 };
        cell.border = thinBorder;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = { vertical: 'middle', horizontal: c === 1 || c === 2 || c === 3 || c === 5 ? 'center' : c === 7 ? 'right' : 'left' };
      }
      row.height = 22;
      curRow++;
    });

    // Grand Total Row
    const totRow = ws.getRow(curRow);
    totRow.getCell(1).value = '';
    totRow.getCell(6).value = tr('সর্বমোট প্রেস পরিশোধ (Grand Total):', 'Grand Total Paid:', language);
    totRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    totRow.getCell(6).font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: NAVY_DARK } };

    const totCell = totRow.getCell(7);
    totCell.value = {
      formula: curRow > 8 ? `SUM(G8:G${curRow - 1})` : '0',
      result: pressAccounts.totalPaidToPress,
    };
    totCell.numFmt = FMT_CURRENCY;
    totCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: NAVY_MAIN } };
    totCell.alignment = { horizontal: 'right', vertical: 'middle' };

    for (let c = 1; c <= 7; c++) {
      totRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_ROW_BG } };
      totRow.getCell(c).border = totalRowBorder;
    }
    totRow.height = 26;

    // Signatures
    appendSignatures(ws, curRow + 2, 'B', 'D', 'F', language);
    autoFitColumns(ws, 14);

    return saveWorkbook(wb, `Biddabari_Press_Vouchers_${periodTitle}`);
  }

  // ====================================================================
  // SPECIAL FLOW 2: Channel Collection Vouchers Scope (10/page formatting)
  // ====================================================================
  if (scope === 'collection_vouchers') {
    const ws = wb.addWorksheet(tr('আদায় ভাউচার ও মানি রিসিট', 'Collection Receipts', language), {
      properties: { tabColor: { argb: EMERALD_MAIN } },
      views: [{ state: 'frozen', ySplit: 6 }],
    });

    addPublicationHeader(ws, reportTitle, periodTitle, currentDate, 'G', language);

    // Summary Card Box (Row 6)
    ws.getCell('A6').value = tr('মোট মানি রিসিট সংখ্যা:', 'Total Collection Receipts:', language);
    ws.getCell('B6').value = `${channelCollections.length} ${tr('টি', '', language)}`;
    ws.getCell('B6').font = { bold: true, color: { argb: EMERALD_MAIN } };

    ws.getCell('E6').value = tr('মোট সংগৃহীত টাকা:', 'Total Collected Amount:', language);
    ws.getCell('F6').value = { formula: channelCollections.length > 0 ? `SUM(G8:G${7 + channelCollections.length})` : '0', result: channelAccounts.totalCollected };
    ws.getCell('F6').numFmt = FMT_CURRENCY;
    ws.getCell('F6').font = { bold: true, color: { argb: EMERALD_MAIN } };

    // Headers (Row 7)
    const headers = [
      tr('ক্রমিক', 'SL', language),
      tr('তারিখ', 'Date', language),
      tr('মানি রিসিট নং', 'Receipt No', language),
      tr('চ্যানেল / লাইব্রেরির নাম', 'Channel / Library Name', language),
      tr('মাধ্যম', 'Method', language),
      tr('বিবরণ ও রেফারেন্স', 'Notes & Ref', language),
      tr('আদায়কৃত টাকা (৳)', 'Amount (BDT)', language),
    ];

    const hRow = ws.getRow(7);
    headers.forEach((h, idx) => {
      const cell = hRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD_MAIN } };
      cell.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 1 || idx === 2 || idx === 4 ? 'center' : idx === 6 ? 'right' : 'left' };
      cell.border = thinBorder;
    });
    hRow.height = 26;

    let curRow = 8;
    channelCollections.forEach((c, idx) => {
      const row = ws.getRow(curRow);
      const isEven = idx % 2 === 0;
      const bg = isEven ? ZEBRA_ROW : 'FFFFFF';

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = c.date;
      row.getCell(3).value = c.receiptNo || `MR-${idx + 1}`;
      row.getCell(4).value = c.channelName;
      row.getCell(5).value = c.paymentMethod.toUpperCase();
      row.getCell(6).value = c.notes || '—';
      row.getCell(7).value = c.amount;
      row.getCell(7).numFmt = FMT_CURRENCY;

      for (let col = 1; col <= 7; col++) {
        const cell = row.getCell(col);
        cell.font = { name: 'Segoe UI', size: 9.5 };
        cell.border = thinBorder;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = { vertical: 'middle', horizontal: col === 1 || col === 2 || col === 3 || col === 5 ? 'center' : col === 7 ? 'right' : 'left' };
      }
      row.height = 22;
      curRow++;
    });

    // Grand Total Row
    const totRow = ws.getRow(curRow);
    totRow.getCell(1).value = '';
    totRow.getCell(6).value = tr('সর্বমোট সংগৃহীত আদায় (Grand Total):', 'Grand Total Collected:', language);
    totRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    totRow.getCell(6).font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: NAVY_DARK } };

    const totCell = totRow.getCell(7);
    totCell.value = {
      formula: curRow > 8 ? `SUM(G8:G${curRow - 1})` : '0',
      result: channelAccounts.totalCollected,
    };
    totCell.numFmt = FMT_CURRENCY;
    totCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: EMERALD_MAIN } };
    totCell.alignment = { horizontal: 'right', vertical: 'middle' };

    for (let col = 1; col <= 7; col++) {
      totRow.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_ROW_BG } };
      totRow.getCell(col).border = totalRowBorder;
    }
    totRow.height = 26;

    // Signatures
    appendSignatures(ws, curRow + 2, 'B', 'D', 'F', language);
    autoFitColumns(ws, 14);

    return saveWorkbook(wb, `Biddabari_Collection_Vouchers_${periodTitle}`);
  }

  // ====================================================================
  // FULL EXECUTIVE REPORT: Multi-Tab Workbook with Rich Dynamic Formulas
  // ====================================================================

  // --------------------------------------------------------------------
  // SHEET 1: Book Sales, Stock Inventory & Profit Ledger
  // --------------------------------------------------------------------
  const wsBooks = wb.addWorksheet(tr('বই বিক্রয় ও লাভ খতিয়ান', 'Book Sales & Profits', language), {
    properties: { tabColor: { argb: NAVY_MAIN } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 10 }],
  });

  const lastColLetter = 'AA';
  addPublicationHeader(wsBooks, reportTitle, periodTitle, currentDate, lastColLetter, language);

  // Executive KPI summary row (Row 6 & 7)
  const kpiData = [
    { label: tr('মোট বই সংখ্যা', 'Total Books', language), cell: 'B7', val: books.length, fmt: FMT_QTY },
    { label: tr('প্রেস অর্ডার (কপি)', 'Total Order (Cps)', language), cell: 'E7', formula: `SUM(G11:G${10 + books.length})`, fmt: FMT_QTY },
    { label: tr('প্রাপ্ত চালান (কপি)', 'Received (Cps)', language), cell: 'I7', formula: `SUM(I11:I${10 + books.length})`, fmt: FMT_QTY },
    { label: tr('হেড অফিস বর্তমান স্টক', 'HO Current Stock', language), cell: 'K7', formula: `SUM(K11:K${10 + books.length})`, fmt: FMT_QTY },
    { label: tr('মোট বিক্রিত কপি', 'Total Sold Copies', language), cell: 'X7', formula: `SUM(X11:X${10 + books.length})`, fmt: FMT_QTY },
    { label: tr('মোট বিক্রয় রাজস্ব', 'Total Sales Revenue', language), cell: 'Y7', formula: `SUM(Y11:Y${10 + books.length})`, fmt: FMT_CURRENCY },
    { label: tr('মোট অর্জিত লাভ', 'Total Net Profit', language), cell: 'AA7', formula: `SUM(AA11:AA${10 + books.length})`, fmt: FMT_CURRENCY },
  ];

  kpiData.forEach(k => {
    const c = wsBooks.getCell(k.cell);
    if (k.formula) c.value = { formula: k.formula };
    else c.value = k.val;
    c.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: NAVY_MAIN } };
    c.numFmt = k.fmt;
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Table Column Headers (Row 10)
  const bookHeaders = [
    { key: 'A', name: tr('ক্রমিক', 'SL', language), align: 'center' },
    { key: 'B', name: tr('বইয়ের নাম', 'Book Name', language), align: 'left' },
    { key: 'C', name: tr('সংস্করণ', 'Edition', language), align: 'center' },
    { key: 'D', name: tr('প্রকাশের মাস', 'Publish Month', language), align: 'center' },
    { key: 'E', name: tr('বিক্রয় মূল্য (MRP)', 'MRP (BDT)', language), align: 'right' },
    { key: 'F', name: tr('ছাপার খরচ/কপি', 'Print Cost/Cp', language), align: 'right' },
    { key: 'G', name: tr('প্রেস অর্ডার কপি', 'Press Order Cps', language), align: 'right' },
    { key: 'H', name: tr('মোট প্রেস বিল (টাকা)', 'Total Press Bill', language), align: 'right' },
    { key: 'I', name: tr('প্রাপ্ত চালান কপি', 'Received Cps', language), align: 'right' },
    { key: 'J', name: tr('প্রাপ্ত চালান মূল্য', 'Received Value', language), align: 'right' },
    { key: 'K', name: tr('হেড অফিস স্টক', 'HO Stock', language), align: 'right' },
    { key: 'L', name: tr('প্রেসে অবশিষ্ট স্টক', 'Stock at Press', language), align: 'right' },
    { key: 'M', name: tr('অনলাইন-বইবাড়ি', 'Online-Boibari', language), align: 'right' },
    { key: 'N', name: tr('অনলাইন-রকমারি', 'Online-Rokomari', language), align: 'right' },
    { key: 'O', name: tr('অনলাইন-ওয়াফিলাইফ', 'Online-Wafilife', language), align: 'right' },
    { key: 'P', name: tr('অনলাইন-অন্যান্য', 'Online-Others', language), align: 'right' },
    { key: 'Q', name: tr('মোট অনলাইন বিক্রি', 'Total Online Sold', language), align: 'right' },
    { key: 'R', name: tr('অফলাইন-হেড অফিস', 'Offline-HO', language), align: 'right' },
    { key: 'S', name: tr('অফলাইন-নীলক্ষেত', 'Offline-Nilkhet', language), align: 'right' },
    { key: 'T', name: tr('অফলাইন-সুমনা', 'Offline-Sumona', language), align: 'right' },
    { key: 'U', name: tr('অফলাইন-প্রমিজ', 'Offline-Promise', language), align: 'right' },
    { key: 'V', name: tr('অফলাইন-জয়স্টার', 'Offline-Joystar', language), align: 'right' },
    { key: 'W', name: tr('মোট অফলাইন বিক্রি', 'Total Offline Sold', language), align: 'right' },
    { key: 'X', name: tr('মোট বিক্রিত কপি', 'Total Sold Copies', language), align: 'right' },
    { key: 'Y', name: tr('বিক্রয় রাজস্ব (টাকা)', 'Sales Revenue (BDT)', language), align: 'right' },
    { key: 'Z', name: tr('নিট লাভ/কপি', 'Profit/Copy', language), align: 'right' },
    { key: 'AA', name: tr('মোট অর্জিত লাভ', 'Total Profit (BDT)', language), align: 'right' },
  ];

  const headerRow = wsBooks.getRow(10);
  bookHeaders.forEach((bh, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = bh.name;
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MAIN } };
    cell.alignment = { vertical: 'middle', horizontal: bh.align as ExcelJS.Alignment['horizontal'] };
    cell.border = thinBorder;
  });
  headerRow.height = 28;

  // Book Data Rows with Live Formulas (Rows 11 to 10 + N)
  let curBookRow = 11;
  books.forEach((b, idx) => {
    const m = calculateBookMetrics(b);
    const r = curBookRow;
    const row = wsBooks.getRow(r);
    const isEven = idx % 2 === 0;
    const bg = isEven ? ZEBRA_ROW : 'FFFFFF';

    row.getCell(1).value = b.sl || idx + 1;
    row.getCell(2).value = b.bookName;
    row.getCell(3).value = b.edition || '1st Edition';
    row.getCell(4).value = b.publishMonth || '—';
    row.getCell(5).value = b.perBookAmount; // MRP
    row.getCell(5).numFmt = FMT_CURRENCY;
    row.getCell(6).value = b.printCostPerBook || 0;
    row.getCell(6).numFmt = FMT_CURRENCY;
    row.getCell(7).value = b.totalOrderFaridBhai || 0; // Order Copies
    row.getCell(7).numFmt = FMT_QTY;

    // Total Order Bill = Order Copies * Print Cost
    row.getCell(8).value = { formula: `G${r}*F${r}`, result: (b.totalOrderFaridBhai || 0) * (b.printCostPerBook || 0) };
    row.getCell(8).numFmt = FMT_CURRENCY;

    // Received Copies
    row.getCell(9).value = b.faridBhaiToHeadOffice || 0;
    row.getCell(9).numFmt = FMT_QTY;

    // Received Bill = Received Copies * Print Cost
    row.getCell(10).value = { formula: `I${r}*F${r}`, result: (b.faridBhaiToHeadOffice || 0) * (b.printCostPerBook || 0) };
    row.getCell(10).numFmt = FMT_CURRENCY;

    // Head Office Current Stock
    row.getCell(11).value = m.totalPresentStockHO;
    row.getCell(11).numFmt = FMT_QTY;

    // Press Stock = Order Copies - Received Copies
    row.getCell(12).value = { formula: `G${r}-I${r}`, result: m.stockToFaridBhai };
    row.getCell(12).numFmt = FMT_QTY;

    // Online channels
    row.getCell(13).value = m.boibariTotal;
    row.getCell(13).numFmt = FMT_QTY;
    row.getCell(14).value = m.rokomariTotal;
    row.getCell(14).numFmt = FMT_QTY;
    row.getCell(15).value = m.wafilifeTotal;
    row.getCell(15).numFmt = FMT_QTY;
    row.getCell(16).value = m.othersOnlineTotal;
    row.getCell(16).numFmt = FMT_QTY;

    // Total Online Sold = SUM(M:P)
    row.getCell(17).value = { formula: `SUM(M${r}:P${r})`, result: m.totalOnlineSell };
    row.getCell(17).numFmt = FMT_QTY;

    // Offline channels
    row.getCell(18).value = m.headOfficeOfflineTotal;
    row.getCell(18).numFmt = FMT_QTY;
    row.getCell(19).value = m.nilkhetTotal;
    row.getCell(19).numFmt = FMT_QTY;
    row.getCell(20).value = m.sumonaTotal;
    row.getCell(20).numFmt = FMT_QTY;
    row.getCell(21).value = m.promiseTotal;
    row.getCell(21).numFmt = FMT_QTY;
    row.getCell(22).value = m.joystarTotal;
    row.getCell(22).numFmt = FMT_QTY;

    // Total Offline Sold = SUM(R:V)
    row.getCell(23).value = { formula: `SUM(R${r}:V${r})`, result: m.totalOfflineSell };
    row.getCell(23).numFmt = FMT_QTY;

    // Total Sold = Online + Offline
    row.getCell(24).value = { formula: `Q${r}+W${r}`, result: m.totalSold };
    row.getCell(24).numFmt = FMT_QTY;

    // Sales Revenue = Total Sold * MRP
    row.getCell(25).value = { formula: `X${r}*E${r}`, result: m.totalRevenue };
    row.getCell(25).numFmt = FMT_CURRENCY;

    // Net Profit/Copy = MRP - Print Cost
    row.getCell(26).value = { formula: `E${r}-F${r}`, result: m.profitPerBook };
    row.getCell(26).numFmt = FMT_CURRENCY;

    // Total Net Profit = Total Sold * Profit/Copy
    row.getCell(27).value = { formula: `X${r}*Z${r}`, result: m.totalNetProfit };
    row.getCell(27).numFmt = FMT_CURRENCY;

    for (let c = 1; c <= 27; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.border = thinBorder;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: c === 1 || c === 3 || c === 4 ? 'center' : c === 2 ? 'left' : 'right',
      };
    }
    row.height = 22;
    curBookRow++;
  });

  // GRAND TOTAL ROW
  const totRowIndex = curBookRow;
  const totRow = wsBooks.getRow(totRowIndex);
  totRow.getCell(1).value = '';
  totRow.getCell(2).value = tr('সর্বমোট যোগফল (Grand Total):', 'Grand Total:', language);
  totRow.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: NAVY_DARK } };
  totRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };

  const startR = 11;
  const endR = totRowIndex - 1;

  // Formula mappings for Totals
  const colFormulaCols = [
    { col: 7, fmt: FMT_QTY },
    { col: 8, fmt: FMT_CURRENCY },
    { col: 9, fmt: FMT_QTY },
    { col: 10, fmt: FMT_CURRENCY },
    { col: 11, fmt: FMT_QTY },
    { col: 12, fmt: FMT_QTY },
    { col: 13, fmt: FMT_QTY },
    { col: 14, fmt: FMT_QTY },
    { col: 15, fmt: FMT_QTY },
    { col: 16, fmt: FMT_QTY },
    { col: 17, fmt: FMT_QTY },
    { col: 18, fmt: FMT_QTY },
    { col: 19, fmt: FMT_QTY },
    { col: 20, fmt: FMT_QTY },
    { col: 21, fmt: FMT_QTY },
    { col: 22, fmt: FMT_QTY },
    { col: 23, fmt: FMT_QTY },
    { col: 24, fmt: FMT_QTY },
    { col: 25, fmt: FMT_CURRENCY },
    { col: 27, fmt: FMT_CURRENCY },
  ];

  if (books.length > 0) {
    colFormulaCols.forEach(({ col, fmt }) => {
      const colLetter = bookHeaders[col - 1].key;
      const cell = totRow.getCell(col);
      cell.value = { formula: `SUM(${colLetter}${startR}:${colLetter}${endR})` };
      cell.numFmt = fmt;
      cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: NAVY_DARK } };
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    });
  } else {
    colFormulaCols.forEach(({ col, fmt }) => {
      const cell = totRow.getCell(col);
      cell.value = 0;
      cell.numFmt = fmt;
      cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: NAVY_DARK } };
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    });
  }

  for (let c = 1; c <= 27; c++) {
    totRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_ROW_BG } };
    totRow.getCell(c).border = totalRowBorder;
  }
  totRow.height = 26;

  appendSignatures(wsBooks, totRowIndex + 2, 'C', 'L', 'Y', language);
  autoFitColumns(wsBooks, 11);

  // --------------------------------------------------------------------
  // SHEET 2: Farid Bhai Press Accounts, Orders & Payment Vouchers
  // --------------------------------------------------------------------
  const wsPress = wb.addWorksheet(tr('প্রেস হিসাব ও পেমেন্ট', 'Press Accounts & Payments', language), {
    properties: { tabColor: { argb: 'D97706' } },
    views: [{ state: 'frozen', ySplit: 6 }],
  });

  addPublicationHeader(wsPress, tr('ফরিদ ভাই প্রেস হিসাব, চালান ও পেমেন্ট ভাউচার খতিয়ান', 'Farid Bhai Press Accounts & Vouchers Ledger', language), periodTitle, currentDate, 'G', language);

  // Summary box (Rows 6 & 7)
  wsPress.mergeCells('A6:B6');
  wsPress.getCell('A6').value = tr('মোট প্রেস বিল (অর্ডার):', 'Total Press Bill:', language);
  wsPress.getCell('A6').font = { bold: true };
  wsPress.getCell('C6').value = { formula: `'${wsBooks.name}'!H${totRowIndex}`, result: pressAccounts.totalOrderBill };
  wsPress.getCell('C6').numFmt = FMT_CURRENCY;
  wsPress.getCell('C6').font = { bold: true, color: { argb: NAVY_MAIN } };

  wsPress.mergeCells('A7:B7');
  wsPress.getCell('A7').value = tr('প্রেসে মোট পরিশোধিত টাকা:', 'Total Paid to Press:', language);
  wsPress.getCell('A7').font = { bold: true };
  wsPress.getCell('C7').value = { formula: pressPayments.length > 0 ? `SUM(G11:G${10 + pressPayments.length})` : '0', result: pressAccounts.totalPaidToPress };
  wsPress.getCell('C7').numFmt = FMT_CURRENCY;
  wsPress.getCell('C7').font = { bold: true, color: { argb: EMERALD_MAIN } };

  wsPress.mergeCells('E6:F6');
  wsPress.getCell('E6').value = tr('প্রেসের বকেয়া ব্যালেন্স:', 'Press Due Balance:', language);
  wsPress.getCell('E6').font = { bold: true };
  wsPress.getCell('G6').value = { formula: `C6-C7`, result: pressAccounts.netDueOnOrder };
  wsPress.getCell('G6').numFmt = FMT_CURRENCY;
  wsPress.getCell('G6').font = { bold: true, color: { argb: pressAccounts.netDueOnOrder > 0 ? 'DC2626' : EMERALD_MAIN } };

  wsPress.mergeCells('E7:F7');
  wsPress.getCell('E7').value = tr('পেমেন্ট স্ট্যাটাস:', 'Payment Status:', language);
  wsPress.getCell('E7').font = { bold: true };
  wsPress.getCell('G7').value = { formula: `IF(G6>0, "${tr('প্রেস পাবে', 'Due to Press', language)}", "${tr('সম্পূর্ণ পরিশোধিত', 'Settled', language)}")`, result: pressAccounts.netDueOnOrder > 0 ? tr('প্রেস পাবে', 'Due', language) : tr('পরিশোধিত', 'Settled', language) };
  wsPress.getCell('G7').font = { bold: true, color: { argb: NAVY_DARK } };

  // Press Vouchers Section Header (Row 9)
  wsPress.getCell('A9').value = tr('পরিশোধিত পেমেন্ট ভাউচার হিস্ট্রি (Transactions History)', 'Payment Vouchers Transaction History', language);
  wsPress.getCell('A9').font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: NAVY_DARK } };

  // Headers (Row 10)
  const pressVchHeaders = [
    tr('ক্রমিক', 'SL', language),
    tr('তারিখ', 'Date', language),
    tr('ভাউচার নং', 'Voucher No', language),
    tr('খাত / বইয়ের নাম', 'Category / Book Name', language),
    tr('পেমেন্ট মাধ্যম', 'Method', language),
    tr('বিবরণ / নোট', 'Notes', language),
    tr('পরিশোধিত টাকা (৳)', 'Amount (BDT)', language),
  ];

  const pvRow = wsPress.getRow(10);
  pressVchHeaders.forEach((h, idx) => {
    const c = pvRow.getCell(idx + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MAIN } };
    c.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 1 || idx === 2 || idx === 4 ? 'center' : idx === 6 ? 'right' : 'left' };
    c.border = thinBorder;
  });
  pvRow.height = 26;

  let curPvRow = 11;
  pressPayments.forEach((p, idx) => {
    const row = wsPress.getRow(curPvRow);
    const isEven = idx % 2 === 0;
    const bg = isEven ? ZEBRA_ROW : 'FFFFFF';

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = p.date;
    row.getCell(3).value = p.voucherNo || `VCH-${idx + 1}`;
    row.getCell(4).value = p.bookName || tr('সার্বিক প্রেস অর্ডার বাবদ', 'General Press Order', language);
    row.getCell(5).value = p.paymentMethod.toUpperCase();
    row.getCell(6).value = p.notes || '—';
    row.getCell(7).value = p.amount;
    row.getCell(7).numFmt = FMT_CURRENCY;

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.border = thinBorder;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 || c === 2 || c === 3 || c === 5 ? 'center' : c === 7 ? 'right' : 'left' };
    }
    row.height = 22;
    curPvRow++;
  });

  // Total Row for press payments
  const pvTotRow = wsPress.getRow(curPvRow);
  pvTotRow.getCell(6).value = tr('মোট পরিশোধিত টাকা (Total Paid):', 'Total Paid:', language);
  pvTotRow.getCell(6).font = { bold: true };
  pvTotRow.getCell(6).alignment = { horizontal: 'right' };
  pvTotRow.getCell(7).value = { formula: curPvRow > 11 ? `SUM(G11:G${curPvRow - 1})` : '0', result: pressAccounts.totalPaidToPress };
  pvTotRow.getCell(7).numFmt = FMT_CURRENCY;
  pvTotRow.getCell(7).font = { bold: true, color: { argb: EMERALD_MAIN } };

  for (let c = 1; c <= 7; c++) {
    pvTotRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_ROW_BG } };
    pvTotRow.getCell(c).border = totalRowBorder;
  }
  pvTotRow.height = 26;

  appendSignatures(wsPress, curPvRow + 2, 'B', 'D', 'F', language);
  autoFitColumns(wsPress, 14);

  // --------------------------------------------------------------------
  // SHEET 3: Channel Dues & Collections Ledger
  // --------------------------------------------------------------------
  const wsChannels = wb.addWorksheet(tr('চ্যানেল ডিউ ও কালেকশন', 'Channel Dues & Collections', language), {
    properties: { tabColor: { argb: EMERALD_MAIN } },
    views: [{ state: 'frozen', ySplit: 6 }],
  });

  addPublicationHeader(wsChannels, tr('অনলাইন ও অফলাইন চ্যানেল বিক্রয়, ডিউ ও আদায় খতিয়ান', 'Sales Channels Billing, Dues & Collections', language), periodTitle, currentDate, 'G', language);

  // Headers (Row 6)
  const chHeaders = [
    tr('ক্রমিক', 'SL', language),
    tr('চ্যানেল / লাইব্রেরির নাম', 'Channel / Library Name', language),
    tr('ধরন', 'Type', language),
    tr('মোট বিক্রিত কপি', 'Sold Copies', language),
    tr('ইনভয়েস বিক্রয়মূল্য (টাকা)', 'Billed Amount (BDT)', language),
    tr('আদায়কৃত টাকা (টাকা)', 'Collected Amount (BDT)', language),
    tr('বকেয়া ডিউ (টাকা)', 'Pending Due (BDT)', language),
    tr('আদায় হার (%)', 'Collection Rate (%)', language),
  ];

  const chHRow = wsChannels.getRow(6);
  chHeaders.forEach((h, idx) => {
    const c = chHRow.getCell(idx + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_MAIN } };
    c.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 2 ? 'center' : idx >= 3 ? 'right' : 'left' };
    c.border = thinBorder;
  });
  chHRow.height = 26;

  let curChRow = 7;
  channelAccounts.channels.forEach((ch, idx) => {
    const r = curChRow;
    const row = wsChannels.getRow(r);
    const isEven = idx % 2 === 0;
    const bg = isEven ? ZEBRA_ROW : 'FFFFFF';

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = ch.name;
    row.getCell(3).value = ch.type === 'online' ? tr('অনলাইন', 'Online', language) : tr('অফলাইন', 'Offline', language);
    row.getCell(4).value = ch.totalCopies;
    row.getCell(4).numFmt = FMT_QTY;
    row.getCell(5).value = ch.totalBilled;
    row.getCell(5).numFmt = FMT_CURRENCY;
    row.getCell(6).value = ch.totalCollected;
    row.getCell(6).numFmt = FMT_CURRENCY;

    // Due Formula = Billed - Collected
    row.getCell(7).value = { formula: `E${r}-F${r}`, result: ch.dueAmount };
    row.getCell(7).numFmt = FMT_CURRENCY;

    // Collection Rate = Collected / Billed
    row.getCell(8).value = { formula: `IF(E${r}>0, F${r}/E${r}, 1)`, result: ch.collectionRate / 100 };
    row.getCell(8).numFmt = FMT_PERCENT;

    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.border = thinBorder;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 || c === 3 ? 'center' : c >= 4 ? 'right' : 'left' };
    }
    row.height = 22;
    curChRow++;
  });

  // Channel Total Row
  const chTotRow = wsChannels.getRow(curChRow);
  chTotRow.getCell(2).value = tr('সর্বমোট চ্যানেল যোগফল:', 'Channel Total Sum:', language);
  chTotRow.getCell(2).font = { bold: true };
  chTotRow.getCell(2).alignment = { horizontal: 'right' };

  if (curChRow > 7) {
    chTotRow.getCell(4).value = { formula: `SUM(D7:D${curChRow - 1})` };
    chTotRow.getCell(5).value = { formula: `SUM(E7:E${curChRow - 1})` };
    chTotRow.getCell(6).value = { formula: `SUM(F7:F${curChRow - 1})` };
    chTotRow.getCell(7).value = { formula: `SUM(G7:G${curChRow - 1})` };
    chTotRow.getCell(8).value = { formula: `IF(E${curChRow}>0, F${curChRow}/E${curChRow}, 1)` };
  } else {
    chTotRow.getCell(4).value = 0;
    chTotRow.getCell(5).value = 0;
    chTotRow.getCell(6).value = 0;
    chTotRow.getCell(7).value = 0;
    chTotRow.getCell(8).value = 1;
  }
  chTotRow.getCell(4).numFmt = FMT_QTY;
  chTotRow.getCell(5).numFmt = FMT_CURRENCY;
  chTotRow.getCell(6).numFmt = FMT_CURRENCY;
  chTotRow.getCell(7).numFmt = FMT_CURRENCY;
  chTotRow.getCell(8).numFmt = FMT_PERCENT;

  for (let c = 1; c <= 8; c++) {
    chTotRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_ROW_BG } };
    chTotRow.getCell(c).border = totalRowBorder;
    chTotRow.getCell(c).font = { bold: true, name: 'Segoe UI' };
  }
  chTotRow.height = 26;

  // Collections Receipts Ledger History on same sheet below
  const rCollHeader = curChRow + 3;
  wsChannels.getCell(`A${rCollHeader}`).value = tr('অনলাইন ও লাইব্রেরি থেকে প্রাপ্ত আদায় রিসিট হিস্ট্রি', 'Channel Collection Receipts History', language);
  wsChannels.getCell(`A${rCollHeader}`).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: NAVY_DARK } };

  const collHRow = wsChannels.getRow(rCollHeader + 1);
  const collHeaders = [
    tr('ক্রমিক', 'SL', language),
    tr('তারিখ', 'Date', language),
    tr('রিসিট নং', 'Receipt No', language),
    tr('চ্যানেল / লাইব্রেরি', 'Channel / Library', language),
    tr('পেমেন্ট মাধ্যম', 'Method', language),
    tr('বিবরণ / নোট', 'Notes', language),
    tr('আদায়কৃত টাকা (৳)', 'Amount (BDT)', language),
  ];

  collHeaders.forEach((h, idx) => {
    const c = collHRow.getCell(idx + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD_MAIN } };
    c.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 1 || idx === 2 || idx === 4 ? 'center' : idx === 6 ? 'right' : 'left' };
    c.border = thinBorder;
  });
  collHRow.height = 26;

  let curRcRow = rCollHeader + 2;
  channelCollections.forEach((c, idx) => {
    const row = wsChannels.getRow(curRcRow);
    const isEven = idx % 2 === 0;
    const bg = isEven ? ZEBRA_ROW : 'FFFFFF';

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = c.date;
    row.getCell(3).value = c.receiptNo || `MR-${idx + 1}`;
    row.getCell(4).value = c.channelName;
    row.getCell(5).value = c.paymentMethod.toUpperCase();
    row.getCell(6).value = c.notes || '—';
    row.getCell(7).value = c.amount;
    row.getCell(7).numFmt = FMT_CURRENCY;

    for (let col = 1; col <= 7; col++) {
      const cell = row.getCell(col);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.border = thinBorder;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = { vertical: 'middle', horizontal: col === 1 || col === 2 || col === 3 || col === 5 ? 'center' : col === 7 ? 'right' : 'left' };
    }
    row.height = 22;
    curRcRow++;
  });

  const rcTotRow = wsChannels.getRow(curRcRow);
  rcTotRow.getCell(6).value = tr('মোট সংগৃহীত আদায়:', 'Total Collected:', language);
  rcTotRow.getCell(6).font = { bold: true };
  rcTotRow.getCell(6).alignment = { horizontal: 'right' };
  rcTotRow.getCell(7).value = { formula: curRcRow > rCollHeader + 2 ? `SUM(G${rCollHeader + 2}:G${curRcRow - 1})` : '0', result: channelAccounts.totalCollected };
  rcTotRow.getCell(7).numFmt = FMT_CURRENCY;
  rcTotRow.getCell(7).font = { bold: true, color: { argb: EMERALD_MAIN } };

  for (let c = 1; c <= 7; c++) {
    rcTotRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_ROW_BG } };
    rcTotRow.getCell(c).border = totalRowBorder;
  }
  rcTotRow.height = 26;

  appendSignatures(wsChannels, curRcRow + 2, 'B', 'D', 'F', language);
  autoFitColumns(wsChannels, 14);

  return saveWorkbook(wb, `Biddabari_Executive_Report_${periodTitle}`);
}

/**
 * Saves workbook buffer to native browser file download
 */
async function saveWorkbook(wb: ExcelJS.Workbook, fileNamePrefix: string): Promise<void> {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const cleanPrefix = fileNamePrefix.replace(/[/\\?%*:|"<>]/g, '_');
  const fileName = `${cleanPrefix}_${new Date().toISOString().split('T')[0]}.xlsx`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2500);
}
