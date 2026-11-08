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
  HandCoins
} from 'lucide-react';
import { BookRecord, PressPaymentRecord, ChannelCollectionRecord } from '../types/book';
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
  channelCollections?: ChannelCollectionRecord[];
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';

export const PrintableReport: React.FC<PrintableReportProps> = ({ 
  books,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
  pressPayments = [],
  channelCollections = [],
}) => {
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

  const currentDate = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Press accounts and Channel Dues
  const pressAccounts = calculatePressAccounts(books, pressPayments);
  const channelAccounts = calculateChannelDueAccounts(books, channelCollections);

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

  return (
    <div className="space-y-6 w-full">
      
      {/* Print Controls Bar (Hidden during printing) */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4 max-w-6xl mx-auto w-full">
        
        {/* Top Switcher Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              অফিসিয়াল এক্সিকিউটিভ রিপোর্ট ও প্রিন্ট
            </h2>
            <p className="text-xs text-zinc-500">
              দৈনিক, সাপ্তাহিক, মাসিক, ৩ মাস, ৬ মাস, বাৎসরিক বা কাস্টম রেঞ্জের প্রতিবেদন প্রিন্ট বা PDF করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded-lg">
              📄 A4 সাইজ ফরম্যাট (প্রেস হিসাব ও ডিউ বিবরণী অন্তর্ভুক্ত)
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

        {/* Report Type Tabs */}
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
          <div className="inline-block mt-2 bg-zinc-100 text-zinc-900 text-xs px-4 py-1 rounded-full font-bold border border-zinc-300">
            {reportType === 'daily' && `দৈনিক বিক্রয়, স্টক ও আর্থিক বিবরণী রিপোর্ট • তারিখ: ${selectedDay} ${formatMonthYearBengali(selectedMonth, selectedYear)}`}
            {reportType === 'weekly' && `সাপ্তাহিক বিক্রয় ও অগ্রগতি বিবরণী রিপোর্ট • ${currentWeek.name} (${currentWeek.startDay} থেকে ${currentWeek.endDay} ${formatMonthYearBengali(selectedMonth, selectedYear)})`}
            {reportType === 'monthly' && `মাসিক সার্বিক বুক সেলস, স্টক ইনভেন্টরি ও আর্থিক বিবরণী রিপোর্ট (${formatMonthYearBengali(selectedMonth, selectedYear)})`}
            {reportType === 'quarterly' && `৩ মাসের কোয়ার্টারলি বিক্রয় ও ইনভেন্টরি রিপোর্ট (${currentQuarter.label} - ${reportYear})`}
            {reportType === 'half_yearly' && `৬ মাসের ষাণ্মাসিক বিক্রয় ও ইনভেন্টরি রিপোর্ট (${currentHalf.label} - ${reportYear})`}
            {reportType === 'yearly' && `${reportYear} সালের বার্ষিক পূর্ণাঙ্গ বিক্রয় ও ইনভেন্টরি রিপোর্ট`}
            {reportType === 'custom' && `নির্দিষ্ট তারিখ রেঞ্জের সমন্বিত সেলস রিপোর্ট (${customStartDate} থেকে ${customEndDate})`}
          </div>

          <div className="text-[11px] text-zinc-500 mt-2">
            প্রতিবেদন প্রস্তুতের তারিখ: <b>{currentDate}</b>
          </div>
        </div>

        {/* Primary KPI Summary Cards */}
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
            <span className="text-[11px] text-zinc-500 block">মোট নিট লাভ (Profit)</span>
            <span className="text-xl font-bold text-zinc-900 font-mono">+{formatBDT(monthlyTotals.totalProfit)}</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">খরচ বাদে অর্জিত আয়</span>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
            <span className="text-[11px] text-zinc-500 block">বর্তমান হেড অফিস স্টক</span>
            <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalHOStock)} কপি</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">প্রেস স্টক: {formatNumber(monthlyTotals.totalPressStock)}</span>
          </div>
        </div>

        {/* Section 1: Books Table */}
        <div>
          <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
            <span>১. বই ভিত্তিক পূর্ণাঙ্গ বিক্রয় ও স্টক খতিয়ান</span>
            <span className="text-[11px] font-normal text-zinc-500">{books.length} টি বই</span>
          </h3>
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
        </div>

        {/* Section 2: Press Accounts & Due Balance */}
        <div className="avoid-break">
          <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
            <span>২. ফরিদ ভাই প্রেস হিসাব ও পরিশোধিত পেমেন্ট বিবরণী</span>
            <span className="text-[11px] font-semibold text-zinc-600">
              {pressAccounts.netDueOnOrder > 0 ? `প্রেস পাবে: ${formatBDT(pressAccounts.netDueOnOrder)}` : 'পরিশোধিত'}
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
                    <td className="py-2 px-3 font-semibold text-zinc-900">{b.bookName}</td>
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
            </table>
          </div>
        </div>

        {/* Section 3: Online & Offline Channel Due & Collection */}
        <div className="avoid-break">
          <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
            <span>৩. অনলাইন ও অফলাইন চ্যানেল ডিউ কালেকশন খতিয়ান</span>
            <span className="text-[11px] font-semibold text-zinc-600">
              মোট ডিউ: {formatBDT(channelAccounts.totalDue)} • মোট আদায়: {formatBDT(channelAccounts.totalCollected)}
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
                {channelAccounts.channels.map(ch => (
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
            </table>
          </div>
        </div>

        {/* Signatures block (Auto avoid cut across pages) */}
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

      </div>

    </div>
  );
};
