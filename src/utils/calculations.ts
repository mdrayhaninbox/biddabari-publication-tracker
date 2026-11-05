import { BookRecord, DailyChannelSales } from '../types/book';

export function sumDaily(salesMap: DailyChannelSales = {}): number {
  if (!salesMap) return 0;
  return Object.values(salesMap).reduce((sum, val) => sum + (Number(val) || 0), 0);
}

export function getDailyTotalForDay(salesMap: DailyChannelSales = {}, day: number): number {
  return Number(salesMap[day]) || 0;
}

export function calculateBookMetrics(book: BookRecord) {
  const adCost = Number(book.adCost) || 0;
  const makingCost = Number(book.makingCost) || 0;
  const perBookAmount = Number(book.perBookAmount) || 0;
  const profitPerBook = perBookAmount - (adCost + makingCost);

  // Press receipts
  const faridBhaiToHeadOffice = sumDaily(book.pressDailyReceipts);

  // Online Sales (Boibari, Rokomari, Wafilife, Others Online)
  const boibariTotal = sumDaily(book.boibari);
  const rokomariTotal = sumDaily(book.rokomari);
  const wafilifeTotal = sumDaily(book.wafilife);
  const othersOnlineTotal = sumDaily(book.othersOnline);
  const totalOnlineSell = boibariTotal + rokomariTotal + wafilifeTotal + othersOnlineTotal;

  // Offline Sales
  const headOfficeOfflineTotal = sumDaily(book.headOfficeSellOffline);
  const nilkhetTotal = sumDaily(book.nilkhetLibrary);
  const sumonaTotal = sumDaily(book.sumonaLibrary);
  const promiseTotal = sumDaily(book.promiseLibrary);
  const joystarTotal = sumDaily(book.joystarLibrary);
  const totalOfflineSell = headOfficeOfflineTotal + nilkhetTotal + sumonaTotal + promiseTotal + joystarTotal;

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
  // Formula: Total Order - Sent to Head Office - Direct Libraries (Sumona + Promise + Joystar)
  const totalOrderFaridBhai = Number(book.totalOrderFaridBhai) || 0;
  const stockToFaridBhai = totalOrderFaridBhai - faridBhaiToHeadOffice - sumonaTotal - promiseTotal - joystarTotal;

  // Stock at Head Office
  // Formula: (Received from Press - Online Sales - HO Offline - Nilkhet - Promo copies) + Returns
  const stockDispatchedFromHO = totalOnlineSell + headOfficeOfflineTotal + nilkhetTotal + totalPromo;
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
  name: string; // e.g. "সপ্তাহ ১ (দিন ১-৭)"
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

export function calculateWeekBreakdowns(books: BookRecord[]): WeekBreakdown[] {
  const weekDefinitions = [
    { weekNumber: 1, name: 'সপ্তাহ ১', startDay: 1, endDay: 7 },
    { weekNumber: 2, name: 'সপ্তাহ ২', startDay: 8, endDay: 14 },
    { weekNumber: 3, name: 'সপ্তাহ ৩', startDay: 15, endDay: 21 },
    { weekNumber: 4, name: 'সপ্তাহ ৪', startDay: 22, endDay: 28 },
    { weekNumber: 5, name: 'সপ্তাহ ৫', startDay: 29, endDay: 31 },
  ];

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
      name: `${w.name} (দিন ${w.startDay} - ${w.endDay})`,
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

export function formatBDT(amount: number): string {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('BDT', '৳');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('bn-BD').format(num);
}
