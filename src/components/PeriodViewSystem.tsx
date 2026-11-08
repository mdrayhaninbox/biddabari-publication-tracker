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
  Boxes
} from 'lucide-react';
import { BookRecord } from '../types/book';
import { 
  calculateDayBreakdown, 
  calculateWeekBreakdowns, 
  calculateBookMetrics, 
  formatBDT, 
  formatNumber,
  formatMonthYearBengali 
} from '../utils/calculations';

interface PeriodViewSystemProps {
  books: BookRecord[];
  onOpenDailyEntryForDay: (day: number) => void;
  onOpenDailyEntryForBookAndDay: (bookId: string, day: number) => void;
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
}

export type ViewPeriod = 'daily' | 'weekly' | 'monthly';

export const PeriodViewSystem: React.FC<PeriodViewSystemProps> = ({
  books,
  onOpenDailyEntryForDay,
  onOpenDailyEntryForBookAndDay,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
}) => {
  const [period, setPeriod] = useState<ViewPeriod>('daily');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

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

  return (
    <div className="space-y-6">
      
      {/* View Period Selector Header (Black & White) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <span>{formatMonthYearBengali(selectedMonth, selectedYear)} - তারিখ ভিত্তিক রিপোর্ট ও বিশ্লেষণ</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            ১ থেকে {formatNumber(daysInMonth)} তারিখের দৈনিক বিক্রয়, সাপ্তাহিক অগ্রগতি ও পুরো মাসের হিসাব
          </p>
        </div>

        {/* Monochromatic Pill Switcher */}
        <div className="flex bg-zinc-100 p-1 rounded-xl self-start md:self-auto border border-zinc-200">
          <button
            onClick={() => setPeriod('daily')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              period === 'daily'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>দৈনিক তারিখ ভিউ (Daily)</span>
          </button>

          <button
            onClick={() => setPeriod('weekly')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              period === 'weekly'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>সাপ্তাহিক ভিউ (Weekly)</span>
          </button>

          <button
            onClick={() => setPeriod('monthly')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              period === 'monthly'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>মাসিক ভিউ (Monthly)</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY VIEW (দৈনিক তারিখ ভিউ) */}
      {/* ======================================================== */}
      {period === 'daily' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Day / Date Navigation & Selector Bar */}
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

            {/* Clean Monochromatic Horizontal Date Pills (1 to 31) */}
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

          {/* Selected Date Metric Cards (Clean Black & White) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{selectedDay} তারিখে মোট বিক্রি</span>
              <span className="text-xl font-bold text-zinc-900">{formatNumber(dayData.totalSold)} কপি</span>
              <span className="text-[10px] text-zinc-600 block mt-0.5">
                অনলাইন: {dayData.onlineSold} • অফলাইন: {dayData.offlineSold}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{selectedDay} তারিখের রাজস্ব</span>
              <span className="text-lg font-bold text-zinc-900">{formatBDT(dayData.revenue)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">অর্জিত বিক্রয় মূল্য</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">{selectedDay} তারিখের নিট লাভ</span>
              <span className="text-lg font-bold text-zinc-900">+{formatBDT(dayData.profit)}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">খরচ বাদে মুনাফা</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">প্রেস থেকে প্রাপ্ত চালান</span>
              <span className="text-xl font-bold text-zinc-900">{formatNumber(dayData.pressReceived)} কপি</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">হেড অফিসে জমা হয়েছে</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
              <span className="text-[11px] text-zinc-500 block font-medium">আজকের ফেরত (Return)</span>
              <span className="text-xl font-bold text-zinc-900">{formatNumber(dayData.returns)} কপি</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">স্টকে পুনরায় যুক্ত</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-center">
              <button
                onClick={() => onOpenDailyEntryForDay(selectedDay)}
                className="w-full py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1 transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>এন্ট্রি সম্পাদন</span>
              </button>
            </div>
          </div>

          {/* Selected Date Channel Deliveries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Online Channels on this date */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-zinc-700" />
                  <span>{selectedDay} তারিখ: অনলাইন প্ল্যাটফর্ম বিক্রয়</span>
                </span>
                <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                  মোট: {dayData.onlineSold} কপি
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">বইবাড়ি</span>
                  <span className="text-sm font-bold text-zinc-900">{dayData.channels.boibari}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">রকমারি</span>
                  <span className="text-sm font-bold text-zinc-900">{dayData.channels.rokomari}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">ওয়াফিলাইফ</span>
                  <span className="text-sm font-bold text-zinc-900">{dayData.channels.wafilife}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">অন্যান্য অনলাইন</span>
                  <span className="text-sm font-bold text-zinc-900">{dayData.channels.othersOnline}</span>
                </div>
              </div>
            </div>

            {/* Offline Channels on this date */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-zinc-700" />
                  <span>{selectedDay} তারিখ: অফলাইন ও লাইব্রেরি ডেলিভারি</span>
                </span>
                <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                  মোট: {dayData.offlineSold} কপি
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">হেড অফিস</span>
                  <span className="text-sm font-bold text-zinc-900">{dayData.channels.headOfficeOffline}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">নীলক্ষেত</span>
                  <span className="text-sm font-bold text-zinc-900">{dayData.channels.nilkhet}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">সুমনা</span>
                  <span className="text-sm font-bold text-zinc-900">{dayData.channels.sumona}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">প্রমিজ</span>
                  <span className="text-sm font-bold text-zinc-900">{dayData.channels.promise}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">জয়স্টার</span>
                  <span className="text-sm font-bold text-zinc-900">{dayData.channels.joystar}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Book-by-Book breakdown for selected date */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900">
                {selectedDay} তারিখে বই ভিত্তিক বিক্রয় বিবরণী
              </h4>
              <span className="text-[11px] text-zinc-500 font-medium">
                {dayData.bookBreakdown.filter(x => x.sold > 0).length} টি বই বিক্রি হয়েছে
              </span>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[550px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-semibold border-b border-zinc-200">
                    <th className="py-2.5 px-3">বইয়ের নাম</th>
                    <th className="py-2.5 px-3 text-center">আজকের বিক্রি</th>
                    <th className="py-2.5 px-3 text-right">আজকের রাজস্ব</th>
                    <th className="py-2.5 px-3 text-right">আজকের নিট লাভ</th>
                    <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {dayData.bookBreakdown.map((item, idx) => (
                    <tr key={item.bookId} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-zinc-900">
                        {idx + 1}. {item.bookName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-zinc-900">
                        {item.sold > 0 ? `${formatNumber(item.sold)} কপি` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-zinc-800">
                        {item.revenue > 0 ? formatBDT(item.revenue) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-900">
                        {item.profit > 0 ? `+${formatBDT(item.profit)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onOpenDailyEntryForBookAndDay(item.bookId, selectedDay)}
                          className="text-[11px] text-zinc-800 hover:text-black font-semibold px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded border border-zinc-200"
                        >
                          এন্ট্রি সম্পাদন
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
      {/* 2. WEEKLY VIEW (সাপ্তাহিক ভিউ - ১ থেকে ৩১ তারিখের ৫ সপ্তাহ) */}
      {/* ======================================================== */}
      {period === 'weekly' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Week Selector Cards Grid (Weeks 1 to 5 with dates) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {weekDataList.map(w => {
              const isSelected = selectedWeek === w.weekNumber;
              return (
                <div
                  key={w.weekNumber}
                  onClick={() => setSelectedWeek(w.weekNumber)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                      : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{w.name.split(' (')[0]}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`text-[11px] mb-2 font-mono ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {w.startDay} থেকে {w.endDay} তারিখ
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-zinc-200/40">
                    <div className="flex justify-between text-xs">
                      <span className={isSelected ? 'text-zinc-300' : 'text-zinc-500'}>মোট বিক্রি:</span>
                      <span className="font-bold">{formatNumber(w.totalSold)} কপি</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={isSelected ? 'text-zinc-300' : 'text-zinc-500'}>রাজস্ব:</span>
                      <span className="font-semibold">{formatBDT(w.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={isSelected ? 'text-zinc-300' : 'text-zinc-500'}>নিট লাভ:</span>
                      <span className="font-bold">+{formatBDT(w.profit)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Week Detailed Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-100 gap-2">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">
                  {currentWeekData.name} ({currentWeekData.startDay} থেকে {currentWeekData.endDay} তারিখের ফলাফল)
                </h3>
                <p className="text-xs text-zinc-500">
                  এই সপ্তাহের প্রতিদিনের অনলাইন ও অফলাইন চালানের বিশদ বিবরণ
                </p>
              </div>
              <span className="text-xs font-bold text-zinc-900 bg-zinc-100 border border-zinc-300 px-3 py-1 rounded-full self-start sm:self-auto">
                সাপ্তাহিক নিট লাভ: {formatBDT(currentWeekData.profit)}
              </span>
            </div>

            {/* Daily breakdown table for the week */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-semibold border-b border-zinc-200">
                    <th className="py-2.5 px-3">তারিখ</th>
                    <th className="py-2.5 px-3 text-center">অনলাইন বিক্রি</th>
                    <th className="py-2.5 px-3 text-center">অফলাইন বিক্রি</th>
                    <th className="py-2.5 px-3 text-center font-bold">মোট বিক্রি</th>
                    <th className="py-2.5 px-3 text-center">প্রেস চালান</th>
                    <th className="py-2.5 px-3 text-center">রিটার্ন</th>
                    <th className="py-2.5 px-3 text-right">রাজস্ব</th>
                    <th className="py-2.5 px-3 text-right font-bold text-zinc-900">নিট লাভ</th>
                    <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {currentWeekData.dailyTotals.map(({ day }) => {
                    const dayItem = calculateDayBreakdown(books, day);
                    const isBestDay = day === currentWeekData.bestDay.day && dayItem.totalSold > 0;

                    return (
                      <tr key={day} className={`hover:bg-zinc-50 transition-colors ${isBestDay ? 'bg-zinc-100/60' : ''}`}>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 flex items-center gap-1.5">
                          <span>{day} তারিখ</span>
                          {isBestDay && (
                            <span className="text-[9px] bg-zinc-900 text-white px-1.5 py-0.5 rounded font-bold">
                              সপ্তাহের সেরা
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-zinc-800">
                          {dayItem.onlineSold > 0 ? formatNumber(dayItem.onlineSold) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-zinc-800">
                          {dayItem.offlineSold > 0 ? formatNumber(dayItem.offlineSold) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-zinc-900">
                          {dayItem.totalSold > 0 ? `${formatNumber(dayItem.totalSold)} কপি` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-zinc-700">
                          {dayItem.pressReceived > 0 ? formatNumber(dayItem.pressReceived) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-zinc-700">
                          {dayItem.returns > 0 ? formatNumber(dayItem.returns) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-zinc-800">
                          {dayItem.revenue > 0 ? formatBDT(dayItem.revenue) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-zinc-900">
                          {dayItem.profit > 0 ? `+${formatBDT(dayItem.profit)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedDay(day);
                              setPeriod('daily');
                            }}
                            className="text-[11px] text-zinc-800 hover:text-black font-semibold px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded border border-zinc-200"
                          >
                            দৈনিক ভিউ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Week Total Row */}
                  <tr className="bg-zinc-100 font-bold text-zinc-900 border-t-2 border-zinc-300">
                    <td className="py-2.5 px-3">{currentWeekData.name} মোট যোগফল:</td>
                    <td className="py-2.5 px-3 text-center">{formatNumber(currentWeekData.onlineSold)}</td>
                    <td className="py-2.5 px-3 text-center">{formatNumber(currentWeekData.offlineSold)}</td>
                    <td className="py-2.5 px-3 text-center font-black">{formatNumber(currentWeekData.totalSold)} কপি</td>
                    <td className="py-2.5 px-3 text-center">{formatNumber(currentWeekData.pressReceived)}</td>
                    <td className="py-2.5 px-3 text-center">{formatNumber(currentWeekData.returns)}</td>
                    <td className="py-2.5 px-3 text-right">{formatBDT(currentWeekData.revenue)}</td>
                    <td className="py-2.5 px-3 text-right font-black">{formatBDT(currentWeekData.profit)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MONTHLY VIEW (মাসিক ভিউ - ১ থেকে ৩১ তারিখ পর্যন্ত) */}
      {/* ======================================================== */}
      {period === 'monthly' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
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

          {/* Monthly Weekly Progression Comparison */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-base mb-1">
              {formatMonthYearBengali(selectedMonth, selectedYear)} মাসের সপ্তাহের তুলনা
            </h3>
            <p className="text-xs text-zinc-500 mb-4">১ থেকে {formatNumber(daysInMonth)} তারিখের {formatNumber(weekDataList.length)}টি সপ্তাহের সেলস ও লাভের তুলনামূলক অগ্রগতি</p>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
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

    </div>
  );
};
