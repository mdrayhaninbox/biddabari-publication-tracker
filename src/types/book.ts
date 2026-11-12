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
  initialOrderDate?: string;
  initialLotName?: string;
}

export type ActiveTab = 'dashboard' | 'period' | 'accounts' | 'entry' | 'books' | 'matrix' | 'reports';

export type PaymentMethod = 'cash' | 'bank' | 'check' | 'bkash' | 'nagad' | 'other';

export interface PressOrderRecord {
  id: string;
  bookId: string;
  bookName: string;
  orderDate: string; // YYYY-MM-DD
  orderQuantity: number;
  lotName?: string; // e.g. "১ম মুদ্রণ", "২য় মুদ্রণ", "রি-অর্ডার লট-২"
  makingCost?: number;
  totalBill?: number;
  orderNo?: string;
  notes?: string;
  createdAt: string;
}

export interface PressDeliveryRecord {
  id: string;
  bookId: string;
  bookName: string;
  deliveryDate: string; // YYYY-MM-DD
  quantity: number;
  chalanNo: string;
  lotName?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface PressPaymentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  bookId?: string; // Optional: specific book or all/general
  bookName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  voucherNo?: string;
  notes?: string;
  createdAt: string;
}

export interface ChannelCollectionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  channelKey: string;
  channelName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  receiptNo?: string;
  notes?: string;
  createdAt: string;
}

export interface ChannelInfo {
  key: string;
  name: string;
  type: 'online' | 'offline';
  category: string;
}

export const SALES_CHANNELS: ChannelInfo[] = [
  { key: 'boibari', name: 'বইবাড়ি (Boibari)', type: 'online', category: 'অনলাইন ই-কমার্স' },
  { key: 'rokomari', name: 'রকমারি (Rokomari)', type: 'online', category: 'অনলাইন ই-কমার্স' },
  { key: 'wafilife', name: 'ওয়াফিলাইফ (Wafilife)', type: 'online', category: 'অনলাইন ই-কমার্স' },
  { key: 'othersOnline', name: 'অন্যান্য অনলাইন লাইব্রেরি', type: 'online', category: 'অনলাইন প্ল্যাটফর্ম' },
  { key: 'sumonaLibrary', name: 'সুমনা লাইব্রেরি (Sumona Library)', type: 'offline', category: 'ডিলার লাইব্রেরি (প্রেস সরবরাহ)' },
  { key: 'promiseLibrary', name: 'প্রমিজ লাইব্রেরি (Promise Library)', type: 'offline', category: 'ডিলার লাইব্রেরি (প্রেস সরবরাহ)' },
  { key: 'joystarLibrary', name: 'জয়স্টার লাইব্রেরি (Joystar Library)', type: 'offline', category: 'ডিলার লাইব্রেরি (প্রেস সরবরাহ)' },
  { key: 'nilkhetLibrary', name: 'নীলক্ষেত লাইব্রেরি (Nilkhet)', type: 'offline', category: 'লোকাল মার্কেট (হেড অফিস)' },
  { key: 'headOfficeSellOffline', name: 'হেড অফিস কাউন্টার বিক্রয়', type: 'offline', category: 'হেড অফিস সরাসরি' },
];
