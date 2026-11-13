import * as XLSX from 'xlsx';
import { 
  BookRecord, 
  PressPaymentRecord, 
  PressOrderRecord, 
  PressDeliveryRecord, 
  ChannelCollectionRecord, 
  ChannelConfig 
} from '../types/book';
import { calculateBookMetrics } from './calculations';
import { EXCEL_HEADERS } from './excelHeaders';

export interface FullDatabaseBackupData {
  pressPayments?: PressPaymentRecord[];
  pressOrders?: PressOrderRecord[];
  pressDeliveries?: PressDeliveryRecord[];
  channelCollections?: ChannelCollectionRecord[];
  channels?: ChannelConfig[];
}

export interface FullDatabaseImportResult {
  books: BookRecord[];
  pressPayments?: PressPaymentRecord[];
  pressOrders?: PressOrderRecord[];
  pressDeliveries?: PressDeliveryRecord[];
  channelCollections?: ChannelCollectionRecord[];
  channels?: ChannelConfig[];
}

export function exportBooksToExcel(
  books: BookRecord[], 
  month?: number, 
  year?: number, 
  additionalData?: FullDatabaseBackupData
) {
  // 1. Build Sheet1 (373 columns matrix - Complete Book Sales & Daily Activity)
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

  const wb = XLSX.utils.book_new();

  // Sheet 1: Books Matrix
  const wsSheet1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, wsSheet1, 'Sheet1');

  // Sheet 2: Press Payments
  if (additionalData?.pressPayments && additionalData.pressPayments.length > 0) {
    const paymentRows: (string | number)[][] = [
      ['ID', 'Date', 'Book ID', 'Book Name', 'Amount', 'Payment Method', 'Voucher No', 'Notes', 'Voucher Image', 'Created At']
    ];
    additionalData.pressPayments.forEach(p => {
      paymentRows.push([
        p.id || '',
        p.date || '',
        p.bookId || '',
        p.bookName || '',
        Number(p.amount) || 0,
        p.paymentMethod || 'bank',
        p.voucherNo || '',
        p.notes || '',
        p.voucherImage || '',
        p.createdAt || ''
      ]);
    });
    const wsPayments = XLSX.utils.aoa_to_sheet(paymentRows);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Press Payments');
  }

  // Sheet 3: Press Orders
  if (additionalData?.pressOrders && additionalData.pressOrders.length > 0) {
    const orderRows: (string | number)[][] = [
      ['ID', 'Book ID', 'Book Name', 'Order Date', 'Order Quantity', 'Lot Name', 'Making Cost', 'Total Bill', 'Order No', 'Notes', 'Voucher Image', 'Created At']
    ];
    additionalData.pressOrders.forEach(o => {
      orderRows.push([
        o.id || '',
        o.bookId || '',
        o.bookName || '',
        o.orderDate || '',
        Number(o.orderQuantity) || 0,
        o.lotName || '',
        Number(o.makingCost) || 0,
        Number(o.totalBill) || 0,
        o.orderNo || '',
        o.notes || '',
        o.voucherImage || '',
        o.createdAt || ''
      ]);
    });
    const wsOrders = XLSX.utils.aoa_to_sheet(orderRows);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Press Orders');
  }

  // Sheet 4: Press Deliveries (Chalans)
  if (additionalData?.pressDeliveries && additionalData.pressDeliveries.length > 0) {
    const deliveryRows: (string | number)[][] = [
      ['ID', 'Book ID', 'Book Name', 'Delivery Date', 'Quantity', 'Chalan No', 'Lot Name', 'Received By', 'Notes', 'Voucher Image', 'Created At']
    ];
    additionalData.pressDeliveries.forEach(d => {
      deliveryRows.push([
        d.id || '',
        d.bookId || '',
        d.bookName || '',
        d.deliveryDate || '',
        Number(d.quantity) || 0,
        d.chalanNo || '',
        d.lotName || '',
        d.receivedBy || '',
        d.notes || '',
        d.voucherImage || '',
        d.createdAt || ''
      ]);
    });
    const wsDeliveries = XLSX.utils.aoa_to_sheet(deliveryRows);
    XLSX.utils.book_append_sheet(wb, wsDeliveries, 'Press Deliveries');
  }

  // Sheet 5: Channel Collections (Money Receipts)
  if (additionalData?.channelCollections && additionalData.channelCollections.length > 0) {
    const collectionRows: (string | number)[][] = [
      ['ID', 'Date', 'Channel Key', 'Channel Name', 'Amount', 'Payment Method', 'Receipt No', 'Notes', 'Voucher Image', 'Created At']
    ];
    additionalData.channelCollections.forEach(c => {
      collectionRows.push([
        c.id || '',
        c.date || '',
        c.channelKey || '',
        c.channelName || '',
        Number(c.amount) || 0,
        c.paymentMethod || 'cash',
        c.receiptNo || '',
        c.notes || '',
        c.voucherImage || c.receiptImage || '',
        c.createdAt || ''
      ]);
    });
    const wsCollections = XLSX.utils.aoa_to_sheet(collectionRows);
    XLSX.utils.book_append_sheet(wb, wsCollections, 'Channel Collections');
  }

  // Sheet 6: Sales Channels Configuration
  if (additionalData?.channels && additionalData.channels.length > 0) {
    const channelRows: (string | number)[][] = [
      ['ID', 'Name', 'English Name', 'Type', 'Source', 'Category', 'Is System Default']
    ];
    additionalData.channels.forEach(ch => {
      channelRows.push([
        ch.id || '',
        ch.name || '',
        ch.nameEn || '',
        ch.type || 'offline',
        ch.source || 'headOffice',
        ch.category || '',
        ch.isSystemDefault ? 1 : 0
      ]);
    });
    const wsChannels = XLSX.utils.aoa_to_sheet(channelRows);
    XLSX.utils.book_append_sheet(wb, wsChannels, 'Sales Channels');
  }

  // Sheet 7: Executive Summary
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

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Report');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filePrefix = year && month 
    ? `Biddabari_Full_Database_Backup_${year}_${String(month).padStart(2, '0')}` 
    : `Biddabari_Full_Database_Backup_${dateStr}`;
  XLSX.writeFile(wb, `${filePrefix}.xlsx`);
}

export function importBooksFromExcel(file: File): Promise<FullDatabaseImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        // 1. Parse Sheet1 / Main Books
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

        // 2. Parse Press Payments (if sheet exists)
        let pressPayments: PressPaymentRecord[] | undefined = undefined;
        if (wb.SheetNames.includes('Press Payments')) {
          const wsPay = wb.Sheets['Press Payments'];
          const payRows: any[][] = XLSX.utils.sheet_to_json(wsPay, { header: 1 });
          if (payRows.length > 1) {
            pressPayments = [];
            for (let i = 1; i < payRows.length; i++) {
              const r = payRows[i];
              if (!r || !r[0]) continue;
              pressPayments.push({
                id: String(r[0]),
                date: String(r[1] || ''),
                bookId: r[2] ? String(r[2]) : undefined,
                bookName: r[3] ? String(r[3]) : undefined,
                amount: Number(r[4]) || 0,
                paymentMethod: (r[5] || 'bank') as any,
                voucherNo: r[6] ? String(r[6]) : undefined,
                notes: r[7] ? String(r[7]) : undefined,
                voucherImage: r[8] ? String(r[8]) : undefined,
                createdAt: String(r[9] || new Date().toISOString())
              });
            }
          }
        }

        // 3. Parse Press Orders (if sheet exists)
        let pressOrders: PressOrderRecord[] | undefined = undefined;
        if (wb.SheetNames.includes('Press Orders')) {
          const wsOrd = wb.Sheets['Press Orders'];
          const ordRows: any[][] = XLSX.utils.sheet_to_json(wsOrd, { header: 1 });
          if (ordRows.length > 1) {
            pressOrders = [];
            for (let i = 1; i < ordRows.length; i++) {
              const r = ordRows[i];
              if (!r || !r[0]) continue;
              pressOrders.push({
                id: String(r[0]),
                bookId: String(r[1] || ''),
                bookName: String(r[2] || ''),
                orderDate: String(r[3] || ''),
                orderQuantity: Number(r[4]) || 0,
                lotName: r[5] ? String(r[5]) : undefined,
                makingCost: r[6] ? Number(r[6]) : undefined,
                totalBill: r[7] ? Number(r[7]) : undefined,
                orderNo: r[8] ? String(r[8]) : undefined,
                notes: r[9] ? String(r[9]) : undefined,
                voucherImage: r[10] ? String(r[10]) : undefined,
                createdAt: String(r[11] || new Date().toISOString())
              });
            }
          }
        }

        // 4. Parse Press Deliveries (if sheet exists)
        let pressDeliveries: PressDeliveryRecord[] | undefined = undefined;
        if (wb.SheetNames.includes('Press Deliveries')) {
          const wsDel = wb.Sheets['Press Deliveries'];
          const delRows: any[][] = XLSX.utils.sheet_to_json(wsDel, { header: 1 });
          if (delRows.length > 1) {
            pressDeliveries = [];
            for (let i = 1; i < delRows.length; i++) {
              const r = delRows[i];
              if (!r || !r[0]) continue;
              pressDeliveries.push({
                id: String(r[0]),
                bookId: String(r[1] || ''),
                bookName: String(r[2] || ''),
                deliveryDate: String(r[3] || ''),
                quantity: Number(r[4]) || 0,
                chalanNo: String(r[5] || ''),
                lotName: r[6] ? String(r[6]) : undefined,
                receivedBy: r[7] ? String(r[7]) : undefined,
                notes: r[8] ? String(r[8]) : undefined,
                voucherImage: r[9] ? String(r[9]) : undefined,
                createdAt: String(r[10] || new Date().toISOString())
              });
            }
          }
        }

        // 5. Parse Channel Collections (if sheet exists)
        let channelCollections: ChannelCollectionRecord[] | undefined = undefined;
        if (wb.SheetNames.includes('Channel Collections')) {
          const wsCol = wb.Sheets['Channel Collections'];
          const colRows: any[][] = XLSX.utils.sheet_to_json(wsCol, { header: 1 });
          if (colRows.length > 1) {
            channelCollections = [];
            for (let i = 1; i < colRows.length; i++) {
              const r = colRows[i];
              if (!r || !r[0]) continue;
              channelCollections.push({
                id: String(r[0]),
                date: String(r[1] || ''),
                channelKey: String(r[2] || ''),
                channelName: String(r[3] || ''),
                amount: Number(r[4]) || 0,
                paymentMethod: (r[5] || 'cash') as any,
                receiptNo: r[6] ? String(r[6]) : undefined,
                notes: r[7] ? String(r[7]) : undefined,
                voucherImage: r[8] ? String(r[8]) : undefined,
                createdAt: String(r[9] || new Date().toISOString())
              });
            }
          }
        }

        // 6. Parse Sales Channels (if sheet exists)
        let channels: ChannelConfig[] | undefined = undefined;
        if (wb.SheetNames.includes('Sales Channels')) {
          const wsCh = wb.Sheets['Sales Channels'];
          const chRows: any[][] = XLSX.utils.sheet_to_json(wsCh, { header: 1 });
          if (chRows.length > 1) {
            channels = [];
            for (let i = 1; i < chRows.length; i++) {
              const r = chRows[i];
              if (!r || !r[0]) continue;
              channels.push({
                id: String(r[0]),
                name: String(r[1] || ''),
                nameEn: r[2] ? String(r[2]) : undefined,
                type: (r[3] || 'offline') as any,
                source: r[4] ? (r[4] as any) : undefined,
                category: r[5] ? String(r[5]) : undefined,
                isSystemDefault: r[6] === 1 || r[6] === '1' || r[6] === true
              });
            }
          }
        }

        resolve({
          books,
          pressPayments,
          pressOrders,
          pressDeliveries,
          channelCollections,
          channels
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}
