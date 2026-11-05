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
