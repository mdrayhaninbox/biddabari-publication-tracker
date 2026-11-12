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
import { BookRecord, PressPaymentRecord, ChannelCollectionRecord, PressOrderRecord, PressDeliveryRecord } from '../types/book';
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
  QUARTER_OPTIONS,
  HALF_YEAR_OPTIONS,
  AVAILABLE_YEARS
} from '../utils/calculations';
import { exportBooksToExcel } from '../utils/excelHandler';

interface PrintableReportProps {
  books: BookRecord[];
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
  pressPayments?: PressPaymentRecord[];
  pressOrders?: PressOrderRecord[];
  pressDeliveries?: PressDeliveryRecord[];
  channelCollections?: ChannelCollectionRecord[];
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
}) => {
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

  const currentDate = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Press accounts and Channel Dues
  const pressAccounts = calculatePressAccounts(books, pressPayments, pressOrders);
  const channelAccounts = calculateChannelDueAccounts(books, channelCollections);

  // Filtered Channels for Dues Section
  const filteredChannels = channelAccounts.channels.filter(ch => {
    if (includeOnlineDue && includeOfflineDue) return true;
    if (includeOnlineDue && !includeOfflineDue) return ch.type === 'online';
    if (!includeOnlineDue && includeOfflineDue) return ch.type === 'offline';
    return false;
  });

  // Monthly totals
  const monthlyTotals = books.reduce(
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
  const dayData = calculateDayBreakdown(books, selectedDay);

  // Weekly breakdown
  const weekList = calculateWeekBreakdowns(books, daysInMonth);
  const currentWeek = weekList.find(w => w.weekNumber === selectedWeek) || weekList[0];
  const weekBooks = calculateWeekBookBreakdown(books, currentWeek.startDay, currentWeek.endDay);

  const currentQuarter = QUARTER_OPTIONS.find(q => q.key === selectedQuarter) || QUARTER_OPTIONS[3];
  const currentHalf = HALF_YEAR_OPTIONS.find(h => h.key === selectedHalfYear) || HALF_YEAR_OPTIONS[1];

  // Dynamic Report Sub-title
  const getReportScopeTitle = () => {
    if (scope === 'press') {
      return 'ফরিদ ভাই প্রেস হিসাব, চালান মূল্য, পেমেন্ট ভাউচার ও বকেয়া ব্যালেন্স বিবরণী প্রতিবেদন';
    }
    if (scope === 'online') {
      return 'অনলাইন সেলস চ্যানেল (বইবাড়ি, রকমারি, ওয়াফিলাইফ ও অন্যান্য) বিক্রয় ও ডিউ কালেকশন খতিয়ান';
    }
    if (scope === 'offline') {
      return 'অফলাইন কাউন্টার ও ডিলার লাইব্রেরি (সুমনা, প্রমিজ, জয়স্টার, নীলক্ষেত) সেলস ও ডিউ খতিয়ান';
    }
    if (scope === 'sales_due') {
      return 'অনলাইন ও অফলাইন চ্যানেল বিক্রয়, রাজস্ব ও ডিউ কালেকশন খতিয়ান প্রতিবেদন';
    }
    return `সার্বিক বুক সেলস, স্টক ইনভেন্টরি, প্রেস হিসাব ও চ্যানেল ডিউ খতিয়ান প্রতিবেদন`;
  };

  const getReportPeriodTitle = () => {
    if (reportType === 'daily') return `তারিখ: ${selectedDay} ${formatMonthYearBengali(selectedMonth, selectedYear)}`;
    if (reportType === 'weekly') return `${currentWeek.name} (${currentWeek.startDay} থেকে ${currentWeek.endDay} ${formatMonthYearBengali(selectedMonth, selectedYear)})`;
    if (reportType === 'monthly') return `${formatMonthYearBengali(selectedMonth, selectedYear)}`;
    if (reportType === 'quarterly') return `${currentQuarter.label} - ${reportYear}`;
    if (reportType === 'half_yearly') return `${currentHalf.label} - ${reportYear}`;
    if (reportType === 'yearly') return `${reportYear} সালের বার্ষিক খতিয়ান`;
    if (reportType === 'custom') return `${customStartDate} থেকে ${customEndDate}`;
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
              <span>অফিসিয়াল এক্সিকিউটিভ রিপোর্ট ও প্রিন্ট কনসোল</span>
            </h2>
            <p className="text-xs text-zinc-500">
              প্রেস হিসাব, অনলাইন সেলস, অফলাইন সেলস ও ডিউ খতিয়ান আলাদা আলাদা বা সমন্বিতভাবে প্রিন্ট করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded-lg">
              📄 A4 সাইজ অটো-ফিট
            </span>

            <button
              onClick={() => exportBooksToExcel(books, selectedMonth, selectedYear)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-300"
            >
              <Download className="w-4 h-4 text-zinc-700" />
              <span>এক্সেল ফাইল</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>A4 প্রিন্ট / PDF</span>
            </button>
          </div>
        </div>

        {/* 1. SELECTIVE SCOPE SWITCHER (প্রেস / অনলাইন / অফলাইন আলাদা ও একসাথে) */}
        <div className="pt-3 border-t border-zinc-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <span>প্রিন্টের বিষয়বস্তু নির্বাচন করুন (Scope):</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomSettings(prev => !prev)}
              className="text-xs font-semibold text-zinc-600 hover:text-black flex items-center gap-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showCustomSettings ? 'কাস্টম সেটিং লুকান' : 'সেকশন কাস্টমাইজ করুন'}</span>
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
              <span>সবকিছু একসাথে (পূর্ণাঙ্গ রিপোর্ট)</span>
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
              <span>🏭 শুধু প্রেস হিসাব ও পেমেন্ট</span>
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
              <span>🌐 শুধু অনলাইন সেলস ও ডিউ</span>
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
              <span>🏪 শুধু অফলাইন সেলস ও ডিউ</span>
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
              <span>🌐+🏪 অনলাইন ও অফলাইন সেলস ও ডিউ</span>
            </button>
          </div>
        </div>

        {/* Granular Section Checkboxes (shown when toggled or custom) */}
        {showCustomSettings && (
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-3 animate-in fade-in">
            <span className="font-bold text-zinc-800 block">প্রিন্ট রিপোর্টে কোন কোন সেকশন যুক্ত থাকবে:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              {/* Sales Mode */}
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                <span className="font-bold block text-zinc-800 mb-1">বই ভিত্তিক সেলস টেবিল:</span>
                <select
                  value={salesMode}
                  onChange={(e) => {
                    setSalesMode(e.target.value as SalesMode);
                    setScope('custom');
                  }}
                  className="w-full text-xs font-semibold border border-zinc-300 rounded p-1.5 bg-white text-zinc-900"
                >
                  <option value="all">অনলাইন + অফলাইন মোট সেলস</option>
                  <option value="online">শুধু অনলাইন সেলস কলাম</option>
                  <option value="offline">শুধু অফলাইন সেলস কলাম</option>
                  <option value="none">সেলস টেবিল লুকান</option>
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
                <span className="font-medium text-zinc-800">প্রেস হিসাব ও ব্যালেন্স</span>
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
                <span className="font-medium text-zinc-800">প্রেস পেমেন্ট ভাউচার তালিকা</span>
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
                <span className="font-medium text-zinc-800">অনলাইন চ্যানেল ডিউ খতিয়ান</span>
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
                <span className="font-medium text-zinc-800">অফলাইন ও লাইব্রেরি ডিউ খতিয়ান</span>
              </label>

              {/* Signatures */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">কর্মকর্তাদের স্বাক্ষর ও সিল</span>
              </label>

            </div>
          </div>
        )}

        {/* 2. REPORT TIME PERIOD SELECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <div className="flex flex-wrap bg-zinc-100 p-1 rounded-xl border border-zinc-200 gap-1">
            {[
              { key: 'monthly', label: 'মাসিক রিপোর্ট (Monthly)', icon: CalendarRange },
              { key: 'daily', label: 'দৈনিক (Daily)', icon: Calendar },
              { key: 'weekly', label: 'সাপ্তাহিক (Weekly)', icon: CalendarDays },
              { key: 'quarterly', label: '৩ মাস (Quarterly)', icon: Layers },
              { key: 'half_yearly', label: '৬ মাস (Half-Yearly)', icon: Clock },
              { key: 'yearly', label: 'বাৎসরিক (Yearly)', icon: TrendingUp },
              { key: 'custom', label: 'তারিখ রেঞ্জ (Custom)', icon: Filter },
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
                  <span>{tab.label}</span>
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
                <span>তারিখ:</span>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="font-mono text-xs border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      {d} তারিখ ({d}তম দিন)
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
              <span className="text-xs font-bold text-zinc-900">সপ্তাহ:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="font-medium text-xs border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
              >
                {weekList.map(w => (
                  <option key={w.weekNumber} value={w.weekNumber}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'quarterly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900">কোয়ার্টার:</span>
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
              <span className="text-xs font-bold text-zinc-900">ষাণ্মাসিক:</span>
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
              <span className="text-xs text-zinc-500">থেকে</span>
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
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">বিদ্যাবাড়ি পাবলিকেশন</h1>
          <p className="text-xs text-zinc-600 mt-0.5">প্রধান কার্যালয়, ঢাকা, বাংলাদেশ • বুক পাবলিকেশন অ্যান্ড ডিস্ট্রিবিউশন ডিপার্টমেন্ট</p>
          
          {/* Dynamic Badge */}
          <div className="inline-block mt-2 bg-zinc-100 text-zinc-900 text-xs px-4 py-1.5 rounded-full font-bold border border-zinc-300">
            {getReportScopeTitle()} • ({getReportPeriodTitle()})
          </div>

          <div className="text-[11px] text-zinc-500 mt-2">
            প্রতিবেদন প্রস্তুতের তারিখ: <b>{currentDate}</b>
          </div>
        </div>

        {/* Dynamic Primary KPI Summary Cards based on Selected Scope */}
        {scope === 'press' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">মোট প্রেস বিল (অর্ডার)</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(pressAccounts.totalOrderBill)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">অর্ডার কপি অনুযায়ী</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">প্রাপ্ত চালান মূল্য</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(pressAccounts.totalReceivedBill)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">হেড অফিসে গৃহীত</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">প্রেসে পরিশোধিত টাকা</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(pressAccounts.totalPaidToPress)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{pressPayments.length} টি ভাউচার</span>
            </div>

            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl">
              <span className="text-[11px] text-zinc-600 block font-bold">প্রেসের বকেয়া ব্যালেন্স</span>
              <span className="text-xl font-black text-zinc-900 font-mono">
                {pressAccounts.netDueOnOrder > 0
                  ? formatBDT(pressAccounts.netDueOnOrder)
                  : pressAccounts.netDueOnOrder < 0
                  ? `+${formatBDT(Math.abs(pressAccounts.netDueOnOrder))}`
                  : '৳০'}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {pressAccounts.netDueOnOrder > 0 ? 'প্রেস পাবে' : 'পরিশোধিত'}
              </span>
            </div>
          </div>
        ) : scope === 'online' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">অনলাইন বিক্রিত কপি</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalOnlineSold)} কপি</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">বইবাড়ি, রকমারি, ওয়াফিলাইফ</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">অনলাইন মোট রাজস্ব</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineBilled)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">ইনভয়েস মূল্য</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">অনলাইন আদায়কৃত</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineCollected)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">ব্যাংক ও বিকাশ</span>
            </div>

            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl">
              <span className="text-[11px] text-zinc-600 block font-bold">অনলাইন ডিউ / বকেয়া</span>
              <span className="text-xl font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineDue)}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">অনলাইন বাকি</span>
            </div>
          </div>
        ) : scope === 'offline' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">অফলাইন বিক্রিত কপি</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalOfflineSold)} কপি</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">হেড অফিস ও ডিলার লাইব্রেরি</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">অফলাইন মোট রাজস্ব</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineBilled)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">ইনভয়েস মূল্য</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">লাইব্রেরি আদায়কৃত</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineCollected)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">ক্যাশ ও চেক</span>
            </div>

            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl">
              <span className="text-[11px] text-zinc-600 block font-bold">অফলাইন ডিউ / বকেয়া</span>
              <span className="text-xl font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineDue)}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">লাইব্রেরির নিকট বাকি</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">মোট বিক্রিত কপি</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalSold)} কপি</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">অনলাইন {monthlyTotals.totalOnlineSold} • অফলাইন {monthlyTotals.totalOfflineSold}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">মোট রাজস্ব (Revenue)</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(monthlyTotals.totalRevenue)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">মোট বিক্রয়মূল্য</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">প্রেসের বকেয়া ব্যালেন্স</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">
                {pressAccounts.netDueOnOrder > 0 ? formatBDT(pressAccounts.netDueOnOrder) : 'পরিশোধিত'}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">ফরিদ ভাই প্রেস</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">মোট চ্যানেল ডিউ</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.totalDue)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">অনলাইন {formatBDT(channelAccounts.onlineDue)} • অফলাইন {formatBDT(channelAccounts.offlineDue)}</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 1: BOOKS TABLE (Full / Online Only / Offline Only) */}
        {/* ======================================================== */}
        {salesMode !== 'none' && (
          <div>
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>
                ১. বই ভিত্তিক {salesMode === 'online' ? 'অনলাইন' : salesMode === 'offline' ? 'অফলাইন ও লাইব্রেরি' : 'পূর্ণাঙ্গ'} বিক্রয় ও রাজস্ব খতিয়ান
              </span>
              <span className="text-[11px] font-normal text-zinc-500">{books.length} টি বই</span>
            </h3>

            {/* A: Online-Only Books Table */}
            {salesMode === 'online' && (
              <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
                <table className="w-full min-w-[750px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-900 font-bold">
                      <th className="py-2.5 px-3 text-center w-12">SL</th>
                      <th className="py-2.5 px-3 min-w-[180px]">বইয়ের নাম</th>
                      <th className="py-2.5 px-3 text-right">MRP</th>
                      <th className="py-2.5 px-3 text-center">বইবাড়ি</th>
                      <th className="py-2.5 px-3 text-center">রকমারি</th>
                      <th className="py-2.5 px-3 text-center">ওয়াফিলাইফ</th>
                      <th className="py-2.5 px-3 text-center">অন্যান্য</th>
                      <th className="py-2.5 px-3 text-center bg-zinc-200 font-bold text-zinc-900">অনলাইন মোট বিক্রি</th>
                      <th className="py-2.5 px-3 text-right bg-zinc-200/60 font-bold text-zinc-900">অনলাইন রাজস্ব</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {books.map(b => {
                      const m = calculateBookMetrics(b);
                      const onlineRev = m.totalOnlineSell * m.perBookAmount;
                      return (
                        <tr key={b.id}>
                          <td className="py-2 px-3 text-center font-mono">{b.sl}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">{b.bookName}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.perBookAmount)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.boibariTotal)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.rokomariTotal)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.wafilifeTotal)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.othersOnlineTotal)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono bg-zinc-50">{formatNumber(m.totalOnlineSell)} কপি</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 font-mono bg-zinc-50">{formatBDT(onlineRev)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                      <td colSpan={3} className="py-2.5 px-3 text-right">অনলাইন সর্বমোট যোগফল:</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.boibari)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.rokomari)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.wafilife)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.othersOnline)}</td>
                      <td className="py-2.5 px-3 text-center font-mono bg-zinc-200">{formatNumber(monthlyTotals.totalOnlineSold)} কপি</td>
                      <td className="py-2.5 px-3 text-right font-mono bg-zinc-200">{formatBDT(channelAccounts.onlineBilled)}</td>
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
                      <th className="py-2.5 px-3 text-center w-12">SL</th>
                      <th className="py-2.5 px-3 min-w-[180px]">বইয়ের নাম</th>
                      <th className="py-2.5 px-3 text-right">MRP</th>
                      <th className="py-2.5 px-3 text-center">হেড অফিস সেল</th>
                      <th className="py-2.5 px-3 text-center">নীলক্ষেত</th>
                      <th className="py-2.5 px-3 text-center">সুমনা (প্রেস)</th>
                      <th className="py-2.5 px-3 text-center">প্রমিজ (প্রেস)</th>
                      <th className="py-2.5 px-3 text-center">জয়স্টার (প্রেস)</th>
                      <th className="py-2.5 px-3 text-center bg-zinc-200 font-bold text-zinc-900">অফলাইন মোট বিক্রি</th>
                      <th className="py-2.5 px-3 text-right bg-zinc-200/60 font-bold text-zinc-900">অফলাইন রাজস্ব</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {books.map(b => {
                      const m = calculateBookMetrics(b);
                      const offlineRev = m.totalOfflineSell * m.perBookAmount;
                      return (
                        <tr key={b.id}>
                          <td className="py-2 px-3 text-center font-mono">{b.sl}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">{b.bookName}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.perBookAmount)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.headOfficeOfflineTotal)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.nilkhetTotal)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.sumonaTotal)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.promiseTotal)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.joystarTotal)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono bg-zinc-50">{formatNumber(m.totalOfflineSell)} কপি</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 font-mono bg-zinc-50">{formatBDT(offlineRev)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                      <td colSpan={3} className="py-2.5 px-3 text-right">অফলাইন সর্বমোট যোগফল:</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.hoOffline)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.nilkhet)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.sumona)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.promise)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.joystar)}</td>
                      <td className="py-2.5 px-3 text-center font-mono bg-zinc-200">{formatNumber(monthlyTotals.totalOfflineSold)} কপি</td>
                      <td className="py-2.5 px-3 text-right font-mono bg-zinc-200">{formatBDT(channelAccounts.offlineBilled)}</td>
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
                      <th className="py-2.5 px-3 text-center w-12">SL</th>
                      <th className="py-2.5 px-3 min-w-[180px]">বইয়ের নাম</th>
                      <th className="py-2.5 px-3 text-right">MRP</th>
                      <th className="py-2.5 px-3 text-right">লাভ/কপি</th>
                      <th className="py-2.5 px-3 text-center">প্রেস অর্ডার</th>
                      <th className="py-2.5 px-3 text-center">HO স্টক</th>
                      <th className="py-2.5 px-3 text-center">প্রেস স্টক</th>
                      <th className="py-2.5 px-3 text-center">অনলাইন</th>
                      <th className="py-2.5 px-3 text-center">অফলাইন</th>
                      <th className="py-2.5 px-3 text-center">মোট বিক্রি</th>
                      <th className="py-2.5 px-3 text-right">রাজস্ব</th>
                      <th className="py-2.5 px-3 text-right">নিট লাভ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {books.map(b => {
                      const m = calculateBookMetrics(b);
                      return (
                        <tr key={b.id}>
                          <td className="py-2 px-3 text-center font-mono">{b.sl}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">{b.bookName}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.perBookAmount)}</td>
                          <td className="py-2 px-3 text-right font-mono">+{formatBDT(m.profitPerBook)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.totalOrderFaridBhai)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono">{formatNumber(m.totalPresentStockHO)}</td>
                          <td className="py-2 px-3 text-center font-mono text-zinc-700">{formatNumber(m.stockToFaridBhai)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.totalOnlineSell)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.totalOfflineSell)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono">{formatNumber(m.totalSold)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.totalRevenue)}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 font-mono">+{formatBDT(m.totalNetProfit)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                      <td colSpan={4} className="py-2.5 px-3 text-right">সর্বমোট যোগফল:</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(books.reduce((s, b) => s + (Number(b.totalOrderFaridBhai) || 0), 0))}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalHOStock)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalPressStock)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalOnlineSold)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalOfflineSold)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalSold)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatBDT(monthlyTotals.totalRevenue)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">+{formatBDT(monthlyTotals.totalProfit)}</td>
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
              <span>২. ফরিদ ভাই প্রেস হিসাব ও পরিশোধিত পেমেন্ট বিবরণী</span>
              <span className="text-[11px] font-semibold text-zinc-600">
                {pressAccounts.netDueOnOrder > 0 ? `প্রেসের বকেয়া: ${formatBDT(pressAccounts.netDueOnOrder)}` : 'সম্পূর্ণ পরিশোধিত'}
              </span>
            </h3>

            <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
                    <th className="py-2 px-3">বইয়ের নাম</th>
                    <th className="py-2 px-3 text-center">অর্ডার কপি</th>
                    <th className="py-2 px-3 text-right">ছাপার খরচ</th>
                    <th className="py-2 px-3 text-right">মোট প্রেস বিল</th>
                    <th className="py-2 px-3 text-center">প্রাপ্ত চালান</th>
                    <th className="py-2 px-3 text-right">পরিশোধিত টাকা</th>
                    <th className="py-2 px-3 text-right">বাকি / ব্যালেন্স</th>
                    <th className="py-2 px-3 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pressAccounts.bookAccounts.map(b => (
                    <tr key={b.bookId}>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-zinc-900">{b.bookName}</div>
                        {b.lots && b.lots.length > 0 && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {b.lots.map((l) => `${l.lotName}: ${formatNumber(l.quantity)} কপি (${l.date})`).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{formatNumber(b.orderQuantity)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatBDT(b.makingCost)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatBDT(b.totalOrderBill)}</td>
                      <td className="py-2 px-3 text-center font-mono">{formatNumber(b.receivedCopies)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(b.totalPaid)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {b.dueOnOrder > 0 ? formatBDT(b.dueOnOrder) : b.dueOnOrder < 0 ? `+${formatBDT(Math.abs(b.dueOnOrder))}` : '৳০'}
                      </td>
                      <td className="py-2 px-3 text-center font-semibold text-[11px]">{b.statusText}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-300 text-zinc-900">
                    <td className="py-2.5 px-3 text-right">প্রেস সর্বমোট:</td>
                    <td className="py-2.5 px-3 text-center font-mono">{formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.orderQuantity, 0))}</td>
                    <td></td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(pressAccounts.totalOrderBill)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.receivedCopies, 0))}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(pressAccounts.totalPaidToPress)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {pressAccounts.netDueOnOrder > 0 ? formatBDT(pressAccounts.netDueOnOrder) : '৳০'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-zinc-600 font-normal">
                      {pressAccounts.netDueOnOrder > 0 ? 'প্রেস পাবে' : 'পরিশোধিত'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Press Payment Voucher History Table */}
        {includePressPayments && pressPayments.length > 0 && (
          <div className="avoid-break">
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>ফরিদ ভাই প্রেসে পরিশোধিত পেমেন্ট ভাউচার হিস্ট্রি ({pressPayments.length} টি ভাউচার)</span>
              <span className="text-[11px] font-bold text-zinc-900 font-mono">
                মোট পরিশোধ: {formatBDT(pressAccounts.totalPaidToPress)}
              </span>
            </h3>

            <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
                    <th className="py-2 px-3">তারিখ</th>
                    <th className="py-2 px-3">খাত / বইয়ের নাম</th>
                    <th className="py-2 px-3 text-right">পরিশোধিত টাকা</th>
                    <th className="py-2 px-3 text-center">মাধ্যম</th>
                    <th className="py-2 px-3">ভাউচার / চেক নং</th>
                    <th className="py-2 px-3">বিবরণ / নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pressPayments.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-medium text-zinc-900">{p.date}</td>
                      <td className="py-2 px-3 font-semibold text-zinc-900">{p.bookName || 'সার্বিক প্রেস অর্ডার'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(p.amount)}</td>
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
                ৩. {includeOnlineDue && !includeOfflineDue ? 'অনলাইন চ্যানেল' : !includeOnlineDue && includeOfflineDue ? 'অফলাইন ও লাইব্রেরি' : 'অনলাইন ও অফলাইন চ্যানেল'} ডিউ ও কালেকশন খতিয়ান
              </span>
              <span className="text-[11px] font-semibold text-zinc-600">
                মোট ডিউ: {formatBDT(filteredChannels.reduce((s, c) => s + c.dueAmount, 0))} • মোট আদায়: {formatBDT(filteredChannels.reduce((s, c) => s + c.totalCollected, 0))}
              </span>
            </h3>

            <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
                    <th className="py-2 px-3">চ্যানেল / লাইব্রেরি</th>
                    <th className="py-2 px-3 text-center">ধরন</th>
                    <th className="py-2 px-3 text-center">বিক্রিত কপি</th>
                    <th className="py-2 px-3 text-right">ইনভয়েস বিক্রয়মূল্য</th>
                    <th className="py-2 px-3 text-right">আদায়কৃত টাকা</th>
                    <th className="py-2 px-3 text-right">বাকি / ডিউ</th>
                    <th className="py-2 px-3 text-center">আদায় হার (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredChannels.map(ch => (
                    <tr key={ch.key}>
                      <td className="py-2 px-3 font-semibold text-zinc-900">{ch.name}</td>
                      <td className="py-2 px-3 text-center uppercase text-[10px] font-mono">{ch.type === 'online' ? 'অনলাইন' : 'অফলাইন'}</td>
                      <td className="py-2 px-3 text-center font-mono">{formatNumber(ch.totalCopies)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatBDT(ch.totalBilled)}</td>
                      <td className="py-2 px-3 text-right font-mono text-zinc-900">{formatBDT(ch.totalCollected)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {ch.dueAmount > 0 ? formatBDT(ch.dueAmount) : '৳০'}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{ch.collectionRate.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-300 text-zinc-900">
                    <td colSpan={2} className="py-2.5 px-3 text-right">চ্যানেল সর্বমোট:</td>
                    <td className="py-2.5 px-3 text-center font-mono">{formatNumber(filteredChannels.reduce((s, c) => s + c.totalCopies, 0))} কপি</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(filteredChannels.reduce((s, c) => s + c.totalBilled, 0))}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(filteredChannels.reduce((s, c) => s + c.totalCollected, 0))}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(filteredChannels.reduce((s, c) => s + c.dueAmount, 0))}</td>
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
              <span className="font-semibold block text-zinc-800">ইনভেন্টরি অফিসার</span>
              <span className="text-[10px] text-zinc-400">ওয়্যারহাউজ ও স্টক বিভাগ</span>
            </div>

            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1 mb-1"></div>
              <span className="font-semibold block text-zinc-800">হিসাবরক্ষণ কর্মকর্তা</span>
              <span className="text-[10px] text-zinc-400">অ্যাকাউন্টিং অ্যান্ড ফিন্যান্স</span>
            </div>

            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1 mb-1"></div>
              <span className="font-semibold block text-zinc-800">প্রকাশনা পরিচালক</span>
              <span className="text-[10px] text-zinc-400">বিদ্যাবাড়ি পাবলিকেশন</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};