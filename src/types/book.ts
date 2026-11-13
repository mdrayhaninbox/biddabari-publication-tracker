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
  edition?: string; // e.g. "1st Edition", "2nd Edition", "১ম সংস্করণ"
  publishMonth?: string; // e.g. "January, 2025", "জানুয়ারি ২০২৫"
  category?: string; // e.g. "NTRCA", "Digest", "Primary", "BCS"

  // Dynamic / Custom Channel Daily Sales
  customChannelSales?: {
    [channelId: string]: DailyChannelSales;
  };
  [key: string]: any;
}

export const DEFAULT_BOOK_CATEGORIES: string[] = ['NTRCA', 'Digest'];

export type ActiveTab = 'dashboard' | 'period' | 'accounts' | 'entry' | 'books' | 'matrix' | 'reports';

export type PaymentMethod = 'cash' | 'bank' | 'check' | 'bkash' | 'nagad' | 'other';

export interface PressOrderRecord {
  id: string;
  bookId: string;
  bookName: string;
  pressId?: string; // Optional press ID (defaults to Farid Bhai Press)
  pressName?: string; // e.g. "ফরিদ ভাই প্রেস", "বর্ণালী প্রেস"
  orderDate: string; // YYYY-MM-DD
  orderQuantity: number;
  lotName?: string; // e.g. "১ম মুদ্রণ", "২য় মুদ্রণ", "রি-অর্ডার লট-২"
  makingCost?: number;
  totalBill?: number;
  orderNo?: string;
  notes?: string;
  voucherImage?: string; // Base64 image data URL (Optional voucher / PO slip photo)
  createdAt: string;
}

export interface PressDeliveryRecord {
  id: string;
  bookId: string;
  bookName: string;
  pressId?: string; // Optional press ID
  pressName?: string; // e.g. "ফরিদ ভাই প্রেস", "বর্ণালী প্রেস"
  deliveryDate: string; // YYYY-MM-DD
  quantity: number;
  chalanNo: string;
  lotName?: string;
  receivedBy?: string;
  notes?: string;
  voucherImage?: string; // Base64 image data URL (Optional delivery chalan photo)
  createdAt: string;
}

export interface PressPaymentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  bookId?: string; // Optional: specific book or all/general
  bookName?: string;
  pressId?: string; // Optional press ID
  pressName?: string; // e.g. "ফরিদ ভাই প্রেস", "বর্ণালী প্রেস"
  amount: number;
  paymentMethod: PaymentMethod;
  voucherNo?: string;
  notes?: string;
  voucherImage?: string; // Base64 image data URL (Optional voucher / cheque photo)
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
  voucherImage?: string; // Base64 image data URL (Optional money receipt / voucher photo)
  receiptImage?: string; // Alias
  createdAt: string;
}

export type ChannelType = 'online' | 'offline' | 'press';

export interface ChannelConfig {
  id: string; // unique key, e.g. 'boibari', 'nilkhetLibrary', 'faridBhaiPress', 'press_123'
  name: string; // Bangla display name, e.g. 'নীলক্ষেত লাইব্রেরি' or 'ফরিদ ভাই প্রেস'
  nameEn?: string; // English display name, e.g. 'Nilkhet Library' or 'Farid Bhai Press'
  type: ChannelType;
  source?: 'headOffice' | 'press'; // for offline: 'headOffice' (from HO) or 'press' (directly from Press)
  pressId?: string; // if supplied from a specific press
  address?: string; // optional address/location for press or library
  phone?: string; // optional contact phone
  contactPhone?: string; // optional contact phone
  category?: string;
  isSystemDefault?: boolean;
}

export const DEFAULT_CHANNELS: ChannelConfig[] = [
  { id: 'faridBhaiPress', name: 'ফরিদ ভাই প্রেস (Farid Bhai Press)', nameEn: 'Farid Bhai Press', type: 'press', category: 'প্রধান প্রিন্টিং ও বাঁধাই প্রেস', isSystemDefault: true },
  { id: 'boibari', name: 'বইবাড়ি (Boibari)', nameEn: 'Boibari', type: 'online', category: 'অনলাইন ই-কমার্স', isSystemDefault: true },
  { id: 'rokomari', name: 'রকমারি (Rokomari)', nameEn: 'Rokomari', type: 'online', category: 'অনলাইন ই-কমার্স', isSystemDefault: true },
  { id: 'wafilife', name: 'ওয়াফিলাইফ (Wafilife)', nameEn: 'Wafilife', type: 'online', category: 'অনলাইন ই-কমার্স', isSystemDefault: true },
  { id: 'othersOnline', name: 'অন্যান্য অনলাইন লাইব্রেরি', nameEn: 'Others Online', type: 'online', category: 'অনলাইন প্ল্যাটফর্ম', isSystemDefault: true },
  { id: 'sumonaLibrary', name: 'সুমনা লাইব্রেরি (Sumona Library)', nameEn: 'Sumona Library', type: 'offline', source: 'press', pressId: 'faridBhaiPress', category: 'ডিলার লাইব্রেরি (প্রেস থেকে সরাসরি)', isSystemDefault: true },
  { id: 'promiseLibrary', name: 'প্রমিজ লাইব্রেরি (Promise Library)', nameEn: 'Promise Library', type: 'offline', source: 'press', pressId: 'faridBhaiPress', category: 'ডিলার লাইব্রেরি (প্রেস থেকে সরাসরি)', isSystemDefault: true },
  { id: 'joystarLibrary', name: 'জয়স্টার লাইব্রেরি (Joystar Library)', nameEn: 'Joystar Library', type: 'offline', source: 'press', pressId: 'faridBhaiPress', category: 'ডিলার লাইব্রেরি (প্রেস থেকে সরাসরি)', isSystemDefault: true },
  { id: 'nilkhetLibrary', name: 'নীলক্ষেত লাইব্রেরি (Nilkhet)', nameEn: 'Nilkhet Library', type: 'offline', source: 'headOffice', category: 'লোকাল মার্কেট (হেড অফিস সরবরাহ)', isSystemDefault: true },
  { id: 'headOfficeSellOffline', name: 'হেড অফিস সরাসরি অফলাইন বিক্রয়', nameEn: 'Head Office Direct Counter', type: 'offline', source: 'headOffice', category: 'হেড অফিস সরাসরি', isSystemDefault: true },
];

export interface ChannelInfo {
  key: string;
  name: string;
  type: ChannelType;
  category: string;
}

export const SALES_CHANNELS: ChannelInfo[] = DEFAULT_CHANNELS.map(c => ({
  key: c.id,
  name: c.name,
  type: c.type,
  category: c.category || (c.type === 'online' ? 'অনলাইন' : 'অফলাইন'),
}));
