export type Language = 'bn' | 'en';
export type Theme = 'classic' | 'dark' | 'navy' | 'emerald';

export interface ThemeOption {
  key: Theme;
  nameBn: string;
  nameEn: string;
  iconBg: string;
  accentClass: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    key: 'classic',
    nameBn: 'ক্লাসিক ব্ল্যাক অ্যান্ড হোয়াইট',
    nameEn: 'Classic Monochrome',
    iconBg: '#18181b',
    accentClass: 'bg-zinc-900 text-white',
  },
  {
    key: 'dark',
    nameBn: 'মিডনাইট ডার্ক মোড',
    nameEn: 'Midnight Dark Mode',
    iconBg: '#0f172a',
    accentClass: 'bg-slate-900 text-sky-400',
  },
  {
    key: 'navy',
    nameBn: 'রয়্যাল নেভি ব্লু',
    nameEn: 'Royal Navy Blue',
    iconBg: '#1e3a8a',
    accentClass: 'bg-blue-900 text-white',
  },
  {
    key: 'emerald',
    nameBn: 'ডিপ এমেরাল্ড গ্রিন',
    nameEn: 'Deep Emerald Green',
    iconBg: '#065f46',
    accentClass: 'bg-emerald-900 text-white',
  },
];

export const translations = {
  // Brand
  brandName: { bn: 'বিদ্যাবাড়ি পাবলিকেশন', en: 'Biddabari Publication' },
  tagline: { bn: 'বুক ট্র্যাকার', en: 'Book Tracker' },
  ledgerSub: { bn: 'এর খতিয়ান', en: 'Ledger' },
  booksCount: { bn: 'টি বই', en: 'Books' },

  // Header Actions
  quickEntry: { bn: 'সহজ এন্ট্রি', en: 'Quick Entry' },
  newBook: { bn: 'নতুন বই', en: 'New Book' },
  export: { bn: 'এক্সপোর্ট', en: 'Export' },
  import: { bn: 'ইমপোর্ট', en: 'Import' },
  reset: { bn: 'রিসেট (০)', en: 'Reset (0)' },
  print: { bn: 'প্রিন্ট', en: 'Print' },
  theme: { bn: 'কালার থিম', en: 'Theme' },
  language: { bn: 'ভাষা', en: 'Language' },

  // Navigation Tabs
  dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  periodView: { bn: 'দৈনিক / সাপ্তাহিক / মাসিক ভিউ', en: 'Daily / Weekly / Monthly' },
  accountsDue: { bn: 'প্রেস ও ডিউ হিসাব', en: 'Accounts & Dues' },
  dataInput: { bn: 'সহজ ডেটা এন্ট্রি', en: 'Data Input' },
  booksCatalog: { bn: 'বই তালিকা ও স্টক খতিয়ান', en: 'Book Catalog' },
  matrixView: { bn: '৩১ দিনের সম্পূর্ণ ম্যাট্রিক্স', en: '31-Day Matrix' },
  reportsPrint: { bn: 'রিপোর্ট ও প্রিন্ট', en: 'Reports & Print' },

  // Dashboard KPIs
  hoStock: { bn: 'হেড অফিস স্টক', en: 'Head Office Stock' },
  pressStock: { bn: 'ফরিদ ভাই (প্রেস) স্টক', en: 'Farid Bhai (Press) Stock' },
  totalSold: { bn: 'মোট বিক্রয়', en: 'Total Sold' },
  totalRevenue: { bn: 'মোট রাজস্ব (Revenue)', en: 'Total Revenue' },
  totalProfit: { bn: 'মোট নিট লাভ (Profit)', en: 'Total Net Profit' },
  returnsPromo: { bn: 'রিটার্ন ও প্রমোশন', en: 'Returns & Promo' },
  copies: { bn: 'কপি', en: 'copies' },
  online: { bn: 'অনলাইন', en: 'Online' },
  offline: { bn: 'অফলাইন', en: 'Offline' },

  // Accounts & Due Sub-tabs
  pressPaymentTab: { bn: 'প্রেস পেমেন্ট ও ব্যালেন্স', en: 'Press Payments & Balance' },
  pressOrderMgmtTab: { bn: 'প্রেস অর্ডার ম্যানেজমেন্ট', en: 'Press Order Management' },
  channelDueTab: { bn: 'অনলাইন ও অফলাইন ডিউ', en: 'Online & Offline Dues' },

  // Press Order Management
  pressOrdersList: { bn: '১. প্রেসে প্রদানকৃত অর্ডার তালিকা (Press Order List)', en: '1. Press Orders List' },
  pressDeliveriesList: { bn: '২. প্রেস থেকে আসা বইয়ের চালান তালিকা (Received Books From Press)', en: '2. Received Books From Press' },
  btnNewPressOrder: { bn: '+ নতুন প্রেস অর্ডার', en: '+ New Press Order' },
  btnReceiveDelivery: { bn: '+ প্রেস চালান গ্রহণ', en: '+ Receive Press Chalan' },
  searchVoucherPlaceholder: { bn: 'ভাউচার / চালান নং বা বিবরণ দিয়ে খুঁজুন...', en: 'Find by Voucher / Chalan No...' },
  allBooksFilter: { bn: 'সবগুলো বই', en: 'All Books' },
  selectBook: { bn: 'বই নির্বাচন:', en: 'Select Book:' },
  orderQty: { bn: 'মোট প্রেস অর্ডার কপি', en: 'Total Press Order Copies' },
  receivedQty: { bn: 'প্রেস থেকে প্রাপ্ত চালান', en: 'Received from Press' },
  remainingPress: { bn: 'প্রেসে অবশিষ্ট ব্যালেন্স', en: 'Pending at Press' },
  totalOrderCost: { bn: 'মোট প্রেস অর্ডার চুক্তি বিল', en: 'Total Order Bill' },

  // Table Columns
  date: { bn: 'তারিখ', en: 'Date' },
  voucherNo: { bn: 'ভাউচার / চালান নং', en: 'Voucher / Chalan No' },
  bookName: { bn: 'বইয়ের নাম', en: 'Book Name' },
  lotName: { bn: 'সংস্করণ / লট', en: 'Edition / Lot' },
  quantity: { bn: 'কপি সংখ্যা', en: 'Quantity' },
  makingCost: { bn: 'ছাপার খরচ', en: 'Making Cost' },
  totalBill: { bn: 'মোট বিল', en: 'Total Bill' },
  notes: { bn: 'নোট / বিবরণ', en: 'Notes / Remarks' },
  action: { bn: 'অ্যাকশন', en: 'Action' },
  paidAmount: { bn: 'পরিশোধিত টাকা', en: 'Paid Amount' },
  dueBalance: { bn: 'বাকি / ব্যালেন্স', en: 'Due Balance' },
  status: { bn: 'স্ট্যাটাস', en: 'Status' },
  receivedBy: { bn: 'গ্রহীতা / ওয়্যারহাউস', en: 'Received By' },

  // Common
  total: { bn: 'সর্বমোট:', en: 'Total:' },
  deleteConfirm: { bn: 'আপনি কি নিশ্চিত যে এটি মুছে ফেলতে চান?', en: 'Are you sure you want to delete this?' },
};

export function t(key: keyof typeof translations, lang: Language): string {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item['bn'] || key;
}
