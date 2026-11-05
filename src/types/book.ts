export interface DailyChannelSales {
  [day: number]: number;
}

export interface BookRecord {
  id: string;
  sl: number;
  bookName: string;
  adCost: number;
  makingCost: number;
  perBookAmount: number;
  profitPerBook: number;

  // Farid Bhai / Press
  totalOrderFaridBhai: number;
  pressDailyReceipts: DailyChannelSales; // Days 1..31

  // Online Sales (Dispatched from Head Office)
  boibari: DailyChannelSales;
  rokomari: DailyChannelSales;
  wafilife: DailyChannelSales;
  othersOnline: DailyChannelSales;

  // Offline Sales
  // Dispatched from Head Office
  headOfficeSellOffline: DailyChannelSales;
  nilkhetLibrary: DailyChannelSales;

  // Dispatched directly from Farid Bhai / Press to Libraries
  sumonaLibrary: DailyChannelSales;
  promiseLibrary: DailyChannelSales;
  joystarLibrary: DailyChannelSales;

  // Daily Returns (Received back at Head Office)
  dailyReturns: DailyChannelSales;

  // Promotional / Departmental distributions
  marketing: number;
  service: number;
  adVideoMaking: number;
  rd: number;
  gift: number;

  remarks?: string;
  updatedAt?: string;
}

export type ActiveTab = 'dashboard' | 'period' | 'entry' | 'books' | 'matrix' | 'reports';
