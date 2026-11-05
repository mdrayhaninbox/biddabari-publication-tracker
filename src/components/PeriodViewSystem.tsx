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
  ChevronRight
} from 'lucide-react';
import { BookRecord } from '../types/book';
import { 
  calculateDayBreakdown, 
  calculateWeekBreakdowns, 
  calculateBookMetrics, 
  formatBDT, 
  formatNumber 
} from '../utils/calculations';

interface PeriodViewSystemProps {
  books: BookRecord[];
  onOpenDailyEntryForDay: (day: number) => void;
  onOpenDailyEntryForBookAndDay: (bookId: string, day: number) => void;
}

export type ViewPeriod = 'daily' | 'weekly' | 'monthly';

export const PeriodViewSystem: React.FC<PeriodViewSystemProps> = ({
  books,
  onOpenDailyEntryForDay,
  onOpenDailyEntryForBookAndDay,
}) => {
  const [period, setPeriod] = useState<ViewPeriod>('daily');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Day breakdown
  const dayData = calculateDayBreakdown(books, selectedDay);

  // Week breakdowns
  const weekDataList = calculateWeekBreakdowns(books);
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
      
      {/* View Period Selector Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>পিরিয়ড ভিত্তিক ডাটা ভিউ (Data View System)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            দৈনিক, সাপ্তাহিক ও মাসিক ভিত্তিতে সেলস, আয় ও প্রেস হিসেব বিশ্লেষণ করুন
          </p>
        </div>

        {/* 3-Way Pill Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setPeriod('daily')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              period === 'daily'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>📅 দৈনিক ভিউ (Daily)</span>
          </button>

          <button
            onClick={() => setPeriod('weekly')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              period === 'weekly'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>📆 সাপ্তাহিক ভিউ (Weekly)</span>
          </button>

          <button
            onClick={() => setPeriod('monthly')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              period === 'monthly'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>🗓️ মাসিক ভিউ (Monthly)</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY VIEW (দৈনিক ভিউ) */}
      {/* ======================================================== */}
      {period === 'daily' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Day Navigation & Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  disabled={selectedDay <= 1}
                  onClick={() => setSelectedDay(d => Math.max(1, d - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-800 text-sm">
                  দিন {selectedDay} ({selectedDay} তারিখের সার্বিক প্রতিবেদন)
                </span>
                <button
                  disabled={selectedDay >= 31}
                  onClick={() => setSelectedDay(d => Math.min(31, d + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onOpenDailyEntryForDay(selectedDay)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>দিন {selectedDay}-এর এন্ট্রি দিন</span>
              </button>
            </div>

            {/* Quick 31 Day Buttons Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const daySales = calculateDayBreakdown(books, day).totalSold;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex flex-col items-center justify-center min-w-[44px] py-1.5 px-1 rounded-xl text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-rose-700 text-white font-bold shadow-xs scale-105'
                        : daySales > 0
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[11px] font-bold">দিন {day}</span>
                    <span className="text-[9px] opacity-80">{daySales > 0 ? `${daySales}টি` : '০'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 block">দিন {selectedDay}-এ বিক্রি</span>
              <span className="text-xl font-bold text-slate-900">{formatNumber(dayData.totalSold)} কপি</span>
              <span className="text-[10px] text-blue-600 block mt-0.5 font-medium">
                অনলাইন {dayData.onlineSold} • অফলাইন {dayData.offlineSold}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 block">দিন {selectedDay}-এ রাজস্ব</span>
              <span className="text-lg font-bold text-slate-900">{formatBDT(dayData.revenue)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">অর্জিত মোট আয়</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 block">দিন {selectedDay}-এ নিট লাভ</span>
              <span className="text-lg font-bold text-emerald-700">+{formatBDT(dayData.profit)}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">খরচ বাদে লাভ</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 block">প্রেস থেকে প্রাপ্ত চালান</span>
              <span className="text-xl font-bold text-amber-800">{formatNumber(dayData.pressReceived)} কপি</span>
              <span className="text-[10px] text-amber-700 block mt-0.5">হেড অফিসে এসেছে</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 block">আজকের ফেরত (Return)</span>
              <span className="text-xl font-bold text-rose-700">{formatNumber(dayData.returns)} কপি</span>
              <span className="text-[10px] text-rose-600 block mt-0.5">স্টকে পুনরায় যুক্ত</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
              <button
                onClick={() => onOpenDailyEntryForDay(selectedDay)}
                className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>এন্ট্রি সম্পাদন</span>
              </button>
            </div>
          </div>

          {/* Selected Day Channel Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Online Channels on this day */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Globe className="w-4 h-4 text-sky-600" />
                <span>দিন {selectedDay}: অনলাইন চ্যানেল সেলস (মোট {dayData.onlineSold} কপি)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <span className="text-[10px] text-sky-800 block">বইবাড়ি</span>
                  <span className="text-sm font-bold text-slate-900">{dayData.channels.boibari}</span>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <span className="text-[10px] text-amber-800 block">রকমারি</span>
                  <span className="text-sm font-bold text-slate-900">{dayData.channels.rokomari}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <span className="text-[10px] text-emerald-800 block">ওয়াফিলাইফ</span>
                  <span className="text-sm font-bold text-slate-900">{dayData.channels.wafilife}</span>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <span className="text-[10px] text-indigo-800 block">অন্যান্য অনলাইন</span>
                  <span className="text-sm font-bold text-slate-900">{dayData.channels.othersOnline}</span>
                </div>
              </div>
            </div>

            {/* Offline Channels on this day */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Store className="w-4 h-4 text-purple-600" />
                <span>দিন {selectedDay}: অফলাইন ও লাইব্রেরি সেলস (মোট {dayData.offlineSold} কপি)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <span className="text-[10px] text-purple-800 block">হেড অফিস</span>
                  <span className="text-sm font-bold text-slate-900">{dayData.channels.headOfficeOffline}</span>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <span className="text-[10px] text-purple-800 block">নীলক্ষেত</span>
                  <span className="text-sm font-bold text-slate-900">{dayData.channels.nilkhet}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <span className="text-[10px] text-blue-800 block">সুমনা</span>
                  <span className="text-sm font-bold text-slate-900">{dayData.channels.sumona}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <span className="text-[10px] text-blue-800 block">প্রমিজ</span>
                  <span className="text-sm font-bold text-slate-900">{dayData.channels.promise}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <span className="text-[10px] text-blue-800 block">জয়স্টার</span>
                  <span className="text-sm font-bold text-slate-900">{dayData.channels.joystar}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Book-by-Book breakdown for selected day */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">
                দিন {selectedDay}-এ বই ভিত্তিক বিক্রয় খতিয়ান
              </h4>
              <span className="text-[11px] text-slate-500">বই সংখ্যা: {dayData.bookBreakdown.length}</span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">বইয়ের নাম</th>
                  <th className="py-2.5 px-3 text-center">আজকের বিক্রি</th>
                  <th className="py-2.5 px-3 text-right">আজকের রাজস্ব</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">আজকের লাভ</th>
                  <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayData.bookBreakdown.map((item, idx) => (
                  <tr key={item.bookId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {idx + 1}. {item.bookName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                      {item.sold > 0 ? `${formatNumber(item.sold)} কপি` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                      {item.revenue > 0 ? formatBDT(item.revenue) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {item.profit > 0 ? `+${formatBDT(item.profit)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onOpenDailyEntryForBookAndDay(item.bookId, selectedDay)}
                        className="text-[11px] text-rose-700 hover:text-rose-900 font-medium px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded"
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
      )}

      {/* ======================================================== */}
      {/* 2. WEEKLY VIEW (সাপ্তাহিক ভিউ) */}
      {/* ======================================================== */}
      {period === 'weekly' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Week Selector Cards Grid (Weeks 1 to 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {weekDataList.map(w => {
              const isSelected = selectedWeek === w.weekNumber;
              return (
                <div
                  key={w.weekNumber}
                  onClick={() => setSelectedWeek(w.weekNumber)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className={isSelected ? 'text-rose-900 font-bold' : 'text-slate-800'}>
                      {w.name}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-700" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">মোট বিক্রি:</span>
                      <span className="font-bold text-slate-900">{formatNumber(w.totalSold)} কপি</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">রাজস্ব:</span>
                      <span className="font-semibold text-slate-800">{formatBDT(w.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">নিট লাভ:</span>
                      <span className="font-bold text-emerald-700">+{formatBDT(w.profit)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                      <span>সর্বোচ্চ বিক্রি:</span>
                      <span className="font-medium text-rose-700">দিন {w.bestDay.day} ({w.bestDay.sold}টি)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Week Detailed Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {currentWeekData.name} - এর বিস্তারিত দৈনিক অগ্রগতি
                </h3>
                <p className="text-xs text-slate-500">
                  দিন {currentWeekData.startDay} থেকে দিন {currentWeekData.endDay} পর্যন্ত প্রতিদিনের ফলাফল
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                সাপ্তাহিক নিট লাভ: {formatBDT(currentWeekData.profit)}
              </span>
            </div>

            {/* Daily breakdown table for the week */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">তারিখ / দিন</th>
                    <th className="py-2.5 px-3 text-center">অনলাইন বিক্রি</th>
                    <th className="py-2.5 px-3 text-center">অফলাইন বিক্রি</th>
                    <th className="py-2.5 px-3 text-center font-bold">মোট বিক্রি</th>
                    <th className="py-2.5 px-3 text-center">প্রেস চালান</th>
                    <th className="py-2.5 px-3 text-center">রিটার্ন</th>
                    <th className="py-2.5 px-3 text-right">রাজস্ব</th>
                    <th className="py-2.5 px-3 text-right font-bold text-emerald-800">নিট লাভ</th>
                    <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentWeekData.dailyTotals.map(({ day }) => {
                    const dayItem = calculateDayBreakdown(books, day);
                    const isBestDay = day === currentWeekData.bestDay.day && dayItem.totalSold > 0;

                    return (
                      <tr key={day} className={`hover:bg-slate-50 ${isBestDay ? 'bg-amber-50/50' : ''}`}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>দিন {day}</span>
                          {isBestDay && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                              সপ্তাহের সেরা
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-sky-700 font-medium">
                          {dayItem.onlineSold > 0 ? formatNumber(dayItem.onlineSold) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-purple-700 font-medium">
                          {dayItem.offlineSold > 0 ? formatNumber(dayItem.offlineSold) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                          {dayItem.totalSold > 0 ? `${formatNumber(dayItem.totalSold)} কপি` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-amber-800 font-medium">
                          {dayItem.pressReceived > 0 ? formatNumber(dayItem.pressReceived) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-rose-700 font-medium">
                          {dayItem.returns > 0 ? formatNumber(dayItem.returns) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                          {dayItem.revenue > 0 ? formatBDT(dayItem.revenue) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {dayItem.profit > 0 ? `+${formatBDT(dayItem.profit)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedDay(day);
                              setPeriod('daily');
                            }}
                            className="text-[11px] text-slate-600 hover:text-slate-900 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded"
                          >
                            দৈনিক ভিউ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Week Total Row */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="py-2.5 px-3">{currentWeekData.name} মোট যোগফল:</td>
                    <td className="py-2.5 px-3 text-center text-sky-800">{formatNumber(currentWeekData.onlineSold)}</td>
                    <td className="py-2.5 px-3 text-center text-purple-800">{formatNumber(currentWeekData.offlineSold)}</td>
                    <td className="py-2.5 px-3 text-center text-blue-800 font-black">{formatNumber(currentWeekData.totalSold)} কপি</td>
                    <td className="py-2.5 px-3 text-center text-amber-800">{formatNumber(currentWeekData.pressReceived)}</td>
                    <td className="py-2.5 px-3 text-center text-rose-800">{formatNumber(currentWeekData.returns)}</td>
                    <td className="py-2.5 px-3 text-right">{formatBDT(currentWeekData.revenue)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-800 font-black">{formatBDT(currentWeekData.profit)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MONTHLY VIEW (মাসিক ভিউ) */}
      {/* ======================================================== */}
      {period === 'monthly' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Monthly KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">মাসিক সর্বমোট বিক্রয়</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {formatNumber(monthTotals.totalSold)} কপি
              </span>
              <div className="mt-2 text-xs text-blue-700 font-medium">
                অনলাইন {formatNumber(monthTotals.onlineSold)} • অফলাইন {formatNumber(monthTotals.offlineSold)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">মাসিক সর্বমোট রাজস্ব</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {formatBDT(monthTotals.revenue)}
              </span>
              <div className="mt-2 text-xs text-slate-500 font-medium">
                অনলাইন ও অফলাইন সম্মিলিত আয়
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">মাসিক সর্বমোট নিট লাভ</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                +{formatBDT(monthTotals.profit)}
              </span>
              <div className="mt-2 text-xs text-emerald-600 font-medium">
                প্রডাকশন ও বিজ্ঞাপন বাদে আয়
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">মাস শেষে হেড অফিস স্টক</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">
                {formatNumber(monthTotals.hoStock)} কপি
              </span>
              <div className="mt-2 text-xs text-amber-700 font-medium">
                ফরিদ ভাই প্রেসে স্টক: {formatNumber(monthTotals.pressStock)} কপি
              </div>
            </div>
          </div>

          {/* Monthly Weekly Progression Comparison */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 text-base mb-1">
              মাসিক সপ্তাহের তুলনা (Week 1 vs 2 vs 3 vs 4 vs 5)
            </h3>
            <p className="text-xs text-slate-500 mb-4">প্রতি সপ্তাহের সেলস ও লাভের তুলনামূলক অগ্রগতি</p>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {weekDataList.map((w, i) => {
                const maxSold = Math.max(...weekDataList.map(x => x.totalSold), 1);
                const heightPct = Math.max((w.totalSold / maxSold) * 100, 6);

                return (
                  <div key={w.weekNumber} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">সপ্তাহ {w.weekNumber}</span>
                      <span className="text-[10px] text-slate-400 block mb-2">দিন {w.startDay}-{w.endDay}</span>
                    </div>

                    <div className="h-20 flex items-end justify-center py-2">
                      <div
                        className="w-12 bg-rose-700 rounded-t-lg transition-all flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ height: `${heightPct}%` }}
                      >
                        {w.totalSold > 0 ? w.totalSold : ''}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-center">
                      <span className="text-xs font-bold text-emerald-700 block">+{formatBDT(w.profit)}</span>
                      <span className="text-[10px] text-slate-500">নিট লাভ</span>
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
