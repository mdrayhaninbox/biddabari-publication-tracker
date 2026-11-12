import React, { useState } from 'react';
import { 
  Printer, 
  BookOpen, 
  Download, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Layers,
  Clock,
  TrendingUp,
  Filter,
  CreditCard,
  HandCoins,
  Globe,
  Store,
  CheckSquare,
  Square,
  Settings2
} from 'lucide-react';
import { BookRecord, PressPaymentRecord, ChannelCollectionRecord, PressOrderRecord, PressDeliveryRecord, ChannelConfig, DEFAULT_CHANNELS } from '../types/book';
import { 
  calculateBookMetrics, 
  calculateDayBreakdown, 
  calculateWeekBreakdowns, 
  calculateWeekBookBreakdown,
  calculatePressAccounts,
  calculateChannelDueAccounts,
  formatBDT, 
  formatNumber,
  formatMonthYearBengali,
  formatYearBengali,
  QUARTER_OPTIONS,
  HALF_YEAR_OPTIONS,
  AVAILABLE_YEARS
} from '../utils/calculations';
import { exportBooksToExcel } from '../utils/excelHandler';
import { Language, tr } from '../utils/i18n';

interface PrintableReportProps {
  books: BookRecord[];
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
  pressPayments?: PressPaymentRecord[];
  pressOrders?: PressOrderRecord[];
  pressDeliveries?: PressDeliveryRecord[];
  channelCollections?: ChannelCollectionRecord[];
  initialSelectedBookId?: string;
  language?: Language;
  channels?: ChannelConfig[];
}

export type ReportType = 'monthly' | 'daily' | 'weekly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
export type PrintScope = 'all' | 'press' | 'online' | 'offline' | 'sales_due' | 'custom';
export type SalesMode = 'all' | 'online' | 'offline' | 'none';

export const PrintableReport: React.FC<PrintableReportProps> = ({ 
  books,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
  pressPayments = [],
  pressOrders = [],
  pressDeliveries = [],
  channelCollections = [],
  initialSelectedBookId,
  language = 'en',
  channels = DEFAULT_CHANNELS,
}) => {
  const effectiveChannels = channels && channels.length > 0 ? channels : DEFAULT_CHANNELS;
  // Time period filter state
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('q4');
  const [selectedHalfYear, setSelectedHalfYear] = useState<string>('h2');
  const [reportYear, setReportYear] = useState<number>(selectedYear);

  const [customStartDate, setCustomStartDate] = useState<string>(
    `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  );

  // Book Selection State: 'all' | 'single' | 'multiple'
  const [bookSelectionMode, setBookSelectionMode] = useState<'all' | 'single' | 'multiple'>(() => {
    return initialSelectedBookId ? 'single' : 'all';
  });

  const [selectedSingleBookId, setSelectedSingleBookId] = useState<string>(() => {
    if (initialSelectedBookId && books.some(b => b.id === initialSelectedBookId)) {
      return initialSelectedBookId;
    }
    return books[0]?.id || '';
  });

  const [selectedMultipleBookIds, setSelectedMultipleBookIds] = useState<string[]>(() => {
    if (initialSelectedBookId) {
      return [initialSelectedBookId];
    }
    return books.map(b => b.id);
  });

  // Keep single and multi-selection in sync when initialSelectedBookId changes
  React.useEffect(() => {
    if (initialSelectedBookId && books.some(b => b.id === initialSelectedBookId)) {
      setBookSelectionMode('single');
      setSelectedSingleBookId(initialSelectedBookId);
      setSelectedMultipleBookIds([initialSelectedBookId]);
    }
  }, [initialSelectedBookId, books]);

  // Derive Effective Books based on selection
  const effectiveBooks = React.useMemo(() => {
    if (books.length === 0) return [];
    if (bookSelectionMode === 'single') {
      const found = books.find(b => b.id === selectedSingleBookId);
      return found ? [found] : [books[0]];
    }
    if (bookSelectionMode === 'multiple') {
      const selected = books.filter(b => selectedMultipleBookIds.includes(b.id));
      return selected.length > 0 ? selected : books;
    }
    return books;
  }, [books, bookSelectionMode, selectedSingleBookId, selectedMultipleBookIds]);

  // Selective Printing Controls (প্রেস, অনলাইন, অফলাইন আলাদা বা একসাথে)
  const [scope, setScope] = useState<PrintScope>('all');
  const [salesMode, setSalesMode] = useState<SalesMode>('all');
  const [includePressAccounts, setIncludePressAccounts] = useState<boolean>(true);
  const [includePressPayments, setIncludePressPayments] = useState<boolean>(true);
  const [includeOnlineDue, setIncludeOnlineDue] = useState<boolean>(true);
  const [includeOfflineDue, setIncludeOfflineDue] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [showCustomSettings, setShowCustomSettings] = useState<boolean>(false);

  // Handler for Preset Scope Selection
  const handleSelectScope = (newScope: PrintScope) => {
    setScope(newScope);
    if (newScope === 'all') {
      setSalesMode('all');
      setIncludePressAccounts(true);
      setIncludePressPayments(true);
      setIncludeOnlineDue(true);
      setIncludeOfflineDue(true);
    } else if (newScope === 'press') {
      setSalesMode('none');
      setIncludePressAccounts(true);
      setIncludePressPayments(true);
      setIncludeOnlineDue(false);
      setIncludeOfflineDue(false);
    } else if (newScope === 'online') {
      setSalesMode('online');
      setIncludePressAccounts(false);
      setIncludePressPayments(false);
      setIncludeOnlineDue(true);
      setIncludeOfflineDue(false);
    } else if (newScope === 'offline') {
      setSalesMode('offline');
      setIncludePressAccounts(false);
      setIncludePressPayments(false);
      setIncludeOnlineDue(false);
      setIncludeOfflineDue(true);
    } else if (newScope === 'sales_due') {
      setSalesMode('all');
      setIncludePressAccounts(false);
      setIncludePressPayments(false);
      setIncludeOnlineDue(true);
      setIncludeOfflineDue(true);
    }
  };

  const currentDate = language === 'en'
    ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

  // Press accounts and Channel Dues for Effective Books
  const pressAccounts = calculatePressAccounts(effectiveBooks, pressPayments, pressOrders);
  const channelAccounts = calculateChannelDueAccounts(effectiveBooks, channelCollections, effectiveChannels);

  // Filtered Press Payments for Effective Books
  const filteredPressPayments = React.useMemo(() => {
    return pressPayments.filter(p => {
      if (!p.bookId) return true;
      return effectiveBooks.some(b => b.id === p.bookId);
    });
  }, [pressPayments, effectiveBooks]);

  // Filtered Channels for Dues Section
  const filteredChannels = channelAccounts.channels.filter(ch => {
    if (includeOnlineDue && includeOfflineDue) return true;
    if (includeOnlineDue && !includeOfflineDue) return ch.type === 'online';
    if (!includeOnlineDue && includeOfflineDue) return ch.type === 'offline';
    return false;
  });

  // Monthly totals for Effective Books
  const monthlyTotals = effectiveBooks.reduce(
    (acc, b) => {
      const m = calculateBookMetrics(b);
      acc.totalHOStock += m.totalPresentStockHO;
      acc.totalPressStock += m.stockToFaridBhai;
      acc.totalSold += m.totalSold;
      acc.totalOnlineSold += m.totalOnlineSell;
      acc.totalOfflineSold += m.totalOfflineSell;
      acc.totalRevenue += m.totalRevenue;
      acc.totalProfit += m.totalNetProfit;
      acc.totalReturns += m.totalReturns;
      acc.totalPromo += m.totalPromo;

      // Channel specific sales totals
      acc.boibari += m.boibariTotal;
      acc.rokomari += m.rokomariTotal;
      acc.wafilife += m.wafilifeTotal;
      acc.othersOnline += m.othersOnlineTotal;
      acc.hoOffline += m.headOfficeOfflineTotal;
      acc.nilkhet += m.nilkhetTotal;
      acc.sumona += m.sumonaTotal;
      acc.promise += m.promiseTotal;
      acc.joystar += m.joystarTotal;
      return acc;
    },
    {
      totalHOStock: 0,
      totalPressStock: 0,
      totalSold: 0,
      totalOnlineSold: 0,
      totalOfflineSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalReturns: 0,
      totalPromo: 0,
      boibari: 0,
      rokomari: 0,
      wafilife: 0,
      othersOnline: 0,
      hoOffline: 0,
      nilkhet: 0,
      sumona: 0,
      promise: 0,
      joystar: 0,
    }
  );

  // Daily breakdown
  const dayData = calculateDayBreakdown(effectiveBooks, selectedDay);

  // Weekly breakdown
  const weekList = calculateWeekBreakdowns(effectiveBooks, daysInMonth);
  const currentWeek = weekList.find(w => w.weekNumber === selectedWeek) || weekList[0];
  const weekBooks = calculateWeekBookBreakdown(effectiveBooks, currentWeek.startDay, currentWeek.endDay);

  const currentQuarter = QUARTER_OPTIONS.find(q => q.key === selectedQuarter) || QUARTER_OPTIONS[3];
  const currentHalf = HALF_YEAR_OPTIONS.find(h => h.key === selectedHalfYear) || HALF_YEAR_OPTIONS[1];

  // Dynamic Report Sub-title
  const getReportScopeTitle = () => {
    let base = '';
    if (scope === 'press') {
      base = tr(
        'ফরিদ ভাই প্রেস হিসাব, চালান মূল্য, পেমেন্ট ভাউচার ও বকেয়া ব্যালেন্স বিবরণী প্রতিবেদন',
        'Farid Bhai Press Accounts, Invoices, Payment Vouchers & Due Balance Report',
        language
      );
    } else if (scope === 'online') {
      base = tr(
        'অনলাইন সেলস চ্যানেল (বইবাড়ি, রকমারি, ওয়াফিলাইফ ও অন্যান্য) বিক্রয় ও ডিউ কালেকশন খতিয়ান',
        'Online Sales Channels (Boibari, Rokomari, Wafilife & Others) Sales & Due Collection Ledger',
        language
      );
    } else if (scope === 'offline') {
      base = tr(
        'অফলাইন কাউন্টার ও ডিলার লাইব্রেরি (সুমনা, প্রমিজ, জয়স্টার, নীলক্ষেত) সেলস ও ডিউ খতিয়ান',
        'Offline Counter & Dealer Libraries (Sumona, Promise, Joystar, Nilkhet) Sales & Due Ledger',
        language
      );
    } else if (scope === 'sales_due') {
      base = tr(
        'অনলাইন ও অফলাইন চ্যানেল বিক্রয়, রাজস্ব ও ডিউ কালেকশন খতিয়ান প্রতিবেদন',
        'Online & Offline Channels Sales, Revenue & Due Collection Report',
        language
      );
    } else {
      base = tr(
        'সার্বিক বুক সেলস, স্টক ইনভেন্টরি, প্রেস হিসাব ও চ্যানেল ডিউ খতিয়ান প্রতিবেদন',
        'Comprehensive Book Sales, Stock Inventory, Press Accounts & Channel Due Report',
        language
      );
    }

    if (bookSelectionMode === 'single' && effectiveBooks[0]) {
      return `${base} • [${tr('একক বই', 'Single Book', language)}: ${effectiveBooks[0].bookName}]`;
    }
    if (bookSelectionMode === 'multiple' && effectiveBooks.length < books.length) {
      return `${base} • [${tr(`নির্বাচিত ${effectiveBooks.length} টি বইয়ের সমন্বিত রিপোর্ট`, `Combined Report for ${effectiveBooks.length} Selected Books`, language)}]`;
    }
    return base;
  };

  const getReportPeriodTitle = () => {
    if (reportType === 'daily') return tr(`তারিখ: ${selectedDay} ${formatMonthYearBengali(selectedMonth, selectedYear, language)}`, `Date: Day ${selectedDay}, ${formatMonthYearBengali(selectedMonth, selectedYear, language)}`, language);
    if (reportType === 'weekly') return `${currentWeek.name} (${currentWeek.startDay} - ${currentWeek.endDay} ${formatMonthYearBengali(selectedMonth, selectedYear, language)})`;
    if (reportType === 'monthly') return `${formatMonthYearBengali(selectedMonth, selectedYear, language)}`;
    if (reportType === 'quarterly') return `${currentQuarter.label} - ${formatYearBengali(reportYear, language)}`;
    if (reportType === 'half_yearly') return `${currentHalf.label} - ${formatYearBengali(reportYear, language)}`;
    if (reportType === 'yearly') return tr(`${formatYearBengali(reportYear, language)} সালের বার্ষিক খতিয়ান`, `Annual Report for Year ${formatYearBengali(reportYear, language)}`, language);
    if (reportType === 'custom') return `${customStartDate} - ${customEndDate}`;
    return '';
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* ======================================================== */}
      {/* Print Controls Bar (Hidden during printing) */}
      {/* ======================================================== */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4 max-w-6xl mx-auto w-full">
        
        {/* Top Header Row with Print & Export Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <span>{tr('অফিসিয়াল এক্সিকিউটিভ রিপোর্ট ও প্রিন্ট কনসোল', 'Official Executive Report & Print Console', language)}</span>
            </h2>
            <p className="text-xs text-zinc-500">
              {tr(
                'প্রেস হিসাব, অনলাইন সেলস, অফলাইন সেলস ও ডিউ খতিয়ান আলাদা আলাদা বা সমন্বিতভাবে প্রিন্ট করুন',
                'Print press accounts, online sales, offline sales, and dues separately or combined',
                language
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded-lg">
              📄 {tr('A4 সাইজ অটো-ফিট', 'A4 Size Auto-fit', language)}
            </span>

            <button
              onClick={() => exportBooksToExcel(books, selectedMonth, selectedYear)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-300"
            >
              <Download className="w-4 h-4 text-zinc-700" />
              <span>{tr('এক্সেল ফাইল', 'Excel File', language)}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{tr('A4 প্রিন্ট / PDF', 'A4 Print / PDF', language)}</span>
            </button>
          </div>
        </div>

        {/* 1. SELECTIVE SCOPE SWITCHER (প্রেস / অনলাইন / অফলাইন আলাদা ও একসাথে) */}
        <div className="pt-3 border-t border-zinc-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <span>{tr('প্রিন্টের বিষয়বস্তু নির্বাচন করুন (Scope):', 'Select Print Scope:', language)}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomSettings(prev => !prev)}
              className="text-xs font-semibold text-zinc-600 hover:text-black flex items-center gap-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showCustomSettings ? tr('কাস্টম সেটিং লুকান', 'Hide Custom Settings', language) : tr('সেকশন কাস্টমাইজ করুন', 'Customize Sections', language)}</span>
            </button>
          </div>

          <div className="flex flex-wrap bg-zinc-100 p-1 rounded-xl border border-zinc-200 gap-1">
            <button
              onClick={() => handleSelectScope('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scope === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{tr('সবকিছু একসাথে (পূর্ণাঙ্গ রিপোর্ট)', 'All Combined (Complete Report)', language)}</span>
            </button>

            <button
              onClick={() => handleSelectScope('press')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scope === 'press'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>🏭 {tr('শুধু প্রেস হিসাব ও পেমেন্ট', 'Press Accounts & Payments Only', language)}</span>
            </button>

            <button
              onClick={() => handleSelectScope('online')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scope === 'online'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 {tr('শুধু অনলাইন সেলস ও ডিউ', 'Online Sales & Dues Only', language)}</span>
            </button>

            <button
              onClick={() => handleSelectScope('offline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scope === 'offline'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>🏪 {tr('শুধু অফলাইন সেলস ও ডিউ', 'Offline Sales & Dues Only', language)}</span>
            </button>

            <button
              onClick={() => handleSelectScope('sales_due')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scope === 'sales_due'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>🌐+🏪 {tr('অনলাইন ও অফলাইন সেলস ও ডিউ', 'Online & Offline Sales & Dues', language)}</span>
            </button>
          </div>
        </div>

        {/* Granular Section Checkboxes (shown when toggled or custom) */}
        {showCustomSettings && (
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-3 animate-in fade-in">
            <span className="font-bold text-zinc-800 block">
              {tr('প্রিন্ট রিপোর্টে কোন কোন সেকশন যুক্ত থাকবে:', 'Select sections to include in the printed report:', language)}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              {/* Sales Mode */}
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                <span className="font-bold block text-zinc-800 mb-1">{tr('বই ভিত্তিক সেলস টেবিল:', 'Book Sales Table:', language)}</span>
                <select
                  value={salesMode}
                  onChange={(e) => {
                    setSalesMode(e.target.value as SalesMode);
                    setScope('custom');
                  }}
                  className="w-full text-xs font-semibold border border-zinc-300 rounded p-1.5 bg-white text-zinc-900"
                >
                  <option value="all">{tr('অনলাইন + অফলাইন মোট সেলস', 'Online + Offline Total Sales', language)}</option>
                  <option value="online">{tr('শুধু অনলাইন সেলস কলাম', 'Online Sales Columns Only', language)}</option>
                  <option value="offline">{tr('শুধু অফলাইন সেলস কলাম', 'Offline Sales Columns Only', language)}</option>
                  <option value="none">{tr('সেলস টেবিল লুকান', 'Hide Sales Table', language)}</option>
                </select>
              </div>

              {/* Press Accounts */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePressAccounts}
                  onChange={(e) => {
                    setIncludePressAccounts(e.target.checked);
                    setScope('custom');
                  }}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('প্রেস হিসাব ও ব্যালেন্স', 'Press Accounts & Balance', language)}</span>
              </label>

              {/* Press Payments History */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePressPayments}
                  onChange={(e) => {
                    setIncludePressPayments(e.target.checked);
                    setScope('custom');
                  }}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('প্রেস পেমেন্ট ভাউচার তালিকা', 'Press Payment Vouchers List', language)}</span>
              </label>

              {/* Online Due */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOnlineDue}
                  onChange={(e) => {
                    setIncludeOnlineDue(e.target.checked);
                    setScope('custom');
                  }}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('অনলাইন চ্যানেল ডিউ খতিয়ান', 'Online Channel Dues Ledger', language)}</span>
              </label>

              {/* Offline Due */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOfflineDue}
                  onChange={(e) => {
                    setIncludeOfflineDue(e.target.checked);
                    setScope('custom');
                  }}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('অফলাইন ও লাইব্রেরি ডিউ খতিয়ান', 'Offline & Library Dues Ledger', language)}</span>
              </label>

              {/* Signatures */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('কর্মকর্তাদের স্বাক্ষর ও সিল', 'Official Signatures & Seals', language)}</span>
              </label>

            </div>
          </div>
        )}

        {/* 2. BOOK SELECTION CONTROLS (বই নির্বাচন: সব বই / একক বই / একাধিক বই সিলেক্ট) */}
        <div className="pt-3 border-t border-zinc-100 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-700" />
              <span>{tr('বই নির্বাচন (Book Selection):', 'Book Selection:', language)}</span>
            </span>

            {/* Selection Mode Pills */}
            <div className="inline-flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
              <button
                type="button"
                onClick={() => setBookSelectionMode('all')}
                className={`px-3 py-1 font-bold rounded-md transition-all ${
                  bookSelectionMode === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tr(`সব বই (${books.length})`, `All Books (${books.length})`, language)}
              </button>

              <button
                type="button"
                onClick={() => setBookSelectionMode('single')}
                className={`px-3 py-1 font-bold rounded-md transition-all ${
                  bookSelectionMode === 'single'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tr('একক বই', 'Single Book', language)}
              </button>

              <button
                type="button"
                onClick={() => setBookSelectionMode('multiple')}
                className={`px-3 py-1 font-bold rounded-md transition-all ${
                  bookSelectionMode === 'multiple'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tr(`একাধিক বই সিলেক্ট (${selectedMultipleBookIds.length})`, `Select Multiple (${selectedMultipleBookIds.length})`, language)}
              </button>
            </div>
          </div>

          {/* Mode 1: Single Book Dropdown */}
          {bookSelectionMode === 'single' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 bg-zinc-50 rounded-xl border border-zinc-200 animate-in fade-in">
              <span className="text-xs font-semibold text-zinc-700 shrink-0">
                {tr('নির্দিষ্ট বই বাছাই করুন:', 'Select Specific Book:', language)}
              </span>
              <select
                value={selectedSingleBookId}
                onChange={(e) => setSelectedSingleBookId(e.target.value)}
                className="w-full sm:max-w-md text-xs font-bold bg-white border border-zinc-300 rounded-lg p-2 text-zinc-900 focus:ring-2 focus:ring-zinc-900 cursor-pointer"
              >
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.sl}. {b.bookName} (MRP: {formatBDT(b.perBookAmount, language)})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-zinc-500 font-medium">
                👉 {tr('রিপোর্টে শুধুমাত্র এই একক বইটির সম্পূর্ণ বিক্রয়, প্রেস স্টক ও ব্যালেন্স প্রিন্ট হবে।', 'Only sales, press stock and balances for this single book will be printed in the report.', language)}
              </span>
            </div>
          )}

          {/* Mode 2: Multiple Book Selection (Checkboxes + Select All / Clear All) */}
          {bookSelectionMode === 'multiple' && (
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2.5 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                <span className="text-xs font-bold text-zinc-800">
                  {tr('যেসব বইয়ের রিপোর্ট প্রিন্ট করতে চান সেগুলো টিক দিন:', 'Check the books you want to include in the report:', language)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMultipleBookIds(books.map(b => b.id))}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-700 hover:text-black bg-white px-2.5 py-1 rounded-md border border-zinc-300 shadow-2xs"
                  >
                    <CheckSquare className="w-3 h-3 text-zinc-600" />
                    <span>{tr('সব সিলেক্ট করুন', 'Select All', language)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMultipleBookIds([])}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-700 hover:text-black bg-white px-2.5 py-1 rounded-md border border-zinc-300 shadow-2xs"
                  >
                    <Square className="w-3 h-3 text-zinc-600" />
                    <span>{tr('সব আন-সিলেক্ট', 'Deselect All', language)}</span>
                  </button>
                  <span className="text-[11px] font-bold text-zinc-900 bg-zinc-200 px-2.5 py-0.5 rounded-full font-mono">
                    {tr('নির্বাচিত', 'Selected', language)}: {selectedMultipleBookIds.length} / {books.length}
                  </span>
                </div>
              </div>

              {/* Checkboxes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {books.map(b => {
                  const isChecked = selectedMultipleBookIds.includes(b.id);
                  return (
                    <label
                      key={b.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked 
                          ? 'bg-white border-zinc-900 shadow-2xs font-bold text-zinc-900' 
                          : 'bg-white/60 border-zinc-200 text-zinc-600 hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMultipleBookIds(prev => [...prev, b.id]);
                          } else {
                            setSelectedMultipleBookIds(prev => prev.filter(id => id !== b.id));
                          }
                        }}
                        className="rounded text-zinc-900 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="font-mono text-[10px] text-zinc-400">{b.sl}.</span>
                      <span className="truncate">{b.bookName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. REPORT TIME PERIOD SELECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <div className="flex flex-wrap bg-zinc-100 p-1 rounded-xl border border-zinc-200 gap-1">
            {[
              { key: 'monthly', labelBn: 'মাসিক রিপোর্ট', labelEn: 'Monthly', icon: CalendarRange },
              { key: 'daily', labelBn: 'দৈনিক', labelEn: 'Daily', icon: Calendar },
              { key: 'weekly', labelBn: 'সাপ্তাহিক', labelEn: 'Weekly', icon: CalendarDays },
              { key: 'quarterly', labelBn: '৩ মাস (কোয়ার্টার)', labelEn: 'Quarterly', icon: Layers },
              { key: 'half_yearly', labelBn: '৬ মাস (ষান্মাসিক)', labelEn: 'Half-Yearly', icon: Clock },
              { key: 'yearly', labelBn: 'বার্ষিক', labelEn: 'Yearly', icon: TrendingUp },
              { key: 'custom', labelBn: 'তারিখ রেঞ্জ', labelEn: 'Custom Range', icon: Filter },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = reportType === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setReportType(tab.key as ReportType)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? tab.labelBn : tab.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-selectors */}
          {reportType === 'daily' && (
            <div className="flex items-center gap-2">
              <button
                disabled={selectedDay <= 1}
                onClick={() => setSelectedDay(d => Math.max(1, d - 1))}
                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                <span>{tr('তারিখ:', 'Day:', language)}</span>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="font-mono text-xs border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      {language === 'bn' ? `${d} তারিখ (${d}তম দিন)` : `Day ${d}`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                disabled={selectedDay >= daysInMonth}
                onClick={() => setSelectedDay(d => Math.min(daysInMonth, d + 1))}
                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900">{tr('সপ্তাহ:', 'Week:', language)}</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="font-medium text-xs border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
              >
                {weekList.map(w => (
                  <option key={w.weekNumber} value={w.weekNumber}>
                    {language === 'bn' ? w.name : `Week ${w.weekNumber} (Days ${w.startDay}-${w.endDay})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'quarterly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900">{tr('কোয়ার্টার:', 'Quarter:', language)}</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="text-xs font-semibold border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
              >
                {QUARTER_OPTIONS.map(q => (
                  <option key={q.key} value={q.key}>{q.label}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'half_yearly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900">{tr('ষাণ্মাসিক:', 'Half-Year:', language)}</span>
              <select
                value={selectedHalfYear}
                onChange={(e) => setSelectedHalfYear(e.target.value)}
                className="text-xs font-semibold border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
              >
                {HALF_YEAR_OPTIONS.map(h => (
                  <option key={h.key} value={h.key}>{h.label}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs font-mono border border-zinc-300 rounded-lg px-2 py-1 bg-zinc-50"
              />
              <span className="text-xs text-zinc-500">{tr('থেকে', 'to', language)}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs font-mono border border-zinc-300 rounded-lg px-2 py-1 bg-zinc-50"
              />
            </div>
          )}

        </div>
      </div>

      {/* ======================================================== */}
      {/* Formal Printable Document Body (A4 Calibrated) */}
      {/* ======================================================== */}
      <div className="print-page-container bg-white p-4 sm:p-8 md:p-10 rounded-2xl border border-zinc-200 shadow-xs w-full max-w-6xl mx-auto space-y-6 print:max-w-none print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Publication Header */}
        <div className="border-b-2 border-zinc-900 pb-5 text-center relative">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            {tr('বিদ্যাবাড়ি পাবলিকেশন', 'Biddabari Publication', language)}
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            {tr(
              'প্রধান কার্যালয়, ঢাকা, বাংলাদেশ • বুক পাবলিকেশন অ্যান্ড ডিস্ট্রিবিউশন ডিপার্টমেন্ট',
              'Head Office, Dhaka, Bangladesh • Book Publication & Distribution Department',
              language
            )}
          </p>
          
          {/* Dynamic Badge */}
          <div className="inline-block mt-2 bg-zinc-100 text-zinc-900 text-xs px-4 py-1.5 rounded-full font-bold border border-zinc-300">
            {getReportScopeTitle()} • ({getReportPeriodTitle()})
          </div>

          <div className="text-[11px] text-zinc-500 mt-2">
            {tr('প্রতিবেদন প্রস্তুতের তারিখ:', 'Report Generation Date:', language)} <b>{currentDate}</b>
          </div>
        </div>

        {/* If Single Book is selected, show an executive Single Book Highlights Showcase Card */}
        {effectiveBooks.length === 1 && (
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-4 sm:p-5 avoid-break space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-3 gap-2">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  {tr('একক বই স্পেশাল রিপোর্ট', 'Single Book Executive Report', language)}
                </span>
                <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                  <span>{effectiveBooks[0].sl}.</span>
                  <span>{effectiveBooks[0].bookName}</span>
                </h2>
                {effectiveBooks[0].remarks && (
                  <p className="text-xs text-zinc-600 mt-0.5">{effectiveBooks[0].remarks}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white px-3 py-1.5 rounded-xl border border-zinc-200 text-right">
                  <span className="text-[10px] text-zinc-400 block">{tr('বিক্রয় মূল্য (MRP)', 'MRP Price', language)}</span>
                  <span className="text-base font-black text-zinc-900 font-mono">{formatBDT(effectiveBooks[0].perBookAmount, language)}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-xl border border-zinc-200 text-right">
                  <span className="text-[10px] text-zinc-400 block">{tr('নিট লাভ/কপি', 'Profit/Copy', language)}</span>
                  <span className="text-base font-black text-emerald-700 font-mono">+{formatBDT(calculateBookMetrics(effectiveBooks[0]).profitPerBook, language)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('মোট প্রেস অর্ডার', 'Total Press Order', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalOrderFaridBhai, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('প্রেস থেকে প্রাপ্ত চালান', 'Received from Press', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).faridBhaiToHeadOffice, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('হেড অফিস বর্তমান স্টক', 'Head Office Stock', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalPresentStockHO, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('প্রেসে অবশিষ্ট স্টক', 'Stock at Press', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).stockToFaridBhai, language)} {tr('কপি', 'copies', language)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('অনলাইন বিক্রয়', 'Online Sales', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalOnlineSell, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('অফলাইন বিক্রয়', 'Offline Sales', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalOfflineSell, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('মোট বিক্রিত কপি', 'Total Sold Copies', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalSold, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('মোট অর্জিত নিট লাভ', 'Total Net Profit', language)}</span>
                <span className="text-base font-black text-emerald-800 font-mono">+{formatBDT(calculateBookMetrics(effectiveBooks[0]).totalNetProfit, language)}</span>
              </div>
            </div>
          </div>
        )}

        {effectiveBooks.length === 0 && (
          <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200">
            <BookOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <h3 className="font-bold text-zinc-800 text-sm">{tr('কোনো বই নির্বাচন করা হয়নি', 'No books selected', language)}</h3>
            <p className="text-xs text-zinc-500 mt-1">{tr('দয়া করে উপরের বই নির্বাচন প্যানেল থেকে অন্তত একটি বই সিলেক্ট করুন।', 'Please select at least one book from the selection panel above.', language)}</p>
          </div>
        )}

        {/* Dynamic Primary KPI Summary Cards based on Selected Scope */}
        {scope === 'press' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('মোট প্রেস বিল (অর্ডার)', 'Total Press Bill (Orders)', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(pressAccounts.totalOrderBill, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('অর্ডার কপি অনুযায়ী', 'Based on order copies', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('প্রাপ্ত চালান মূল্য', 'Received Delivery Value', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(pressAccounts.totalReceivedBill, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('হেড অফিসে গৃহীত', 'Received at Head Office', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('প্রেসে পরিশোধিত টাকা', 'Paid to Press', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(pressAccounts.totalPaidToPress, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{pressPayments.length} {tr('টি ভাউচার', 'vouchers', language)}</span>
            </div>

            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl">
              <span className="text-[11px] text-zinc-600 block font-bold">{tr('প্রেসের বকেয়া ব্যালেন্স', 'Press Due Balance', language)}</span>
              <span className="text-xl font-black text-zinc-900 font-mono">
                {pressAccounts.netDueOnOrder > 0
                  ? formatBDT(pressAccounts.netDueOnOrder, language)
                  : pressAccounts.netDueOnOrder < 0
                  ? `+${formatBDT(Math.abs(pressAccounts.netDueOnOrder), language)}`
                  : formatBDT(0, language)}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {pressAccounts.netDueOnOrder > 0 ? tr('প্রেস পাবে', 'Due to Press', language) : tr('সম্পূর্ণ পরিশোধিত', 'Fully Settled', language)}
              </span>
            </div>
          </div>
        ) : scope === 'online' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অনলাইন বিক্রিত কপি', 'Online Sold Copies', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalOnlineSold, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('বইবাড়ি, রকমারি, ওয়াফিলাইফ', 'Boibari, Rokomari, Wafilife', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অনলাইন মোট রাজস্ব', 'Online Total Revenue', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineBilled, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ইনভয়েস মূল্য', 'Invoice Value', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অনলাইন আদায়কৃত', 'Online Collected', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineCollected, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ব্যাংক ও বিকাশ', 'Bank & bKash', language)}</span>
            </div>

            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl">
              <span className="text-[11px] text-zinc-600 block font-bold">{tr('অনলাইন ডিউ / বকেয়া', 'Online Due / Balance', language)}</span>
              <span className="text-xl font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineDue, language)}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">{tr('অনলাইন বাকি', 'Online Due', language)}</span>
            </div>
          </div>
        ) : scope === 'offline' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অফলাইন বিক্রিত কপি', 'Offline Sold Copies', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalOfflineSold, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('হেড অফিস ও ডিলার লাইব্রেরি', 'Head Office & Dealer Libraries', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অফলাইন মোট রাজস্ব', 'Offline Total Revenue', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineBilled, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ইনভয়েস মূল্য', 'Invoice Value', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('লাইব্রেরি আদায়কৃত', 'Libraries Collected', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineCollected, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ক্যাশ ও চেক', 'Cash & Cheque', language)}</span>
            </div>

            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl">
              <span className="text-[11px] text-zinc-600 block font-bold">{tr('অফলাইন ডিউ / বকেয়া', 'Offline Due / Balance', language)}</span>
              <span className="text-xl font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineDue, language)}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">{tr('লাইব্রেরির নিকট বাকি', 'Due from Libraries', language)}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('মোট বিক্রিত কপি', 'Total Sold Copies', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalSold, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {tr(`অনলাইন ${monthlyTotals.totalOnlineSold} • অফলাইন ${monthlyTotals.totalOfflineSold}`, `Online ${monthlyTotals.totalOnlineSold} • Offline ${monthlyTotals.totalOfflineSold}`, language)}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('মোট রাজস্ব (Revenue)', 'Total Revenue', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(monthlyTotals.totalRevenue, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('মোট বিক্রয়মূল্য', 'Total Sales Amount', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('প্রেসের বকেয়া ব্যালেন্স', 'Press Due Balance', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">
                {pressAccounts.netDueOnOrder > 0 ? formatBDT(pressAccounts.netDueOnOrder, language) : tr('পরিশোধিত', 'Settled', language)}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ফরিদ ভাই প্রেস', 'Farid Bhai Press', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('মোট চ্যানেল ডিউ', 'Total Channel Dues', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.totalDue, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {tr(`অনলাইন ${formatBDT(channelAccounts.onlineDue, language)} • অফলাইন ${formatBDT(channelAccounts.offlineDue, language)}`, `Online ${formatBDT(channelAccounts.onlineDue, language)} • Offline ${formatBDT(channelAccounts.offlineDue, language)}`, language)}
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 1: BOOKS TABLE (Full / Online Only / Offline Only) */}
        {/* ======================================================== */}
        {salesMode !== 'none' && effectiveBooks.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>
                {salesMode === 'online' 
                  ? tr('১. বই ভিত্তিক অনলাইন বিক্রয় ও রাজস্ব খতিয়ান', '1. Book-wise Online Sales & Revenue Ledger', language)
                  : salesMode === 'offline' 
                  ? tr('১. বই ভিত্তিক অফলাইন ও লাইব্রেরি বিক্রয় ও রাজস্ব খতিয়ান', '1. Book-wise Offline & Library Sales & Revenue Ledger', language)
                  : tr('১. বই ভিত্তিক পূর্ণাঙ্গ বিক্রয় ও রাজস্ব খতিয়ান', '1. Book-wise Comprehensive Sales & Revenue Ledger', language)
                }
              </span>
              <span className="text-[11px] font-normal text-zinc-500">
                {effectiveBooks.length} {tr('টি বই', 'books', language)}
              </span>
            </h3>

            {/* A: Online-Only Books Table */}
            {salesMode === 'online' && (
              <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
                <table className="w-full min-w-[750px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-900 font-bold">
                      <th className="py-2.5 px-3 text-center w-12">{tr('SL', 'SL', language)}</th>
                      <th className="py-2.5 px-3 min-w-[180px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('MRP', 'MRP', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('বইবাড়ি', 'Boibari', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('রকমারি', 'Rokomari', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('ওয়াফিলাইফ', 'Wafilife', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('অন্যান্য', 'Others', language)}</th>
                      <th className="py-2.5 px-3 text-center bg-zinc-200 font-bold text-zinc-900">{tr('অনলাইন মোট বিক্রি', 'Online Total Sales', language)}</th>
                      <th className="py-2.5 px-3 text-right bg-zinc-200/60 font-bold text-zinc-900">{tr('অনলাইন রাজস্ব', 'Online Revenue', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {effectiveBooks.map(b => {
                      const m = calculateBookMetrics(b);
                      const onlineRev = m.totalOnlineSell * m.perBookAmount;
                      return (
                        <tr key={b.id}>
                          <td className="py-2 px-3 text-center font-mono">{b.sl}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">{b.bookName}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.perBookAmount, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.boibariTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.rokomariTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.wafilifeTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.othersOnlineTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono bg-zinc-50">{formatNumber(m.totalOnlineSell, language)} {tr('কপি', 'cps', language)}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 font-mono bg-zinc-50">{formatBDT(onlineRev, language)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                      <td colSpan={3} className="py-2.5 px-3 text-right">{tr('অনলাইন সর্বমোট যোগফল:', 'Online Total Sum:', language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.boibari, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.rokomari, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.wafilife, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.othersOnline, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono bg-zinc-200">{formatNumber(monthlyTotals.totalOnlineSold, language)} {tr('কপি', 'copies', language)}</td>
                      <td className="py-2.5 px-3 text-right font-mono bg-zinc-200">{formatBDT(channelAccounts.onlineBilled, language)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* B: Offline-Only Books Table */}
            {salesMode === 'offline' && (
              <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
                <table className="w-full min-w-[800px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-900 font-bold">
                      <th className="py-2.5 px-3 text-center w-12">{tr('SL', 'SL', language)}</th>
                      <th className="py-2.5 px-3 min-w-[180px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('MRP', 'MRP', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('হেড অফিস সেল', 'Head Office Sales', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('নীলক্ষেত', 'Nilkhet', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('সুমনা (প্রেস)', 'Sumona (Press)', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('প্রমিজ (প্রেস)', 'Promise (Press)', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('জয়স্টার (প্রেস)', 'Joystar (Press)', language)}</th>
                      <th className="py-2.5 px-3 text-center bg-zinc-200 font-bold text-zinc-900">{tr('অফলাইন মোট বিক্রি', 'Offline Total Sales', language)}</th>
                      <th className="py-2.5 px-3 text-right bg-zinc-200/60 font-bold text-zinc-900">{tr('অফলাইন রাজস্ব', 'Offline Revenue', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {effectiveBooks.map(b => {
                      const m = calculateBookMetrics(b);
                      const offlineRev = m.totalOfflineSell * m.perBookAmount;
                      return (
                        <tr key={b.id}>
                          <td className="py-2 px-3 text-center font-mono">{b.sl}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">{b.bookName}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.perBookAmount, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.headOfficeOfflineTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.nilkhetTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.sumonaTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.promiseTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.joystarTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono bg-zinc-50">{formatNumber(m.totalOfflineSell, language)} {tr('কপি', 'cps', language)}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 font-mono bg-zinc-50">{formatBDT(offlineRev, language)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                      <td colSpan={3} className="py-2.5 px-3 text-right">{tr('অফলাইন সর্বমোট যোগফল:', 'Offline Total Sum:', language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.hoOffline, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.nilkhet, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.sumona, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.promise, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.joystar, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono bg-zinc-200">{formatNumber(monthlyTotals.totalOfflineSold, language)} {tr('কপি', 'copies', language)}</td>
                      <td className="py-2.5 px-3 text-right font-mono bg-zinc-200">{formatBDT(channelAccounts.offlineBilled, language)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* C: Full Books Table (Combined) */}
            {salesMode === 'all' && (
              <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
                <table className="w-full min-w-[850px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-900 font-bold">
                      <th className="py-2.5 px-3 text-center w-12">{tr('SL', 'SL', language)}</th>
                      <th className="py-2.5 px-3 min-w-[180px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('MRP', 'MRP', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('লাভ/কপি', 'Profit/Copy', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('প্রেস অর্ডার', 'Press Order', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('HO স্টক', 'HO Stock', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('প্রেস স্টক', 'Press Stock', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('অনলাইন', 'Online', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('অফলাইন', 'Offline', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('মোট বিক্রি', 'Total Sold', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('রাজস্ব', 'Revenue', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('নিট লাভ', 'Net Profit', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {effectiveBooks.map(b => {
                      const m = calculateBookMetrics(b);
                      return (
                        <tr key={b.id}>
                          <td className="py-2 px-3 text-center font-mono">{b.sl}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">{b.bookName}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.perBookAmount, language)}</td>
                          <td className="py-2 px-3 text-right font-mono">+{formatBDT(m.profitPerBook, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.totalOrderFaridBhai, language)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono">{formatNumber(m.totalPresentStockHO, language)}</td>
                          <td className="py-2 px-3 text-center font-mono text-zinc-700">{formatNumber(m.stockToFaridBhai, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.totalOnlineSell, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.totalOfflineSell, language)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono">{formatNumber(m.totalSold, language)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.totalRevenue, language)}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 font-mono">+{formatBDT(m.totalNetProfit, language)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                      <td colSpan={4} className="py-2.5 px-3 text-right">{tr(`সর্বমোট যোগফল (${effectiveBooks.length} টি বই):`, `Total Sum (${effectiveBooks.length} books):`, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(effectiveBooks.reduce((s, b) => s + (Number(b.totalOrderFaridBhai) || 0), 0), language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalHOStock, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalPressStock, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalOnlineSold, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalOfflineSold, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalSold, language)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatBDT(monthlyTotals.totalRevenue, language)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">+{formatBDT(monthlyTotals.totalProfit, language)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: PRESS ACCOUNTS & PAYMENT LEDGER */}
        {/* ======================================================== */}
        {includePressAccounts && (
          <div className="avoid-break">
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>{tr('২. ফরিদ ভাই প্রেস হিসাব ও পরিশোধিত পেমেন্ট বিবরণী', '2. Farid Bhai Press Accounts & Payment Statement', language)}</span>
              <span className="text-[11px] font-semibold text-zinc-600">
                {pressAccounts.netDueOnOrder > 0 ? `${tr('প্রেসের বকেয়া:', 'Press Due:', language)} ${formatBDT(pressAccounts.netDueOnOrder, language)}` : tr('সম্পূর্ণ পরিশোধিত', 'Fully Settled', language)}
              </span>
            </h3>

            <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
                    <th className="py-2 px-3">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('অর্ডার কপি', 'Order Copies', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('ছাপার খরচ', 'Printing Cost', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('মোট প্রেস বিল', 'Total Press Bill', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('প্রাপ্ত চালান', 'Received Copies', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('পরিশোধিত টাকা', 'Paid Amount', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('বাকি / ব্যালেন্স', 'Due / Balance', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('স্ট্যাটাস', 'Status', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pressAccounts.bookAccounts.map(b => (
                    <tr key={b.bookId}>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-zinc-900">{b.bookName}</div>
                        {b.lots && b.lots.length > 0 && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {b.lots.map((l) => `${l.lotName}: ${formatNumber(l.quantity, language)} ${tr('কপি', 'cps', language)} (${l.date})`).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{formatNumber(b.orderQuantity, language)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatBDT(b.makingCost, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatBDT(b.totalOrderBill, language)}</td>
                      <td className="py-2 px-3 text-center font-mono">{formatNumber(b.receivedCopies, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(b.totalPaid, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {b.dueOnOrder > 0 ? formatBDT(b.dueOnOrder, language) : b.dueOnOrder < 0 ? `+${formatBDT(Math.abs(b.dueOnOrder), language)}` : formatBDT(0, language)}
                      </td>
                      <td className="py-2 px-3 text-center font-semibold text-[11px]">{b.statusText}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-300 text-zinc-900">
                    <td className="py-2.5 px-3 text-right">{tr('প্রেস সর্বমোট:', 'Press Total:', language)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.orderQuantity, 0), language)}</td>
                    <td></td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(pressAccounts.totalOrderBill, language)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.receivedCopies, 0), language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(pressAccounts.totalPaidToPress, language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {pressAccounts.netDueOnOrder > 0 ? formatBDT(pressAccounts.netDueOnOrder, language) : formatBDT(0, language)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-zinc-600 font-normal">
                      {pressAccounts.netDueOnOrder > 0 ? tr('প্রেস পাবে', 'Due to Press', language) : tr('পরিশোধিত', 'Settled', language)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Press Payment Voucher History Table */}
        {includePressPayments && filteredPressPayments.length > 0 && (
          <div className="avoid-break">
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>
                {tr(
                  `ফরিদ ভাই প্রেসে পরিশোধিত পেমেন্ট ভাউচার হিস্ট্রি (${filteredPressPayments.length} টি ভাউচার)`,
                  `Farid Bhai Press Payment Voucher History (${filteredPressPayments.length} vouchers)`,
                  language
                )}
              </span>
              <span className="text-[11px] font-bold text-zinc-900 font-mono">
                {tr('মোট পরিশোধ:', 'Total Paid:', language)} {formatBDT(pressAccounts.totalPaidToPress, language)}
              </span>
            </h3>

            <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
                    <th className="py-2 px-3">{tr('তারিখ', 'Date', language)}</th>
                    <th className="py-2 px-3">{tr('খাত / বইয়ের নাম', 'Category / Book Name', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('পরিশোধিত টাকা', 'Paid Amount', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('মাধ্যম', 'Method', language)}</th>
                    <th className="py-2 px-3">{tr('ভাউচার / চেক নং', 'Voucher / Cheque No', language)}</th>
                    <th className="py-2 px-3">{tr('বিবরণ / নোট', 'Notes', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredPressPayments.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-medium text-zinc-900">{p.date}</td>
                      <td className="py-2 px-3 font-semibold text-zinc-900">{p.bookName || tr('সার্বিক প্রেস অর্ডার', 'General Press Order', language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(p.amount, language)}</td>
                      <td className="py-2 px-3 text-center uppercase font-mono text-[10px]">{p.paymentMethod}</td>
                      <td className="py-2 px-3 font-mono text-zinc-600">{p.voucherNo || '—'}</td>
                      <td className="py-2 px-3 text-zinc-500">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 3: CHANNEL DUE & COLLECTION (Online / Offline / Both) */}
        {/* ======================================================== */}
        {(includeOnlineDue || includeOfflineDue) && filteredChannels.length > 0 && (
          <div className="avoid-break">
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>
                {includeOnlineDue && !includeOfflineDue 
                  ? tr('৩. অনলাইন চ্যানেল ডিউ ও কালেকশন খতিয়ান', '3. Online Channel Dues & Collections Ledger', language)
                  : !includeOnlineDue && includeOfflineDue 
                  ? tr('৩. অফলাইন ও লাইব্রেরি ডিউ ও কালেকশন খতিয়ান', '3. Offline & Library Dues & Collections Ledger', language)
                  : tr('৩. অনলাইন ও অফলাইন চ্যানেল ডিউ ও কালেকশন খতিয়ান', '3. Online & Offline Channel Dues & Collections Ledger', language)
                }
              </span>
              <span className="text-[11px] font-semibold text-zinc-600">
                {tr('মোট ডিউ:', 'Total Due:', language)} {formatBDT(filteredChannels.reduce((s, c) => s + c.dueAmount, 0), language)} • {tr('মোট আদায়:', 'Total Collected:', language)} {formatBDT(filteredChannels.reduce((s, c) => s + c.totalCollected, 0), language)}
              </span>
            </h3>

            <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
                    <th className="py-2 px-3">{tr('চ্যানেল / লাইব্রেরি', 'Channel / Library', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('ধরন', 'Type', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('বিক্রিত কপি', 'Sold Copies', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('ইনভয়েস বিক্রয়মূল্য', 'Invoiced Amount', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('আদায়কৃত টাকা', 'Collected Amount', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('বাকি / ডিউ', 'Due Balance', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('আদায় হার (%)', 'Collection Rate (%)', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredChannels.map(ch => (
                    <tr key={ch.key}>
                      <td className="py-2 px-3 font-semibold text-zinc-900">{ch.name}</td>
                      <td className="py-2 px-3 text-center uppercase text-[10px] font-mono">
                        {ch.type === 'online' ? tr('অনলাইন', 'Online', language) : tr('অফলাইন', 'Offline', language)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{formatNumber(ch.totalCopies, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatBDT(ch.totalBilled, language)}</td>
                      <td className="py-2 px-3 text-right font-mono text-zinc-900">{formatBDT(ch.totalCollected, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {ch.dueAmount > 0 ? formatBDT(ch.dueAmount, language) : formatBDT(0, language)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{ch.collectionRate.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-300 text-zinc-900">
                    <td colSpan={2} className="py-2.5 px-3 text-right">{tr('চ্যানেল সর্বমোট:', 'Channel Total Sum:', language)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{formatNumber(filteredChannels.reduce((s, c) => s + c.totalCopies, 0), language)} {tr('কপি', 'copies', language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(filteredChannels.reduce((s, c) => s + c.totalBilled, 0), language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(filteredChannels.reduce((s, c) => s + c.totalCollected, 0), language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(filteredChannels.reduce((s, c) => s + c.dueAmount, 0), language)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {filteredChannels.reduce((s, c) => s + c.totalBilled, 0) > 0
                        ? ((filteredChannels.reduce((s, c) => s + c.totalCollected, 0) / filteredChannels.reduce((s, c) => s + c.totalBilled, 0)) * 100).toFixed(1)
                        : 100}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* Signatures block (Auto avoid cut across pages) */}
        {/* ======================================================== */}
        {includeSignatures && (
          <div className="signature-block avoid-break pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-zinc-600 border-t border-zinc-200">
            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1 mb-1"></div>
              <span className="font-semibold block text-zinc-800">{tr('ইনভেন্টরি অফিসার', 'Inventory Officer', language)}</span>
              <span className="text-[10px] text-zinc-400">{tr('ওয়্যারহাউজ ও স্টক বিভাগ', 'Warehouse & Stock Dept.', language)}</span>
            </div>

            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1 mb-1"></div>
              <span className="font-semibold block text-zinc-800">{tr('হিসাবরক্ষণ কর্মকর্তা', 'Accounts Officer', language)}</span>
              <span className="text-[10px] text-zinc-400">{tr('অ্যাকাউন্টিং অ্যান্ড ফিন্যান্স', 'Accounting & Finance', language)}</span>
            </div>

            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1 mb-1"></div>
              <span className="font-semibold block text-zinc-800">{tr('প্রকাশনা পরিচালক', 'Publication Director', language)}</span>
              <span className="text-[10px] text-zinc-400">{tr('বিদ্যাবাড়ি পাবলিকেশন', 'Biddabari Publication', language)}</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
