import * as XLSX from 'xlsx';
import { BookRecord } from '../types/book';
import { calculateBookMetrics } from './calculations';
import { EXCEL_HEADERS } from './excelHeaders';

export function exportBooksToExcel(books: BookRecord[]) {
  // 1. Build Sheet1 (373 columns matrix)
  const sheet1Data: (string | number | null | undefined)[][] = [];
  sheet1Data.push(EXCEL_HEADERS);

  books.forEach((book, idx) => {
    const metrics = calculateBookMetrics(book);
    const row: (string | number | null | undefined)[] = new Array(EXCEL_HEADERS.length).fill('');

    row[0] = idx + 1; // SL
    row[1] = book.bookName;
    row[2] = metrics.adCost;
    row[3] = metrics.makingCost;
    row[4] = metrics.perBookAmount;
    row[5] = metrics.profitPerBook;
    row[6] = metrics.totalIncomeOffline;
    row[7] = metrics.totalIncomeOnline;
    row[8] = metrics.totalPresentStockHO;
    row[9] = metrics.totalOrderFaridBhai;
    row[10] = metrics.faridBhaiToHeadOffice;
    row[11] = metrics.stockToFaridBhai;

    // Press receipts (cols 12..42: days 1..31)
    for (let d = 1; d <= 31; d++) {
      if (book.pressDailyReceipts && book.pressDailyReceipts[d]) {
        row[11 + d] = book.pressDailyReceipts[d];
      }
    }

    // Boibari (col 43 total, 44..74 days)
    row[43] = metrics.boibariTotal;
    for (let d = 1; d <= 31; d++) {
      if (book.boibari && book.boibari[d]) {
        row[43 + d] = book.boibari[d];
      }
    }

    // Rokomari (col 75 total, 76..106 days)
    row[75] = metrics.rokomariTotal;
    for (let d = 1; d <= 31; d++) {
      if (book.rokomari && book.rokomari[d]) {
        row[75 + d] = book.rokomari[d];
      }
    }

    // Wafilife (col 107 total, 108..138 days)
    row[107] = metrics.wafilifeTotal;
    for (let d = 1; d <= 31; d++) {
      if (book.wafilife && book.wafilife[d]) {
        row[107 + d] = book.wafilife[d];
      }
    }

    // Others Online (col 140 total, 141..171 days)
    row[140] = metrics.othersOnlineTotal;
    for (let d = 1; d <= 31; d++) {
      if (book.othersOnline && book.othersOnline[d]) {
        row[140 + d] = book.othersOnline[d];
      }
    }

    // Head Office Offline (col 172 total, 173..203 days)
    row[172] = metrics.headOfficeOfflineTotal;
    for (let d = 1; d <= 31; d++) {
      if (book.headOfficeSellOffline && book.headOfficeSellOffline[d]) {
        row[172 + d] = book.headOfficeSellOffline[d];
      }
    }

    // Nilkhet (col 204 total, 205..235 days)
    row[204] = metrics.nilkhetTotal;
    for (let d = 1; d <= 31; d++) {
      if (book.nilkhetLibrary && book.nilkhetLibrary[d]) {
        row[204 + d] = book.nilkhetLibrary[d];
      }
    }

    // Sumona (col 236 total, 237..267 days)
    row[236] = metrics.sumonaTotal;
    for (let d = 1; d <= 31; d++) {
      if (book.sumonaLibrary && book.sumonaLibrary[d]) {
        row[236 + d] = book.sumonaLibrary[d];
      }
    }

    // Promise (col 268 total, 269..299 days)
    row[268] = metrics.promiseTotal;
    for (let d = 1; d <= 31; d++) {
      if (book.promiseLibrary && book.promiseLibrary[d]) {
        row[268 + d] = book.promiseLibrary[d];
      }
    }

    // Joystar (col 300 total, 301..331 days)
    row[300] = metrics.joystarTotal;
    for (let d = 1; d <= 31; d++) {
      if (book.joystarLibrary && book.joystarLibrary[d]) {
        row[300 + d] = book.joystarLibrary[d];
      }
    }

    // Daily Returns (col 332 total, 333..363 days)
    row[332] = metrics.totalReturns;
    for (let d = 1; d <= 31; d++) {
      if (book.dailyReturns && book.dailyReturns[d]) {
        row[332 + d] = book.dailyReturns[d];
      }
    }

    // Promo copies
    row[365] = metrics.marketing;
    row[366] = metrics.service;
    row[367] = metrics.adVideoMaking;
    row[368] = metrics.rd;
    row[369] = metrics.gift;

    row[370] = metrics.totalOnlineSell;
    row[371] = metrics.totalOfflineSell;
    row[372] = book.remarks || '';

    sheet1Data.push(row);
  });

  // 2. Build Summary Sheet
  const summaryHeaders = [
    'ক্রমিক (SL)',
    'বইয়ের নাম (Book Name)',
    'বিজ্ঞাপন খরচ (Ad Cost)',
    'উৎপাদন খরচ (Making Cost)',
    'বিক্রয় মূল্য (MRP)',
    'কপি প্রতি লাভ (Profit/Unit)',
    'মোট প্রেস অর্ডার (Press Order)',
    'হেড অফিস প্রাপ্ত (Received at HO)',
    'হেড অফিস বর্তমান স্টক (HO Stock)',
    'ফরিদ ভাই প্রেস স্টক (Press Stock)',
    'অনলাইন মোট বিক্রি (Online Sold)',
    'অফলাইন মোট বিক্রি (Offline Sold)',
    'সর্বমোট বিক্রি (Total Sold)',
    'রিটার্ন কপি (Returns)',
    'প্রমোশন/উপহার (Promotions)',
    'অনলাইন আয় (Online Revenue)',
    'অফলাইন আয় (Offline Revenue)',
    'সর্বমোট আয় (Total Revenue)',
    'সর্বমোট নিট লাভ (Total Net Profit)',
    'মন্তব্য (Remarks)'
  ];

  const summaryData: (string | number)[][] = [summaryHeaders];

  books.forEach((book, idx) => {
    const m = calculateBookMetrics(book);
    summaryData.push([
      idx + 1,
      book.bookName,
      m.adCost,
      m.makingCost,
      m.perBookAmount,
      m.profitPerBook,
      m.totalOrderFaridBhai,
      m.faridBhaiToHeadOffice,
      m.totalPresentStockHO,
      m.stockToFaridBhai,
      m.totalOnlineSell,
      m.totalOfflineSell,
      m.totalSold,
      m.totalReturns,
      m.totalPromo,
      m.totalIncomeOnline,
      m.totalIncomeOffline,
      m.totalRevenue,
      m.totalNetProfit,
      book.remarks || ''
    ]);
  });

  const wb = XLSX.utils.book_new();

  const wsSheet1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, wsSheet1, 'Sheet1');

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Report');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  XLSX.writeFile(wb, `Biddabari_Publication_Report_${dateStr}.xlsx`);
}

export function importBooksFromExcel(file: File): Promise<BookRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames.includes('Sheet1') ? 'Sheet1' : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          throw new Error('এক্সেল ফাইলে কোনো বইয়ের ডাটা পাওয়া যায়নি।');
        }

        const books: BookRecord[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[1] || String(row[1]).trim() === '') continue;

          const bookName = String(row[1]).trim();
          const adCost = Number(row[2]) || 0;
          const makingCost = Number(row[3]) || 0;
          const perBookAmount = Number(row[4]) || 0;
          const profitPerBook = perBookAmount - (adCost + makingCost);
          const totalOrderFaridBhai = Number(row[9]) || 0;

          // Helper to extract 31 days
          const extractDays = (startCol: number) => {
            const map: { [day: number]: number } = {};
            for (let d = 1; d <= 31; d++) {
              const val = Number(row[startCol + d - 1]);
              if (val) map[d] = val;
            }
            return map;
          };

          // Col 12 is day 1 of press receipts (12..42)
          const pressDailyReceipts = extractDays(12);
          // Col 44 is day 1 of Boibari (44..74)
          const boibari = extractDays(44);
          // Col 76 is day 1 of Rokomari (76..106)
          const rokomari = extractDays(76);
          // Col 108 is day 1 of Wafilife (108..138)
          const wafilife = extractDays(108);
          // Col 141 is day 1 of Others Online (141..171)
          const othersOnline = extractDays(141);
          // Col 173 is day 1 of Head Office Offline (173..203)
          const headOfficeSellOffline = extractDays(173);
          // Col 205 is day 1 of Nilkhet (205..235)
          const nilkhetLibrary = extractDays(205);
          // Col 237 is day 1 of Sumona (237..267)
          const sumonaLibrary = extractDays(237);
          // Col 269 is day 1 of Promise (269..299)
          const promiseLibrary = extractDays(269);
          // Col 301 is day 1 of Joystar (301..331)
          const joystarLibrary = extractDays(301);
          // Col 333 is day 1 of Daily Returns (333..363)
          const dailyReturns = extractDays(333);

          const marketing = Number(row[365]) || 0;
          const service = Number(row[366]) || 0;
          const adVideoMaking = Number(row[367]) || 0;
          const rd = Number(row[368]) || 0;
          const gift = Number(row[369]) || 0;
          const remarks = row[372] ? String(row[372]) : '';

          books.push({
            id: `imported-${i}-${Date.now()}`,
            sl: i,
            bookName,
            adCost,
            makingCost,
            perBookAmount,
            profitPerBook,
            totalOrderFaridBhai,
            pressDailyReceipts,
            boibari,
            rokomari,
            wafilife,
            othersOnline,
            headOfficeSellOffline,
            nilkhetLibrary,
            sumonaLibrary,
            promiseLibrary,
            joystarLibrary,
            dailyReturns,
            marketing,
            service,
            adVideoMaking,
            rd,
            gift,
            remarks,
            updatedAt: new Date().toISOString(),
          });
        }

        resolve(books);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}
