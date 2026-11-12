import { 
  BookRecord, 
  DailyChannelSales, 
  PressPaymentRecord, 
  ChannelCollectionRecord, 
  PressOrderRecord, 
  ChannelConfig, 
  DEFAULT_CHANNELS, 
  SALES_CHANNELS 
} from '../types/book';

export function formatBookWithEdition(book?: { bookName: string; edition?: string; sl?: number } | null, includeSl = false): string {
  if (!book) return '';
  const editionPart = book.edition && book.edition.trim() ? ` [${book.edition.trim()}]` : '';
  if (includeSl && book.sl) {
    return `${book.sl}. ${book.bookName}${editionPart}`;
  }
  return `${book.bookName}${editionPart}`;
}

export function sumDaily(salesMap: DailyChannelSales = {}): number {
  if (!salesMap) return 0;
  return Object.values(salesMap).reduce((sum, val) => sum + (Number(val) || 0), 0);
}

export function getDailyTotalForDay(salesMap: DailyChannelSales = {}, day: number): number {
  return Number(salesMap[day]) || 0;
}

export function getBookChannelSales(book: BookRecord, channelId: string): DailyChannelSales {
  if (book.customChannelSales && book.customChannelSales[channelId]) {
    return book.customChannelSales[channelId];
  }
  if ((book as any)[channelId]) {
    return (book as any)[channelId];
  }
  return {};
}

export function setBookChannelDailySales(
  book: BookRecord, 
  channelId: string, 
  day: number, 
  qty: number
): BookRecord {
  const standardProps = [
    'boibari', 'rokomari', 'wafilife', 'othersOnline',
    'headOfficeSellOffline', 'nilkhetLibrary',
    'sumonaLibrary', 'promiseLibrary', 'joystarLibrary'
  ];
  if (standardProps.includes(channelId)) {
    return {
      ...book,
      [channelId]: {
        ...((book as any)[channelId] || {}),
        [day]: qty,
      },
    };
  }
  return {
    ...book,
    customChannelSales: {
      ...book.customChannelSales,
      [channelId]: {
        ...(book.customChannelSales?.[channelId] || {}),
        [day]: qty,
      },
    },
  };
}

export function calculateBookMetrics(
  book: BookRecord, 
  pressOrders?: PressOrderRecord[],
  channelsList: ChannelConfig[] = DEFAULT_CHANNELS
) {
  const adCost = Number(book.adCost) || 0;
  const makingCost = Number(book.makingCost) || 0;
  const perBookAmount = Number(book.perBookAmount) || 0;
  const profitPerBook = perBookAmount - (adCost + makingCost);

  // Press receipts
  const faridBhaiToHeadOffice = sumDaily(book.pressDailyReceipts);

  // Dynamic channel sales breakdown
  const channelTotals: { [channelId: string]: number } = {};
  channelsList.forEach(ch => {
    const map = getBookChannelSales(book, ch.id);
    channelTotals[ch.id] = sumDaily(map);
  });

  // Online Sales (All online channels)
  const onlineChannels = channelsList.filter(c => c.type === 'online');
  const totalOnlineSell = onlineChannels.reduce((sum, ch) => sum + (channelTotals[ch.id] || 0), 0);

  // Offline Sales
  const offlineChannels = channelsList.filter(c => c.type === 'offline');
  const totalOfflineSell = offlineChannels.reduce((sum, ch) => sum + (channelTotals[ch.id] || 0), 0);

  // Offline Dispatched directly from Press vs from Head Office
  const offlinePressTotal = offlineChannels
    .filter(ch => ch.source === 'press')
    .reduce((sum, ch) => sum + (channelTotals[ch.id] || 0), 0);

  const offlineHOTotal = offlineChannels
    .filter(ch => ch.source !== 'press')
    .reduce((sum, ch) => sum + (channelTotals[ch.id] || 0), 0);

  // Legacy channel totals for backwards compatibility
  const boibariTotal = channelTotals['boibari'] !== undefined ? channelTotals['boibari'] : sumDaily(book.boibari);
  const rokomariTotal = channelTotals['rokomari'] !== undefined ? channelTotals['rokomari'] : sumDaily(book.rokomari);
  const wafilifeTotal = channelTotals['wafilife'] !== undefined ? channelTotals['wafilife'] : sumDaily(book.wafilife);
  const othersOnlineTotal = channelTotals['othersOnline'] !== undefined ? channelTotals['othersOnline'] : sumDaily(book.othersOnline);
  const headOfficeOfflineTotal = channelTotals['headOfficeSellOffline'] !== undefined ? channelTotals['headOfficeSellOffline'] : sumDaily(book.headOfficeSellOffline);
  const nilkhetTotal = channelTotals['nilkhetLibrary'] !== undefined ? channelTotals['nilkhetLibrary'] : sumDaily(book.nilkhetLibrary);
  const sumonaTotal = channelTotals['sumonaLibrary'] !== undefined ? channelTotals['sumonaLibrary'] : sumDaily(book.sumonaLibrary);
  const promiseTotal = channelTotals['promiseLibrary'] !== undefined ? channelTotals['promiseLibrary'] : sumDaily(book.promiseLibrary);
  const joystarTotal = channelTotals['joystarLibrary'] !== undefined ? channelTotals['joystarLibrary'] : sumDaily(book.joystarLibrary);

  // Total Sold
  const totalSold = totalOnlineSell + totalOfflineSell;

  // Returns
  const totalReturns = sumDaily(book.dailyReturns);

  // Promotional / Dept
  const marketing = Number(book.marketing) || 0;
  const service = Number(book.service) || 0;
  const adVideoMaking = Number(book.adVideoMaking) || 0;
  const rd = Number(book.rd) || 0;
  const gift = Number(book.gift) || 0;
  const totalPromo = marketing + service + adVideoMaking + rd + gift;

  // Stock at Farid Bhai (Press)
  // Multi-Press orders support: if pressOrders provided, sum order quantities for this book
  const bookOrders = pressOrders ? pressOrders.filter(po => po.bookId === book.id) : [];
  const totalOrderFaridBhai = bookOrders.length > 0
    ? bookOrders.reduce((sum, o) => sum + (Number(o.orderQuantity) || 0), 0)
    : (Number(book.totalOrderFaridBhai) || 0);

  const stockToFaridBhai = totalOrderFaridBhai - faridBhaiToHeadOffice - offlinePressTotal;

  // Stock at Head Office
  // Formula: (Received from Press - Online Sales - HO Dispatched Offline - Promo copies) + Returns
  const stockDispatchedFromHO = totalOnlineSell + offlineHOTotal + totalPromo;
  const totalPresentStockHO = (faridBhaiToHeadOffice - stockDispatchedFromHO) + totalReturns;

  // Financials
  const totalIncomeOnline = totalOnlineSell * perBookAmount;
  const totalIncomeOffline = totalOfflineSell * perBookAmount;
  const totalRevenue = totalSold * perBookAmount;
  const totalNetProfit = totalSold * profitPerBook;

  return {
    adCost,
    makingCost,
    perBookAmount,
    profitPerBook,
    totalOrderFaridBhai,
    pressOrdersCount: bookOrders.length,
    pressOrdersList: bookOrders,
    faridBhaiToHeadOffice,
    stockToFaridBhai,
    boibariTotal,
    rokomariTotal,
    wafilifeTotal,
    othersOnlineTotal,
    totalOnlineSell,
    headOfficeOfflineTotal,
    nilkhetTotal,
    sumonaTotal,
    promiseTotal,
    joystarTotal,
    totalOfflineSell,
    totalSold,
    totalReturns,
    totalPromo,
    marketing,
    service,
    adVideoMaking,
    rd,
    gift,
    totalPresentStockHO,
    totalIncomeOnline,
    totalIncomeOffline,
    totalRevenue,
    totalNetProfit,
  };
}

// -------------------------------------------------------------
// Month & Year Configuration and Helpers
// -------------------------------------------------------------

export const BENGALI_MONTHS = [
  { value: 1, name: 'জানুয়ারি', shortName: 'জানু' },
  { value: 2, name: 'ফেব্রুয়ারি', shortName: 'ফেব্রু' },
  { value: 3, name: 'মার্চ', shortName: 'মার্চ' },
  { value: 4, name: 'এপ্রিল', shortName: 'এপ্রিল' },
  { value: 5, name: 'মে', shortName: 'মে' },
  { value: 6, name: 'জুন', shortName: 'জুন' },
  { value: 7, name: 'জুলাই', shortName: 'জুলাই' },
  { value: 8, name: 'আগস্ট', shortName: 'আগস্ট' },
  { value: 9, name: 'সেপ্টেম্বর', shortName: 'সেপ্টে' },
  { value: 10, name: 'অক্টোবর', shortName: 'অক্টো' },
  { value: 11, name: 'নভেম্বর', shortName: 'নভে' },
  { value: 12, name: 'ডিসেম্বর', shortName: 'ডিসে' },
];

export const AVAILABLE_YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

import { Language, setGlobalLanguage, getGlobalLanguage } from './i18n';

export type AppLanguage = Language;

export function setAppLanguage(lang: AppLanguage) {
  setGlobalLanguage(lang);
}

export function getAppLanguage(): AppLanguage {
  return getGlobalLanguage();
}

export function formatYearBengali(year: number, lang?: AppLanguage): string {
  const activeLang = lang || getAppLanguage();
  if (activeLang === 'en') return String(year);
  const bnDigits: { [k: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
  };
  return String(year).split('').map(c => bnDigits[c] || c).join('');
}

export function formatMonthYearBengali(month: number, year: number, lang?: AppLanguage): string {
  const activeLang = lang || getAppLanguage();
  if (activeLang === 'en') {
    const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${enMonths[month - 1] || month} ${year}`;
  }
  const m = BENGALI_MONTHS.find(x => x.value === month);
  const mName = m ? m.name : `${month}ম মাস`;
  return `${mName} ${formatYearBengali(year, 'bn')}`;
}

// -------------------------------------------------------------
// Daily, Weekly, Monthly Aggregation Helpers
// -------------------------------------------------------------

export interface DayBreakdown {
  day: number;
  totalSold: number;
  onlineSold: number;
  offlineSold: number;
  pressReceived: number;
  returns: number;
  revenue: number;
  profit: number;
  channels: {
    boibari: number;
    rokomari: number;
    wafilife: number;
    othersOnline: number;
    headOfficeOffline: number;
    nilkhet: number;
    sumona: number;
    promise: number;
    joystar: number;
  };
  bookBreakdown: {
    bookId: string;
    bookName: string;
    sold: number;
    revenue: number;
    profit: number;
  }[];
}

export function calculateDayBreakdown(books: BookRecord[], day: number): DayBreakdown {
  let totalSold = 0;
  let onlineSold = 0;
  let offlineSold = 0;
  let pressReceived = 0;
  let returns = 0;
  let revenue = 0;
  let profit = 0;

  const channels = {
    boibari: 0,
    rokomari: 0,
    wafilife: 0,
    othersOnline: 0,
    headOfficeOffline: 0,
    nilkhet: 0,
    sumona: 0,
    promise: 0,
    joystar: 0,
  };

  const bookBreakdown: DayBreakdown['bookBreakdown'] = [];

  books.forEach(b => {
    const bReceipt = Number(b.pressDailyReceipts?.[day]) || 0;
    const bBoibari = Number(b.boibari?.[day]) || 0;
    const bRokomari = Number(b.rokomari?.[day]) || 0;
    const bWafilife = Number(b.wafilife?.[day]) || 0;
    const bOthers = Number(b.othersOnline?.[day]) || 0;
    const bHO = Number(b.headOfficeSellOffline?.[day]) || 0;
    const bNilkhet = Number(b.nilkhetLibrary?.[day]) || 0;
    const bSumona = Number(b.sumonaLibrary?.[day]) || 0;
    const bPromise = Number(b.promiseLibrary?.[day]) || 0;
    const bJoystar = Number(b.joystarLibrary?.[day]) || 0;
    const bReturn = Number(b.dailyReturns?.[day]) || 0;

    const bOnline = bBoibari + bRokomari + bWafilife + bOthers;
    const bOffline = bHO + bNilkhet + bSumona + bPromise + bJoystar;
    const bTotal = bOnline + bOffline;

    const profitPerUnit = Number(b.perBookAmount || 0) - (Number(b.adCost || 0) + Number(b.makingCost || 0));
    const bRev = bTotal * (Number(b.perBookAmount) || 0);
    const bProf = bTotal * profitPerUnit;

    totalSold += bTotal;
    onlineSold += bOnline;
    offlineSold += bOffline;
    pressReceived += bReceipt;
    returns += bReturn;
    revenue += bRev;
    profit += bProf;

    channels.boibari += bBoibari;
    channels.rokomari += bRokomari;
    channels.wafilife += bWafilife;
    channels.othersOnline += bOthers;
    channels.headOfficeOffline += bHO;
    channels.nilkhet += bNilkhet;
    channels.sumona += bSumona;
    channels.promise += bPromise;
    channels.joystar += bJoystar;

    bookBreakdown.push({
      bookId: b.id,
      bookName: b.bookName,
      sold: bTotal,
      revenue: bRev,
      profit: bProf,
    });
  });

  return {
    day,
    totalSold,
    onlineSold,
    offlineSold,
    pressReceived,
    returns,
    revenue,
    profit,
    channels,
    bookBreakdown,
  };
}

export interface WeekBreakdown {
  weekNumber: number; // 1..5
  name: string; // e.g. "সপ্তাহ ১ (১ - ৭ তারিখ)"
  startDay: number;
  endDay: number;
  totalSold: number;
  onlineSold: number;
  offlineSold: number;
  pressReceived: number;
  returns: number;
  revenue: number;
  profit: number;
  bestDay: { day: number; sold: number };
  dailyTotals: { day: number; sold: number }[];
}

export function calculateWeekBreakdowns(books: BookRecord[], daysInMonth: number = 31): WeekBreakdown[] {
  const weekDefinitions: { weekNumber: number; name: string; startDay: number; endDay: number }[] = [
    { weekNumber: 1, name: 'সপ্তাহ ১', startDay: 1, endDay: Math.min(7, daysInMonth) },
    { weekNumber: 2, name: 'সপ্তাহ ২', startDay: 8, endDay: Math.min(14, daysInMonth) },
    { weekNumber: 3, name: 'সপ্তাহ ৩', startDay: 15, endDay: Math.min(21, daysInMonth) },
    { weekNumber: 4, name: 'সপ্তাহ ৪', startDay: 22, endDay: Math.min(28, daysInMonth) },
  ];

  if (daysInMonth > 28) {
    weekDefinitions.push({
      weekNumber: 5,
      name: 'সপ্তাহ ৫',
      startDay: 29,
      endDay: daysInMonth,
    });
  }

  return weekDefinitions.map(w => {
    let totalSold = 0;
    let onlineSold = 0;
    let offlineSold = 0;
    let pressReceived = 0;
    let returns = 0;
    let revenue = 0;
    let profit = 0;

    let bestDay = { day: w.startDay, sold: 0 };
    const dailyTotals: { day: number; sold: number }[] = [];

    for (let day = w.startDay; day <= w.endDay; day++) {
      const dayData = calculateDayBreakdown(books, day);
      totalSold += dayData.totalSold;
      onlineSold += dayData.onlineSold;
      offlineSold += dayData.offlineSold;
      pressReceived += dayData.pressReceived;
      returns += dayData.returns;
      revenue += dayData.revenue;
      profit += dayData.profit;

      dailyTotals.push({ day, sold: dayData.totalSold });

      if (dayData.totalSold >= bestDay.sold) {
        bestDay = { day, sold: dayData.totalSold };
      }
    }

    return {
      weekNumber: w.weekNumber,
      name: `${w.name} (${w.startDay} - ${w.endDay} তারিখ)`,
      startDay: w.startDay,
      endDay: w.endDay,
      totalSold,
      onlineSold,
      offlineSold,
      pressReceived,
      returns,
      revenue,
      profit,
      bestDay,
      dailyTotals,
    };
  });
}

export function calculateWeekBookBreakdown(books: BookRecord[], startDay: number, endDay: number) {
  return books.map(b => {
    let weekOnline = 0;
    let weekOffline = 0;
    let weekPressReceipt = 0;
    let weekReturns = 0;

    for (let d = startDay; d <= endDay; d++) {
      const boibari = Number(b.boibari?.[d]) || 0;
      const rokomari = Number(b.rokomari?.[d]) || 0;
      const wafilife = Number(b.wafilife?.[d]) || 0;
      const others = Number(b.othersOnline?.[d]) || 0;
      weekOnline += boibari + rokomari + wafilife + others;

      const ho = Number(b.headOfficeSellOffline?.[d]) || 0;
      const nilkhet = Number(b.nilkhetLibrary?.[d]) || 0;
      const sumona = Number(b.sumonaLibrary?.[d]) || 0;
      const promise = Number(b.promiseLibrary?.[d]) || 0;
      const joystar = Number(b.joystarLibrary?.[d]) || 0;
      weekOffline += ho + nilkhet + sumona + promise + joystar;

      weekPressReceipt += Number(b.pressDailyReceipts?.[d]) || 0;
      weekReturns += Number(b.dailyReturns?.[d]) || 0;
    }

    const totalSold = weekOnline + weekOffline;
    const profitPerUnit = Number(b.perBookAmount || 0) - (Number(b.adCost || 0) + Number(b.makingCost || 0));
    const revenue = totalSold * (Number(b.perBookAmount) || 0);
    const profit = totalSold * profitPerUnit;

    return {
      bookId: b.id,
      sl: b.sl,
      bookName: b.bookName,
      perBookAmount: b.perBookAmount,
      profitPerBook: profitPerUnit,
      onlineSold: weekOnline,
      offlineSold: weekOffline,
      totalSold,
      pressReceipt: weekPressReceipt,
      returns: weekReturns,
      revenue,
      profit,
    };
  });
}

export function formatBDT(amount: number, lang?: AppLanguage): string {
  const activeLang = lang || getAppLanguage();
  if (activeLang === 'en') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(amount).replace('BDT', '৳');
  }
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('BDT', '৳');
}

export function formatNumber(num: number, lang?: AppLanguage): string {
  const activeLang = lang || getAppLanguage();
  if (activeLang === 'en') {
    return new Intl.NumberFormat('en-US').format(num);
  }
  return new Intl.NumberFormat('bn-BD').format(num);
}

export function createFreshMonthBooks(catalog: BookRecord[]): BookRecord[] {
  return catalog.map(b => ({
    ...b,
    pressDailyReceipts: {},
    boibari: {},
    rokomari: {},
    wafilife: {},
    othersOnline: {},
    headOfficeSellOffline: {},
    nilkhetLibrary: {},
    sumonaLibrary: {},
    promiseLibrary: {},
    joystarLibrary: {},
    dailyReturns: {},
    marketing: 0,
    service: 0,
    adVideoMaking: 0,
    rd: 0,
    gift: 0,
    updatedAt: new Date().toISOString(),
  }));
}

// -------------------------------------------------------------
// Press Financials & Balance Calculation
// -------------------------------------------------------------

export interface PressBookLot {
  id?: string;
  lotName: string;
  date: string;
  quantity: number;
  makingCost: number;
  totalBill: number;
  orderNo?: string;
  notes?: string;
}

export interface PressBookAccount {
  bookId: string;
  sl: number;
  bookName: string;
  orderQuantity: number;
  orderCount: number;
  lots: PressBookLot[];
  makingCost: number;
  totalOrderBill: number;
  receivedCopies: number;
  receivedBill: number;
  totalPaid: number;
  dueOnOrder: number;
  dueOnReceived: number;
  isAdvance: boolean;
  statusText: string;
}

export interface PressAccountsSummary {
  totalOrderBill: number;
  totalReceivedBill: number;
  totalPaidToPress: number;
  netDueOnOrder: number;
  netDueOnReceived: number;
  bookAccounts: PressBookAccount[];
  unallocatedPayments: number;
}

export function calculatePressAccounts(
  books: BookRecord[],
  pressPayments: PressPaymentRecord[],
  pressOrders?: PressOrderRecord[]
): PressAccountsSummary {
  let totalOrderBill = 0;
  let totalReceivedBill = 0;
  let totalPaidToPress = 0;

  const totalPaymentsSum = pressPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  totalPaidToPress = totalPaymentsSum;

  const bookAccounts: PressBookAccount[] = books.map(book => {
    const bookOrders = pressOrders ? pressOrders.filter(po => po.bookId === book.id) : [];
    const orderQuantity = bookOrders.length > 0
      ? bookOrders.reduce((sum, o) => sum + (Number(o.orderQuantity) || 0), 0)
      : (Number(book.totalOrderFaridBhai) || 0);

    const makingCost = Number(book.makingCost) || 0;

    const bOrderBill = bookOrders.length > 0
      ? bookOrders.reduce((sum, o) => sum + ((Number(o.orderQuantity) || 0) * (Number(o.makingCost) || makingCost)), 0)
      : (orderQuantity * makingCost);

    const lots: PressBookLot[] = bookOrders.map(o => ({
      id: o.id,
      lotName: o.lotName || 'প্রেস অর্ডার',
      date: o.orderDate,
      quantity: Number(o.orderQuantity) || 0,
      makingCost: Number(o.makingCost) || makingCost,
      totalBill: Number(o.totalBill) || ((Number(o.orderQuantity) || 0) * (Number(o.makingCost) || makingCost)),
      orderNo: o.orderNo,
      notes: o.notes,
    }));

    const receivedHO = sumDaily(book.pressDailyReceipts);
    const sumona = sumDaily(book.sumonaLibrary);
    const promise = sumDaily(book.promiseLibrary);
    const joystar = sumDaily(book.joystarLibrary);
    const receivedCopies = receivedHO + sumona + promise + joystar;
    const bReceivedBill = receivedCopies * makingCost;

    // Payments specifically assigned to this book
    const specificPaid = pressPayments
      .filter(p => p.bookId === book.id)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // If only 1 book exists in system, all payments map to it
    const assignedPaid = books.length === 1 ? totalPaymentsSum : specificPaid;

    const dueOnOrder = bOrderBill - assignedPaid;
    const dueOnReceived = bReceivedBill - assignedPaid;
    const isAdvance = assignedPaid > bOrderBill;

    let statusText = 'পরিশোধিত';
    if (assignedPaid > bOrderBill) {
      statusText = `আমরা অগ্রিম পাবো (৳${formatNumber(assignedPaid - bOrderBill)})`;
    } else if (dueOnOrder > 0) {
      statusText = `প্রেস পাবে (৳${formatNumber(dueOnOrder)})`;
    }

    totalOrderBill += bOrderBill;
    totalReceivedBill += bReceivedBill;

    return {
      bookId: book.id,
      sl: book.sl,
      bookName: book.bookName,
      orderQuantity,
      orderCount: bookOrders.length,
      lots,
      makingCost,
      totalOrderBill: bOrderBill,
      receivedCopies,
      receivedBill: bReceivedBill,
      totalPaid: assignedPaid,
      dueOnOrder,
      dueOnReceived,
      isAdvance,
      statusText,
    };
  });

  const specificAssignedTotal = bookAccounts.reduce((sum, b) => sum + b.totalPaid, 0);
  const unallocatedPayments = Math.max(0, totalPaymentsSum - specificAssignedTotal);

  return {
    totalOrderBill,
    totalReceivedBill,
    totalPaidToPress,
    netDueOnOrder: totalOrderBill - totalPaidToPress,
    netDueOnReceived: totalReceivedBill - totalPaidToPress,
    bookAccounts,
    unallocatedPayments,
  };
}

// -------------------------------------------------------------
// Online & Offline Channel Due / Collection Calculation
// -------------------------------------------------------------

export interface ChannelDueAccount {
  key: string;
  name: string;
  type: 'online' | 'offline';
  category: string;
  totalCopies: number;
  totalBilled: number;
  totalCollected: number;
  dueAmount: number;
  advanceAmount: number;
  collectionRate: number; // percentage
  statusText: string;
}

export interface ChannelAccountsSummary {
  onlineBilled: number;
  onlineCollected: number;
  onlineDue: number;
  offlineBilled: number;
  offlineCollected: number;
  offlineDue: number;
  totalBilled: number;
  totalCollected: number;
  totalDue: number;
  channels: ChannelDueAccount[];
}

export function calculateChannelDueAccounts(
  books: BookRecord[],
  channelCollections: ChannelCollectionRecord[],
  channelsList: ChannelConfig[] = DEFAULT_CHANNELS
): ChannelAccountsSummary {
  let onlineBilled = 0;
  let onlineCollected = 0;
  let offlineBilled = 0;
  let offlineCollected = 0;

  const channels: ChannelDueAccount[] = channelsList.map(ch => {
    // Total copies sold across all books for this channel
    let totalCopies = 0;
    let totalBilled = 0;

    books.forEach(b => {
      const channelMap = getBookChannelSales(b, ch.id);
      const copies = sumDaily(channelMap);
      totalCopies += copies;
      totalBilled += copies * (Number(b.perBookAmount) || 0);
    });

    const totalCollected = channelCollections
      .filter(c => c.channelKey === ch.id)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    const dueAmount = Math.max(0, totalBilled - totalCollected);
    const advanceAmount = Math.max(0, totalCollected - totalBilled);
    const collectionRate = totalBilled > 0 ? Math.min(100, (totalCollected / totalBilled) * 100) : 100;

    let statusText = 'পরিশোধিত';
    if (dueAmount > 0) {
      statusText = `বকেয়া আছে (৳${formatNumber(dueAmount)})`;
    } else if (advanceAmount > 0) {
      statusText = `অতিরিক্ত জমা (৳${formatNumber(advanceAmount)})`;
    }

    if (ch.type === 'online') {
      onlineBilled += totalBilled;
      onlineCollected += totalCollected;
    } else {
      offlineBilled += totalBilled;
      offlineCollected += totalCollected;
    }

    return {
      key: ch.id,
      name: ch.name,
      type: ch.type,
      category: ch.category || (ch.type === 'online' ? 'অনলাইন' : 'অফলাইন'),
      totalCopies,
      totalBilled,
      totalCollected,
      dueAmount,
      advanceAmount,
      collectionRate,
      statusText,
    };
  });

  return {
    onlineBilled,
    onlineCollected,
    onlineDue: Math.max(0, onlineBilled - onlineCollected),
    offlineBilled,
    offlineCollected,
    offlineDue: Math.max(0, offlineBilled - offlineCollected),
    totalBilled: onlineBilled + offlineBilled,
    totalCollected: onlineCollected + offlineCollected,
    totalDue: Math.max(0, (onlineBilled + offlineBilled) - (onlineCollected + offlineCollected)),
    channels,
  };
}

// -------------------------------------------------------------
// Multi-Period Definitions (Quarters, Half-Years)
// -------------------------------------------------------------

export interface PeriodOption {
  key: string;
  label: string;
  startMonth: number;
  endMonth: number;
}

export const QUARTER_OPTIONS: PeriodOption[] = [
  { key: 'q1', label: '১ম কোয়ার্টার (Q1: জানুয়ারি - মার্চ)', startMonth: 1, endMonth: 3 },
  { key: 'q2', label: '২য় কোয়ার্টার (Q2: এপ্রিল - জুন)', startMonth: 4, endMonth: 6 },
  { key: 'q3', label: '৩য় কোয়ার্টার (Q3: জুলাই - সেপ্টেম্বর)', startMonth: 7, endMonth: 9 },
  { key: 'q4', label: '৪র্থ কোয়ার্টার (Q4: অক্টোবর - ডিসেম্বর)', startMonth: 10, endMonth: 12 },
];

export const HALF_YEAR_OPTIONS: PeriodOption[] = [
  { key: 'h1', label: '১ম ষাণ্মাসিক (H1: জানুয়ারি - জুন)', startMonth: 1, endMonth: 6 },
  { key: 'h2', label: '২য় ষাণ্মাসিক (H2: জুলাই - ডিসেম্বর)', startMonth: 7, endMonth: 12 },
];


