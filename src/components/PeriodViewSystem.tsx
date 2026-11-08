import React, { useState } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  TrendingUp, 
  Wallet, 
  ShoppingBag, 
  Warehouse, 
  RotateCcw, 
  ArrowRight, 
  CalendarPlus,
  Globe,
  Store,
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Boxes,
  Clock,
  Layers,
  CreditCard,
  HandCoins,
  Filter
} from 'lucide-react';
import { BookRecord, PressPaymentRecord, ChannelCollectionRecord } from '../types/book';
import { 
  calculateDayBreakdown, 
  calculateWeekBreakdowns, 
  calculateBookMetrics, 
  calculatePressAccounts,
  calculateChannelDueAccounts,
  formatBDT, 
  formatNumber,
  formatMonthYearBengali,
  QUARTER_OPTIONS,
  HALF_YEAR_OPTIONS,
  createFreshMonthBooks,
  getDaysInMonth,
  BENGALI_MONTHS,
  AVAILABLE_YEARS
} from '../utils/calculations';

interface PeriodViewSystemProps {
  books: BookRecord[];
  onOpenDailyEntryForDay: (day: number) => void;
  onOpenDailyEntryForBookAndDay: (bookId: string, day: number) => void;
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
  pressPayments?: PressPaymentRecord[];
  channelCollections?: ChannelCollectionRecord[];
}

export type ViewPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';

export const PeriodViewSystem: React.FC<PeriodViewSystemProps> = ({
  books,
  onOpenDailyEntryForDay,
  onOpenDailyEntryForBookAndDay,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
  pressPayments = [],
  channelCollections = [],
}) => {
  const [period, setPeriod] = useState<ViewPeriod>('daily');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Multi-period state
  const [selectedQuarter, setSelectedQuarter] = useState<string>('q4');
  const [selectedHalfYear, setSelectedHalfYear] = useState<string>('h2');
  const [reportYear, setReportYear] = useState<number>(selectedYear);

  // Custom date range state (default to current month dates)
  const [customStartDate, setCustomStartDate] = useState<string>(
    `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  );

  // Helper to load books for any specific month
  const getBooksForMonth = (year: number, month: number): BookRecord[] => {
    try {
      const key = `biddabari_books_data_v2_${year}-${String(month).padStart(2, '0')}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    if (year === selectedYear && month === selectedMonth) return books;
    return createFreshMonthBooks(books);
  };

  // Day breakdown
  const dayData = calculateDayBreakdown(books, selectedDay);

  // Week breakdowns
  const weekDataList = calculateWeekBreakdowns(books, daysInMonth);
  const currentWeekData = weekDataList.find(w => w.weekNumber === selectedWeek) || weekDataList[0];

  // Month totals
  const monthTotals = books.reduce(
    (acc, b) => {
      const m = calculateBookMetrics(b);
      acc.totalSold += m.totalSold;
      acc.onlineSold += m.totalOnlineSell;
      acc.offlineSold += m.totalOfflineSell;
      acc.revenue += m.totalRevenue;
      acc.profit += m.totalNetProfit;
      acc.pressReceived += m.faridBhaiToHeadOffice;
      acc.returns += m.totalReturns;
      acc.hoStock += m.totalPresentStockHO;
      acc.pressStock += m.stockToFaridBhai;
      return acc;
    },
    {
      totalSold: 0,
      onlineSold: 0,
      offlineSold: 0,
      revenue: 0,
      profit: 0,
      pressReceived: 0,
      returns: 0,
      hoStock: 0,
      pressStock: 0,
    }
  );

  // -------------------------------------------------------------
  // Aggregate Multi-Month / Custom Range Data
  // -------------------------------------------------------------
  const getAggregatedDataForMonths = (monthsList: { year: number; month: number }[]) => {
    let totalSold = 0;
    let onlineSold = 0;
    let offlineSold = 0;
    let revenue = 0;
    let profit = 0;
    let pressReceived = 0;
    let returns = 0;

    const channels = {
      boibari: 0,
      rokomari: 0,
      wafilife: 0,
      othersOnline: 0,
      sumona: 0,
      promise: 0,
      joystar: 0,
      nilkhet: 0,
      hoOffline: 0,
    };

    const bookStatsMap: { [bookId: string]: { sl: number; name: string; sold: number; revenue: number; profit: number } } = {};

    monthsList.forEach(({ year, month }) => {
      const mBooks = getBooksForMonth(year, month);
      mBooks.forEach(b => {
        const m = calculateBookMetrics(b);
        totalSold += m.totalSold;
        onlineSold += m.totalOnlineSell;
        offlineSold += m.totalOfflineSell;
        revenue += m.totalRevenue;
        profit += m.totalNetProfit;
        pressReceived += m.faridBhaiToHeadOffice;
        returns += m.totalReturns;

        channels.boibari += m.boibariTotal;
        channels.rokomari += m.rokomariTotal;
        channels.wafilife += m.wafilifeTotal;
        channels.othersOnline += m.othersOnlineTotal;
        channels.sumona += m.sumonaTotal;
        channels.promise += m.promiseTotal;
        channels.joystar += m.joystarTotal;
        channels.nilkhet += m.nilkhetTotal;
        channels.hoOffline += m.headOfficeOfflineTotal;

        if (!bookStatsMap[b.id]) {
          bookStatsMap[b.id] = { sl: b.sl, name: b.bookName, sold: 0, revenue: 0, profit: 0 };
        }
        bookStatsMap[b.id].sold += m.totalSold;
        bookStatsMap[b.id].revenue += m.totalRevenue;
        bookStatsMap[b.id].profit += m.totalNetProfit;
      });
    });

    return {
      totalSold,
      onlineSold,
      offlineSold,
      revenue,
      profit,
      pressReceived,
      returns,
      channels,
      bookStats: Object.values(bookStatsMap),
    };
  };

  // Quarterly aggregated data
  const currentQuarterConfig = QUARTER_OPTIONS.find(q => q.key === selectedQuarter) || QUARTER_OPTIONS[3];
  const quarterMonths: { year: number; month: number }[] = [];
  for (let m = currentQuarterConfig.startMonth; m <= currentQuarterConfig.endMonth; m++) {
    quarterMonths.push({ year: reportYear, month: m });
  }
  const quarterData = getAggregatedDataForMonths(quarterMonths);

  // Half-Yearly aggregated data
  const currentHalfConfig = HALF_YEAR_OPTIONS.find(h => h.key === selectedHalfYear) || HALF_YEAR_OPTIONS[1];
  const halfYearMonths: { year: number; month: number }[] = [];
  for (let m = currentHalfConfig.startMonth; m <= currentHalfConfig.endMonth; m++) {
    halfYearMonths.push({ year: reportYear, month: m });
  }
  const halfYearData = getAggregatedDataForMonths(halfYearMonths);

  // Yearly aggregated data (all 12 months)
  const yearlyMonths = Array.from({ length: 12 }, (_, i) => ({ year: reportYear, month: i + 1 }));
  const yearlyData = getAggregatedDataForMonths(yearlyMonths);

  // Month-by-month sales progression for Yearly View
  const yearlyMonthlyBreakdown = yearlyMonths.map(({ year, month }) => {
    const mBooks = getBooksForMonth(year, month);
    let sold = 0;
    let rev = 0;
    let prof = 0;
    mBooks.forEach(b => {
      const m = calculateBookMetrics(b);
      sold += m.totalSold;
      rev += m.totalRevenue;
      prof += m.totalNetProfit;
    });
    const mInfo = BENGALI_MONTHS.find(x => x.value === month);
    return {
      month,
      name: mInfo ? mInfo.name : `${month}ম মাস`,
      shortName: mInfo ? mInfo.shortName : `${month}ম`,
      sold,
      revenue: rev,
      profit: prof,
    };
  });

  // Custom Date Range Data
  const getCustomRangeData = () => {
    const sDate = new Date(customStartDate);
    const eDate = new Date(customEndDate);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime()) || sDate > eDate) {
      return getAggregatedDataForMonths([{ year: selectedYear, month: selectedMonth }]);
    }

    // Determine involved months
    const involvedMonths: { year: number; month: number }[] = [];
    let cur = new Date(sDate.getFullYear(), sDate.getMonth(), 1);
    const endLimit = new Date(eDate.getFullYear(), eDate.getMonth(), 1);

    while (cur <= endLimit) {
      involvedMonths.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
      cur.setMonth(cur.getMonth() + 1);
    }

    return getAggregatedDataForMonths(involvedMonths);
  };
  const customRangeData = getCustomRangeData();

  // Active aggregated press and channel accounts
  const pressAccounts = calculatePressAccounts(books, pressPayments);
  const channelAccounts = calculateChannelDueAccounts(books, channelCollections);

  return (
    <div className="space-y-6">
      
      {/* View Period Selector Header (Black & White Theme) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <span>পিরিয়ডিক রিপোর্ট ও আর্থিক বিশ্লেষণ</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            দৈনিক, সাপ্তাহিক, মাসিক, ৩ মাস, ৬ মাস, বাৎসরিক ও নির্দিষ্ট তারিখ থেকে তারিখের রিপোর্ট
          </p>
        </div>

        {/* Responsive Period Switcher Pills */}
        <div className="flex flex-wrap bg-zinc-100 p-1 rounded-xl border border-zinc-200 gap-1 w-full lg:w-auto">
          {[
            { key: 'daily', label: 'দৈনিক (Daily)', icon: Calendar },
            { key: 'weekly', label: 'সাপ্তাহিক (Weekly)', icon: CalendarDays },
            { key: 'monthly', label: 'মাসিক (Monthly)', icon: CalendarRange },
            { key: 'quarterly', label: '৩ মাস (Quarterly)', icon: Layers },
            { key: 'half_yearly', label: '৬ মাস (Half-Yearly)', icon: Clock },
            { key: 'yearly', label: 'বাৎসরিক (Yearly)', icon: TrendingUp },
            { key: 'custom', label: 'তারিখ রেঞ্জ (Custom)', icon: Filter },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = period === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setPeriod(tab.key as ViewPeriod)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY VIEW */}
      {/* ======================================================== */}
      {period === 'daily' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Day / Date Navigation Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  disabled={selectedDay <= 1}
                  onClick={() => setSelectedDay(d => Math.max(1, d - 1))}
                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="পূর্ববর্তী তারিখ"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-700" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900 text-base">
                    {selectedDay} {formatMonthYearBengali(selectedMonth, selectedYear)} এর প্রতিবেদন
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    (মাসের {selectedDay}তম দিন)
                  </span>
                </div>
                <button
                  disabled={selectedDay >= daysInMonth}
                  onClick={() => setSelectedDay(d => Math.min(daysInMonth, d + 1))}
                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="পরবর্তী তারিখ"
                >
                  <ChevronRight className="w-4 h-4 text-zinc-700" />
                </button>
              </div>

              <button
                onClick={() => onOpenDailyEntryForDay(selectedDay)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-300 self-start sm:self-auto"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>{selectedDay} তারিখের ডাটা এন্ট্রি / এডিট করুন</span>
              </button>
            </div>

            {/* Horizontal Date Pills */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 mb-1.5">
                📅 ক্যালেন্ডার তারিখ নির্বাচন করুন (১লা থেকে {formatNumber(daysInMonth)} তারিখ):
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(dateNum => {
                  const daySales = calculateDayBreakdown(books, dateNum).totalSold;
                  const isSelected = selectedDay === dateNum;
                  return (
                    <button
                      key={dateNum}
                      onClick={() => setSelectedDay(dateNum)}
                      className={`flex flex-col items-center justify-center min-w-[48px] py-2 px-1 rounded-xl text-xs font-mono transition-all border ${
                        isSelected
                          ? 'bg-zinc-900 text-white font-bold border-zinc-900 shadow-sm scale-105'
                          : daySales > 0
                          ? 'bg-zinc-100 text-zinc-900 border-zinc-300 hover:bg-zinc-200'
                          : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="text-[11px] font-bold">{dateNum} তাং</span>
                      <span className="text-[9px] opacity-75">{daySales > 0 ? `${daySales}টি` : '—'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{selectedDay} তারিখে বিক্রি</span>
              <span className="text-xl font-bold text-zinc-900">{formatNumber(dayData.totalSold)} কপি</span>
              <span className="text-[10px] text-zinc-600 block mt-0.5">
                অনলাইন {dayData.onlineSold} • অফলাইন {dayData.offlineSold}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">আজকের রাজস্ব</span>
              <span className="text-xl font-bold text-zinc-900">{formatBDT(dayData.revenue)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">বিক্রয়মূল্য</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">আজকের নিট লাভ</span>
              <span className="text-xl font-bold text-zinc-900">+{formatBDT(dayData.profit)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">উৎপাদন ও বিজ্ঞাপন বাদে</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">প্রেস থেকে প্রাপ্ত</span>
              <span className="text-xl font-bold text-zinc-900">{formatNumber(dayData.pressReceived)} কপি</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">হেড অফিসে ডেলিভারি</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">আজকের রিটার্ন</span>
              <span className="text-xl font-bold text-zinc-900">{formatNumber(dayData.returns)} কপি</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">স্টকে যুক্ত</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">অনলাইন চ্যানেল</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(dayData.onlineSold)} কপি</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">বইবাড়ি: {dayData.channels.boibari}</span>
            </div>
          </div>

          {/* Book-by-Book breakdown for selected day */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm">{selectedDay} তারিখের বইভিত্তিক বিক্রয় খতিয়ান</h3>
              <span className="text-xs text-zinc-500">{dayData.bookBreakdown.length} টি বই</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                    <th className="py-2.5 px-3">বইয়ের নাম</th>
                    <th className="py-2.5 px-3 text-center">বিক্রিত কপি</th>
                    <th className="py-2.5 px-3 text-right">রাজস্ব (Revenue)</th>
                    <th className="py-2.5 px-3 text-right">নিট লাভ (Profit)</th>
                    <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {dayData.bookBreakdown.map((item) => (
                    <tr key={item.bookId} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-zinc-900">{item.bookName}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{formatNumber(item.sold)} কপি</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-900">{formatBDT(item.revenue)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">+{formatBDT(item.profit)}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenDailyEntryForBookAndDay(item.bookId, selectedDay)}
                          className="text-[11px] font-semibold text-zinc-800 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-200 transition-colors"
                        >
                          এডিট
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. WEEKLY VIEW */}
      {/* ======================================================== */}
      {period === 'weekly' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Week Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-800">সপ্তাহ নির্বাচন:</span>
              <div className="flex items-center gap-1.5">
                {weekDataList.map((w) => (
                  <button
                    key={w.weekNumber}
                    onClick={() => setSelectedWeek(w.weekNumber)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedWeek === w.weekNumber
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-mono text-zinc-500">
              {currentWeekData.startDay} - {currentWeekData.endDay} {formatMonthYearBengali(selectedMonth, selectedYear)}
            </div>
          </div>

          {/* Week Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">সাপ্তাহিক মোট বিক্রয়</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(currentWeekData.totalSold)} কপি
              </span>
              <div className="text-xs text-zinc-500 mt-1">
                অনলাইন {formatNumber(currentWeekData.onlineSold)} • অফলাইন {formatNumber(currentWeekData.offlineSold)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">সাপ্তাহিক রাজস্ব</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(currentWeekData.revenue)}
              </span>
              <div className="text-xs text-zinc-500 mt-1">বিক্রয়মূল্য</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">সাপ্তাহিক নিট লাভ</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(currentWeekData.profit)}
              </span>
              <div className="text-xs text-zinc-500 mt-1">মুনাফা</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">সেরা বিক্রির দিন</span>
              <span className="text-xl font-bold text-zinc-900 mt-1 block">
                {currentWeekData.bestDay.day} তারিখ
              </span>
              <div className="text-xs text-zinc-500 mt-1">
                ঐ দিনে বিক্রি: {formatNumber(currentWeekData.bestDay.sold)} কপি
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MONTHLY VIEW */}
      {/* ======================================================== */}
      {period === 'monthly' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Monthly KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">মাসিক সর্বমোট বিক্রয়</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(monthTotals.totalSold)} কপি
              </span>
              <div className="mt-2 text-xs text-zinc-600 font-medium">
                অনলাইন {formatNumber(monthTotals.onlineSold)} • অফলাইন {formatNumber(monthTotals.offlineSold)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">মাসিক সর্বমোট রাজস্ব</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(monthTotals.revenue)}
              </span>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                অনলাইন ও অফলাইন সম্মিলিত আয়
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">মাসিক সর্বমোট নিট লাভ</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(monthTotals.profit)}
              </span>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                প্রডাকশন ও বিজ্ঞাপন বাদে আয়
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">মাস শেষে হেড অফিস স্টক</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(monthTotals.hoStock)} কপি
              </span>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                ফরিদ ভাই প্রেসে স্টক: {formatNumber(monthTotals.pressStock)} কপি
              </div>
            </div>
          </div>

          {/* Month Weeks Comparison */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-base mb-1">
              {formatMonthYearBengali(selectedMonth, selectedYear)} মাসের সপ্তাহের তুলনা
            </h3>
            <p className="text-xs text-zinc-500 mb-4">১ থেকে {formatNumber(daysInMonth)} তারিখের {formatNumber(weekDataList.length)}টি সপ্তাহের সেলস ও লাভের তুলনামূলক অগ্রগতি</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {weekDataList.map((w) => {
                const maxSold = Math.max(...weekDataList.map(x => x.totalSold), 1);
                const heightPct = Math.max((w.totalSold / maxSold) * 100, 8);

                return (
                  <div key={w.weekNumber} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-xs text-zinc-900 block">{w.name.split(' (')[0]}</span>
                      <span className="text-[10px] text-zinc-500 block mb-2">{w.startDay} - {w.endDay} তারিখ</span>
                    </div>

                    <div className="h-24 flex items-end justify-center py-2">
                      <div
                        className="w-12 bg-zinc-900 rounded-t-lg transition-all flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ height: `${heightPct}%` }}
                      >
                        {w.totalSold > 0 ? w.totalSold : ''}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-200 text-center">
                      <span className="text-xs font-bold text-zinc-900 block">+{formatBDT(w.profit)}</span>
                      <span className="text-[10px] text-zinc-500">নিট লাভ</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. QUARTERLY VIEW (৩ মাসের রিপোর্ট) */}
      {/* ======================================================== */}
      {period === 'quarterly' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Quarter Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-800">কোয়ার্টার নির্বাচন:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUARTER_OPTIONS.map(q => (
                  <button
                    key={q.key}
                    onClick={() => setSelectedQuarter(q.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedQuarter === q.key
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">বছর:</span>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="text-xs font-bold border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50 font-mono"
              >
                {AVAILABLE_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quarter KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{currentQuarterConfig.label} মোট বিক্রয়</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(quarterData.totalSold)} কপি
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                অনলাইন {formatNumber(quarterData.onlineSold)} • অফলাইন {formatNumber(quarterData.offlineSold)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">৩ মাসের মোট রাজস্ব</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(quarterData.revenue)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">বিক্রয়মূল্য</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">৩ মাসের মোট নিট লাভ</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(quarterData.profit)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">খরচ বাদে অর্জিত মুনাফা</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">প্রেস প্রাপ্তি ও রিটার্ন</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(quarterData.pressReceived)} কপি
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                রিটার্ন: {formatNumber(quarterData.returns)} কপি
              </span>
            </div>
          </div>

          {/* Book Summary for Quarter */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm">{currentQuarterConfig.label} ({reportYear}) - বই ভিত্তিক সারসংক্ষেপ</h3>
              <span className="text-xs text-zinc-500">{quarterData.bookStats.length} টি বই</span>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                <thead>
                  <tr className="bg-zinc-50 font-bold border-b border-zinc-200 text-zinc-900">
                    <th className="py-2.5 px-3 w-12 text-center">SL</th>
                    <th className="py-2.5 px-3">বইয়ের নাম</th>
                    <th className="py-2.5 px-3 text-center">মোট বিক্রয়</th>
                    <th className="py-2.5 px-3 text-right">৩ মাসের রাজস্ব</th>
                    <th className="py-2.5 px-3 text-right">৩ মাসের নিট লাভ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {quarterData.bookStats.map(b => (
                    <tr key={b.name} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-3 text-center font-mono">{b.sl}</td>
                      <td className="py-3 px-3 font-bold text-zinc-900">{b.name}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{formatNumber(b.sold)} কপি</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(b.revenue)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">+{formatBDT(b.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 5. HALF-YEARLY VIEW (৬ মাসের রিপোর্ট) */}
      {/* ======================================================== */}
      {period === 'half_yearly' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Half-Year Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-800">ষাণ্মাসিক নির্বাচন:</span>
              <div className="flex flex-wrap gap-1.5">
                {HALF_YEAR_OPTIONS.map(h => (
                  <button
                    key={h.key}
                    onClick={() => setSelectedHalfYear(h.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedHalfYear === h.key
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">বছর:</span>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="text-xs font-bold border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50 font-mono"
              >
                {AVAILABLE_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Half-Year KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{currentHalfConfig.label} মোট বিক্রয়</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(halfYearData.totalSold)} কপি
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                অনলাইন {formatNumber(halfYearData.onlineSold)} • অফলাইন {formatNumber(halfYearData.offlineSold)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">৬ মাসের মোট রাজস্ব</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(halfYearData.revenue)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">বিক্রয়মূল্য</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">৬ মাসের মোট নিট লাভ</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(halfYearData.profit)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">মুনাফা</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">প্রেস প্রাপ্তি ও রিটার্ন</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(halfYearData.pressReceived)} কপি
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                রিটার্ন: {formatNumber(halfYearData.returns)} কপি
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 6. YEARLY VIEW (বাৎসরিক / ইয়ারলি রিপোর্ট) */}
      {/* ======================================================== */}
      {period === 'yearly' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Year Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-800">রিপোর্ট বছর:</span>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="text-sm font-bold border border-zinc-300 rounded-xl px-3 py-1.5 bg-zinc-50 font-mono text-zinc-900"
              >
                {AVAILABLE_YEARS.map(y => (
                  <option key={y} value={y}>{y} সালের পূর্ণাঙ্গ বার্ষিক খতিয়ান</option>
                ))}
              </select>
            </div>
          </div>

          {/* Yearly Primary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{reportYear} সালের মোট বিক্রয়</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(yearlyData.totalSold)} কপি
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                অনলাইন {formatNumber(yearlyData.onlineSold)} • অফলাইন {formatNumber(yearlyData.offlineSold)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">বাৎসরিক মোট রাজস্ব</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(yearlyData.revenue)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">১২ মাসের সমন্বিত বিক্রয়মূল্য</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">বাৎসরিক মোট নিট লাভ</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(yearlyData.profit)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">প্রডাকশন ও বিজ্ঞাপন বাদে মুনাফা</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">বাৎসরিক প্রেস চালান প্রাপ্তি</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(yearlyData.pressReceived)} কপি
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                মোট রিটার্ন: {formatNumber(yearlyData.returns)} কপি
              </span>
            </div>
          </div>

          {/* Month-by-Month Progress Bar Cards */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-sm mb-4">
              {reportYear} সালের ১২টি মাসের বিক্রয় চিত্র
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {yearlyMonthlyBreakdown.map(m => {
                const maxM = Math.max(...yearlyMonthlyBreakdown.map(x => x.sold), 1);
                const pct = Math.max((m.sold / maxM) * 100, 6);
                return (
                  <div key={m.month} className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex flex-col justify-between">
                    <span className="font-bold text-xs text-zinc-900">{m.name}</span>
                    <div className="h-16 flex items-end justify-center py-1">
                      <div 
                        className="w-8 bg-zinc-900 rounded-t-sm transition-all"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <div className="pt-1 border-t border-zinc-200 text-center">
                      <span className="font-mono text-xs font-bold text-zinc-900 block">{formatNumber(m.sold)} কপি</span>
                      <span className="text-[10px] text-zinc-500">+{formatBDT(m.profit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 7. CUSTOM DATE RANGE VIEW (নির্দিষ্ট তারিখ থেকে তারিখের রিপোর্ট) */}
      {/* ======================================================== */}
      {period === 'custom' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Custom Date Range Picker Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">শুরুর তারিখ (From):</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="text-xs font-semibold border border-zinc-300 rounded-xl px-3 py-1.5 bg-zinc-50 font-mono text-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">শেষের তারিখ (To):</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="text-xs font-semibold border border-zinc-300 rounded-xl px-3 py-1.5 bg-zinc-50 font-mono text-zinc-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="text-xs font-bold text-zinc-800 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 self-start sm:self-auto">
              ক্যালেন্ডার রেঞ্জ: {customStartDate} থেকে {customEndDate}
            </div>
          </div>

          {/* Custom Range KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">নির্বাচিত রেঞ্জে মোট বিক্রয়</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(customRangeData.totalSold)} কপি
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                অনলাইন {formatNumber(customRangeData.onlineSold)} • অফলাইন {formatNumber(customRangeData.offlineSold)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">নির্বাচিত রেঞ্জে রাজস্ব</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(customRangeData.revenue)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">বিক্রয়মূল্য</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">নির্বাচিত রেঞ্জে নিট লাভ</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(customRangeData.profit)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">অর্জিত মুনাফা</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">প্রেস প্রাপ্তি ও রিটার্ন</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(customRangeData.pressReceived)} কপি
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                রিটার্ন: {formatNumber(customRangeData.returns)} কপি
              </span>
            </div>
          </div>

          {/* Books in custom range */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm">বই ভিত্তিক সেলস খতিয়ান ({customStartDate} থেকে {customEndDate})</h3>
              <span className="text-xs text-zinc-500">{customRangeData.bookStats.length} টি বই</span>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                <thead>
                  <tr className="bg-zinc-50 font-bold border-b border-zinc-200 text-zinc-900">
                    <th className="py-2.5 px-3 w-12 text-center">SL</th>
                    <th className="py-2.5 px-3">বইয়ের নাম</th>
                    <th className="py-2.5 px-3 text-center">বিক্রিত কপি</th>
                    <th className="py-2.5 px-3 text-right">রাজস্ব</th>
                    <th className="py-2.5 px-3 text-right">নিট লাভ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {customRangeData.bookStats.map(b => (
                    <tr key={b.name} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-3 text-center font-mono">{b.sl}</td>
                      <td className="py-3 px-3 font-bold text-zinc-900">{b.name}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{formatNumber(b.sold)} কপি</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(b.revenue)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">+{formatBDT(b.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
