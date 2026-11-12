import React, { useState } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  TrendingUp, 
  CalendarPlus, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Clock, 
  Filter
} from 'lucide-react';
import { BookRecord, PressPaymentRecord, ChannelCollectionRecord } from '../types/book';
import { 
  calculateDayBreakdown, 
  calculateWeekBreakdowns, 
  calculateBookMetrics, 
  formatBDT, 
  formatNumber, 
  formatMonthYearBengali, 
  QUARTER_OPTIONS, 
  HALF_YEAR_OPTIONS, 
  createFreshMonthBooks, 
  BENGALI_MONTHS, 
  AVAILABLE_YEARS 
} from '../utils/calculations';
import { Language, tr } from '../utils/i18n';

interface PeriodViewSystemProps {
  books: BookRecord[];
  onOpenDailyEntryForDay: (day: number) => void;
  onOpenDailyEntryForBookAndDay: (bookId: string, day: number) => void;
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
  pressPayments?: PressPaymentRecord[];
  channelCollections?: ChannelCollectionRecord[];
  language?: Language;
}

export type ViewPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';

export const PeriodViewSystem: React.FC<PeriodViewSystemProps> = ({
  books,
  onOpenDailyEntryForDay,
  onOpenDailyEntryForBookAndDay,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
  language = 'en',
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

  // Aggregate Multi-Month / Custom Range Data
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
          bookStatsMap[b.id] = {
            sl: b.sl,
            name: b.bookName,
            sold: 0,
            revenue: 0,
            profit: 0,
          };
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
      name: language === 'bn' 
        ? (mInfo ? mInfo.name : `${month}ম মাস`)
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month - 1],
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

  return (
    <div className="space-y-6">
      
      {/* View Period Selector Header (Black & White Theme) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <span>{tr('পিরিয়ডিক রিপোর্ট ও আর্থিক বিশ্লেষণ', 'Periodic Reports & Financial Analytics', language)}</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {tr(
              'দৈনিক, সাপ্তাহিক, মাসিক, ৩ মাস, ৬ মাস, বাৎসরিক ও নির্দিষ্ট তারিখ থেকে তারিখের রিপোর্ট',
              'Daily, weekly, monthly, 3-month, 6-month, yearly, and custom range date analytics',
              language
            )}
          </p>
        </div>

        {/* Responsive Period Switcher Pills */}
        <div className="flex flex-wrap bg-zinc-100 p-1 rounded-xl border border-zinc-200 gap-1 w-full lg:w-auto">
          {[
            { key: 'daily', label: tr('দৈনিক (Daily)', 'Daily', language), icon: Calendar },
            { key: 'weekly', label: tr('সাপ্তাহিক (Weekly)', 'Weekly', language), icon: CalendarDays },
            { key: 'monthly', label: tr('মাসিক (Monthly)', 'Monthly', language), icon: CalendarRange },
            { key: 'quarterly', label: tr('৩ মাস (Quarterly)', '3-Month (Quarterly)', language), icon: Layers },
            { key: 'half_yearly', label: tr('৬ মাস (Half-Yearly)', '6-Month (Half-Yearly)', language), icon: Clock },
            { key: 'yearly', label: tr('বাৎসরিক (Yearly)', 'Yearly', language), icon: TrendingUp },
            { key: 'custom', label: tr('তারিখ রেঞ্জ (Custom)', 'Custom Date Range', language), icon: Filter },
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
                  title={tr('পূর্ববর্তী তারিখ', 'Previous Date', language)}
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-700" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900 text-base">
                    {language === 'bn' ? `${selectedDay} ${formatMonthYearBengali(selectedMonth, selectedYear, language)} এর প্রতিবেদন` : `Report for Day ${selectedDay}, ${formatMonthYearBengali(selectedMonth, selectedYear, language)}`}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    ({language === 'bn' ? `মাসের ${selectedDay}তম দিন` : `Day ${selectedDay} of month`})
                  </span>
                </div>
                <button
                  disabled={selectedDay >= daysInMonth}
                  onClick={() => setSelectedDay(d => Math.min(daysInMonth, d + 1))}
                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title={tr('পরবর্তী তারিখ', 'Next Date', language)}
                >
                  <ChevronRight className="w-4 h-4 text-zinc-700" />
                </button>
              </div>

              <button
                onClick={() => onOpenDailyEntryForDay(selectedDay)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-300 self-start sm:self-auto"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>{tr(`${selectedDay} তারিখের ডাটা এন্ট্রি / এডিট করুন`, `Entry / Edit Data for Day ${selectedDay}`, language)}</span>
              </button>
            </div>

            {/* Horizontal Date Pills */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 mb-1.5">
                📅 {tr(`ক্যালেন্ডার তারিখ নির্বাচন করুন (১লা থেকে ${formatNumber(daysInMonth, language)} তারিখ):`, `Select Calendar Date (Day 1 to ${formatNumber(daysInMonth, language)}):`, language)}
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
                      <span className="text-[11px] font-bold">{language === 'bn' ? `${dateNum} তাং` : `D${dateNum}`}</span>
                      <span className="text-[9px] opacity-75">{daySales > 0 ? `${daySales}` : '—'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{tr(`${selectedDay} তারিখে বিক্রি`, `Day ${selectedDay} Sold`, language)}</span>
              <span className="text-xl font-bold text-zinc-900">{formatNumber(dayData.totalSold, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-600 block mt-0.5">
                {tr('অনলাইন', 'Online', language)} {formatNumber(dayData.onlineSold, language)} • {tr('অফলাইন', 'Offline', language)} {formatNumber(dayData.offlineSold, language)}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{tr('আজকের রাজস্ব', 'Revenue', language)}</span>
              <span className="text-xl font-bold text-zinc-900">{formatBDT(dayData.revenue, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('বিক্রয়মূল্য', 'Gross Sales', language)}</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{tr('আজকের নিট লাভ', 'Net Profit', language)}</span>
              <span className="text-xl font-bold text-zinc-900">+{formatBDT(dayData.profit, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('খরচ বাদে মুনাফা', 'Net of costs', language)}</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{tr('প্রেস থেকে প্রাপ্ত', 'Press Receipts', language)}</span>
              <span className="text-xl font-bold text-zinc-900">{formatNumber(dayData.pressReceived, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('হেড অফিসে ডেলিভারি', 'Delivered to HO', language)}</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{tr('আজকের রিটার্ন', 'Daily Returns', language)}</span>
              <span className="text-xl font-bold text-zinc-900">{formatNumber(dayData.returns, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('স্টকে যুক্ত', 'Restocked', language)}</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{tr('অনলাইন চ্যানেল', 'Online Channels', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(dayData.onlineSold, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('বইবাড়ি:', 'Boibari:', language)} {formatNumber(dayData.channels.boibari, language)}</span>
            </div>
          </div>

          {/* Book-by-Book breakdown for selected day */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm">
                {tr(`${selectedDay} তারিখের বইভিত্তিক বিক্রয় খতিয়ান`, `Book-wise Sales Breakdown for Day ${selectedDay}`, language)}
              </h3>
              <span className="text-xs text-zinc-500">{formatNumber(dayData.bookBreakdown.length, language)} {tr('টি বই', 'Books', language)}</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                    <th className="py-2.5 px-3">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('বিক্রিত কপি', 'Sold Copies', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('রাজস্ব (Revenue)', 'Revenue', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('নিট লাভ (Profit)', 'Net Profit', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('অ্যাকশন', 'Action', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {dayData.bookBreakdown.map((item) => (
                    <tr key={item.bookId} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-zinc-900">{item.bookName}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{formatNumber(item.sold, language)} {tr('কপি', 'copies', language)}</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-900">{formatBDT(item.revenue, language)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">+{formatBDT(item.profit, language)}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenDailyEntryForBookAndDay(item.bookId, selectedDay)}
                          className="text-[11px] font-semibold text-zinc-800 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-200 transition-colors"
                        >
                          {tr('এডিট', 'Edit', language)}
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
              <span className="text-xs font-bold text-zinc-800">{tr('সপ্তাহ নির্বাচন:', 'Select Week:', language)}</span>
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
                    {language === 'bn' ? w.name : `Week ${w.weekNumber}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-mono text-zinc-500">
              {currentWeekData.startDay} - {currentWeekData.endDay} {formatMonthYearBengali(selectedMonth, selectedYear, language)}
            </div>
          </div>

          {/* Week Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('সাপ্তাহিক মোট বিক্রয়', 'Weekly Total Sold', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(currentWeekData.totalSold, language)} {tr('কপি', 'copies', language)}
              </span>
              <div className="text-xs text-zinc-500 mt-1">
                {tr('অনলাইন', 'Online', language)} {formatNumber(currentWeekData.onlineSold, language)} • {tr('অফলাইন', 'Offline', language)} {formatNumber(currentWeekData.offlineSold, language)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('সাপ্তাহিক রাজস্ব', 'Weekly Revenue', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(currentWeekData.revenue, language)}
              </span>
              <div className="text-xs text-zinc-500 mt-1">{tr('বিক্রয়মূল্য', 'Gross Sales', language)}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('সাপ্তাহিক নিট লাভ', 'Weekly Net Profit', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(currentWeekData.profit, language)}
              </span>
              <div className="text-xs text-zinc-500 mt-1">{tr('মুনাফা', 'Profit', language)}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('সেরা বিক্রির দিন', 'Best Sales Day', language)}</span>
              <span className="text-xl font-bold text-zinc-900 mt-1 block">
                {language === 'bn' ? `${currentWeekData.bestDay.day} তারিখ` : `Day ${currentWeekData.bestDay.day}`}
              </span>
              <div className="text-xs text-zinc-500 mt-1">
                {tr('ঐ দিনে বিক্রি:', 'Sold that day:', language)} {formatNumber(currentWeekData.bestDay.sold, language)} {tr('কপি', 'copies', language)}
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
              <span className="text-xs font-semibold text-zinc-500 block">{tr('মাসিক সর্বমোট বিক্রয়', 'Monthly Total Sold', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(monthTotals.totalSold, language)} {tr('কপি', 'copies', language)}
              </span>
              <div className="mt-2 text-xs text-zinc-600 font-medium">
                {tr('অনলাইন', 'Online', language)} {formatNumber(monthTotals.onlineSold, language)} • {tr('অফলাইন', 'Offline', language)} {formatNumber(monthTotals.offlineSold, language)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">{tr('মাসিক সর্বমোট রাজস্ব', 'Monthly Total Revenue', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(monthTotals.revenue, language)}
              </span>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                {tr('অনলাইন ও অফলাইন সম্মিলিত আয়', 'Combined Online & Offline Sales', language)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">{tr('মাসিক সর্বমোট নিট লাভ', 'Monthly Total Net Profit', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(monthTotals.profit, language)}
              </span>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                {tr('প্রডাকশন ও বিজ্ঞাপন বাদে আয়', 'Net Earnings after production & ads', language)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">{tr('মাস শেষে হেড অফিস স্টক', 'Head Office Stock at Month End', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(monthTotals.hoStock, language)} {tr('কপি', 'copies', language)}
              </span>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                {tr('ফরিদ ভাই প্রেসে স্টক:', 'Stock at Farid Bhai Press:', language)} {formatNumber(monthTotals.pressStock, language)} {tr('কপি', 'copies', language)}
              </div>
            </div>
          </div>

          {/* Month Weeks Comparison */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-base mb-1">
              {formatMonthYearBengali(selectedMonth, selectedYear, language)} {tr('মাসের সপ্তাহের তুলনা', 'Weekly Comparison', language)}
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              {tr(
                `১ থেকে ${formatNumber(daysInMonth, language)} তারিখের ${formatNumber(weekDataList.length, language)}টি সপ্তাহের সেলস ও লাভের তুলনামূলক অগ্রগতি`,
                `Weekly sales and profit comparison across ${formatNumber(daysInMonth, language)} days`,
                language
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {weekDataList.map((w) => {
                const maxSold = Math.max(...weekDataList.map(x => x.totalSold), 1);
                const heightPct = Math.max((w.totalSold / maxSold) * 100, 8);

                return (
                  <div key={w.weekNumber} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-xs text-zinc-900 block">{language === 'bn' ? w.name.split(' (')[0] : `Week ${w.weekNumber}`}</span>
                      <span className="text-[10px] text-zinc-500 block mb-2">{w.startDay} - {w.endDay} {tr('তারিখ', '', language)}</span>
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
                      <span className="text-xs font-bold text-zinc-900 block">+{formatBDT(w.profit, language)}</span>
                      <span className="text-[10px] text-zinc-500">{tr('নিট লাভ', 'Net Profit', language)}</span>
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
              <span className="text-xs font-bold text-zinc-800">{tr('কোয়ার্টার নির্বাচন:', 'Select Quarter:', language)}</span>
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
                    {language === 'bn' ? q.label : q.key.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">{tr('বছর:', 'Year:', language)}</span>
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
              <span className="text-xs text-zinc-500 block">{language === 'bn' ? currentQuarterConfig.label : currentQuarterConfig.key.toUpperCase()} {tr('মোট বিক্রয়', 'Total Sold', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(quarterData.totalSold, language)} {tr('কপি', 'copies', language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                {tr('অনলাইন', 'Online', language)} {formatNumber(quarterData.onlineSold, language)} • {tr('অফলাইন', 'Offline', language)} {formatNumber(quarterData.offlineSold, language)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('৩ মাসের মোট রাজস্ব', 'Quarterly Revenue', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(quarterData.revenue, language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">{tr('বিক্রয়মূল্য', 'Gross Sales', language)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('৩ মাসের মোট নিট লাভ', 'Quarterly Net Profit', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(quarterData.profit, language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">{tr('খরচ বাদে অর্জিত মুনাফা', 'Net of all costs', language)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('প্রেস প্রাপ্তি ও রিটার্ন', 'Press Receipts & Returns', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(quarterData.pressReceived, language)} {tr('কপি', 'copies', language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                {tr('রিটার্ন:', 'Returns:', language)} {formatNumber(quarterData.returns, language)} {tr('কপি', 'copies', language)}
              </span>
            </div>
          </div>

          {/* Book Summary for Quarter */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm">
                {language === 'bn' ? currentQuarterConfig.label : currentQuarterConfig.key.toUpperCase()} ({reportYear}) - {tr('বই ভিত্তিক সারসংক্ষেপ', 'Book-wise Summary', language)}
              </h3>
              <span className="text-xs text-zinc-500">{formatNumber(quarterData.bookStats.length, language)} {tr('টি বই', 'Books', language)}</span>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                <thead>
                  <tr className="bg-zinc-50 font-bold border-b border-zinc-200 text-zinc-900">
                    <th className="py-2.5 px-3 w-12 text-center">SL</th>
                    <th className="py-2.5 px-3">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('মোট বিক্রয়', 'Total Sold', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('৩ মাসের রাজস্ব', '3-Month Revenue', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('৩ মাসের নিট লাভ', '3-Month Profit', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {quarterData.bookStats.map(b => (
                    <tr key={b.name} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-3 text-center font-mono">{b.sl}</td>
                      <td className="py-3 px-3 font-bold text-zinc-900">{b.name}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{formatNumber(b.sold, language)} {tr('কপি', 'copies', language)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(b.revenue, language)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">+{formatBDT(b.profit, language)}</td>
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
              <span className="text-xs font-bold text-zinc-800">{tr('ষাণ্মাসিক নির্বাচন:', 'Select Half-Year:', language)}</span>
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
                    {language === 'bn' ? h.label : h.key.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">{tr('বছর:', 'Year:', language)}</span>
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
              <span className="text-xs text-zinc-500 block">{language === 'bn' ? currentHalfConfig.label : currentHalfConfig.key.toUpperCase()} {tr('মোট বিক্রয়', 'Total Sold', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(halfYearData.totalSold, language)} {tr('কপি', 'copies', language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                {tr('অনলাইন', 'Online', language)} {formatNumber(halfYearData.onlineSold, language)} • {tr('অফলাইন', 'Offline', language)} {formatNumber(halfYearData.offlineSold, language)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('৬ মাসের মোট রাজস্ব', '6-Month Revenue', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(halfYearData.revenue, language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">{tr('বিক্রয়মূল্য', 'Gross Sales', language)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('৬ মাসের মোট নিট লাভ', '6-Month Net Profit', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(halfYearData.profit, language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">{tr('মুনাফা', 'Profit', language)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('প্রেস প্রাপ্তি ও রিটার্ন', 'Press Receipts & Returns', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(halfYearData.pressReceived, language)} {tr('কপি', 'copies', language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                {tr('রিটার্ন:', 'Returns:', language)} {formatNumber(halfYearData.returns, language)} {tr('কপি', 'copies', language)}
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
              <span className="text-xs font-bold text-zinc-800">{tr('রিপোর্ট বছর:', 'Report Year:', language)}</span>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="text-sm font-bold border border-zinc-300 rounded-xl px-3 py-1.5 bg-zinc-50 font-mono text-zinc-900"
              >
                {AVAILABLE_YEARS.map(y => (
                  <option key={y} value={y}>{y} {tr('সালের পূর্ণাঙ্গ বার্ষিক খতিয়ান', 'Annual Ledger', language)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Yearly Primary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{reportYear} {tr('সালের মোট বিক্রয়', 'Total Sold', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(yearlyData.totalSold, language)} {tr('কপি', 'copies', language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                {tr('অনলাইন', 'Online', language)} {formatNumber(yearlyData.onlineSold, language)} • {tr('অফলাইন', 'Offline', language)} {formatNumber(yearlyData.offlineSold, language)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('বাৎসরিক মোট রাজস্ব', 'Annual Revenue', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(yearlyData.revenue, language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">{tr('১২ মাসের সমন্বিত বিক্রয়মূল্য', '12-Month Combined Sales', language)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('বাৎসরিক মোট নিট লাভ', 'Annual Net Profit', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(yearlyData.profit, language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">{tr('প্রডাকশন ও বিজ্ঞাপন বাদে মুনাফা', 'Net after production & ads', language)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('বাৎসরিক প্রেস চালান প্রাপ্তি', 'Annual Press Deliveries', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(yearlyData.pressReceived, language)} {tr('কপি', 'copies', language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                {tr('মোট রিটার্ন:', 'Total Returns:', language)} {formatNumber(yearlyData.returns, language)} {tr('কপি', 'copies', language)}
              </span>
            </div>
          </div>

          {/* Month-by-Month Progress Bar Cards */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-sm mb-4">
              {reportYear} {tr('সালের ১২টি মাসের বিক্রয় চিত্র', 'Monthly Sales Breakdown', language)}
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
                      <span className="font-mono text-xs font-bold text-zinc-900 block">{formatNumber(m.sold, language)} {tr('কপি', 'copies', language)}</span>
                      <span className="text-[10px] text-zinc-500">+{formatBDT(m.profit, language)}</span>
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
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">{tr('শুরুর তারিখ (From):', 'From Date:', language)}</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="text-xs font-semibold border border-zinc-300 rounded-xl px-3 py-1.5 bg-zinc-50 font-mono text-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">{tr('শেষের তারিখ (To):', 'To Date:', language)}</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="text-xs font-semibold border border-zinc-300 rounded-xl px-3 py-1.5 bg-zinc-50 font-mono text-zinc-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="text-xs font-bold text-zinc-800 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 self-start sm:self-auto">
              {tr(`ক্যালেন্ডার রেঞ্জ: ${customStartDate} থেকে ${customEndDate}`, `Date Range: ${customStartDate} to ${customEndDate}`, language)}
            </div>
          </div>

          {/* Custom Range KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('নির্বাচিত রেঞ্জে মোট বিক্রয়', 'Total Sold in Range', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(customRangeData.totalSold, language)} {tr('কপি', 'copies', language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                {tr('অনলাইন', 'Online', language)} {formatNumber(customRangeData.onlineSold, language)} • {tr('অফলাইন', 'Offline', language)} {formatNumber(customRangeData.offlineSold, language)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('নির্বাচিত রেঞ্জে রাজস্ব', 'Revenue in Range', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatBDT(customRangeData.revenue, language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">{tr('বিক্রয়মূল্য', 'Gross Sales', language)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('নির্বাচিত রেঞ্জে নিট লাভ', 'Net Profit in Range', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                +{formatBDT(customRangeData.profit, language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">{tr('অর্জিত মুনাফা', 'Net Profit', language)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-xs text-zinc-500 block">{tr('প্রেস প্রাপ্তি ও রিটার্ন', 'Press Receipts & Returns', language)}</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {formatNumber(customRangeData.pressReceived, language)} {tr('কপি', 'copies', language)}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                {tr('রিটার্ন:', 'Returns:', language)} {formatNumber(customRangeData.returns, language)} {tr('কপি', 'copies', language)}
              </span>
            </div>
          </div>

          {/* Books in custom range */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-sm">{tr(`বই ভিত্তিক সেলস খতিয়ান (${customStartDate} থেকে ${customEndDate})`, `Book-wise Sales (${customStartDate} to ${customEndDate})`, language)}</h3>
              <span className="text-xs text-zinc-500">{formatNumber(customRangeData.bookStats.length, language)} {tr('টি বই', 'Books', language)}</span>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                <thead>
                  <tr className="bg-zinc-50 font-bold border-b border-zinc-200 text-zinc-900">
                    <th className="py-2.5 px-3 w-12 text-center">SL</th>
                    <th className="py-2.5 px-3">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('বিক্রিত কপি', 'Sold Copies', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('রাজস্ব', 'Revenue', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('নিট লাভ', 'Net Profit', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {customRangeData.bookStats.map(b => (
                    <tr key={b.name} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-3 text-center font-mono">{b.sl}</td>
                      <td className="py-3 px-3 font-bold text-zinc-900">{b.name}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{formatNumber(b.sold, language)} {tr('কপি', 'copies', language)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(b.revenue, language)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">+{formatBDT(b.profit, language)}</td>
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
