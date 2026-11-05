import React, { useState } from 'react';
import { 
  Printer, 
  BookOpen, 
  Download, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BookRecord } from '../types/book';
import { 
  calculateBookMetrics, 
  calculateDayBreakdown, 
  calculateWeekBreakdowns, 
  calculateWeekBookBreakdown,
  formatBDT, 
  formatNumber 
} from '../utils/calculations';
import { exportBooksToExcel } from '../utils/excelHandler';

interface PrintableReportProps {
  books: BookRecord[];
}

export type ReportType = 'daily' | 'weekly' | 'monthly';

export const PrintableReport: React.FC<PrintableReportProps> = ({ books }) => {
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const currentDate = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
  const weekList = calculateWeekBreakdowns(books);
  const currentWeek = weekList.find(w => w.weekNumber === selectedWeek) || weekList[0];
  const weekBooks = calculateWeekBookBreakdown(books, currentWeek.startDay, currentWeek.endDay);

  return (
    <div className="space-y-6">
      
      {/* Print Controls Bar (Hidden during printing) */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
        
        {/* Top Switcher Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              অফিসিয়াল এক্সিকিউটিভ রিপোর্ট ও প্রিন্ট
            </h2>
            <p className="text-xs text-zinc-500">
              দৈনিক, সাপ্তাহিক বা পুরো মাসের পূর্ণাঙ্গ প্রতিবেদন নির্বাচন করে প্রিন্ট বা PDF করুন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded-lg">
              📄 A4 সাইজ ফরম্যাট (প্রয়োজনে স্বয়ংক্রিয় পৃষ্ঠা বৃদ্ধি)
            </span>

            <button
              onClick={() => exportBooksToExcel(books)}
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
          
          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              onClick={() => setReportType('daily')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportType === 'daily'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>দৈনিক রিপোর্ট (Daily)</span>
            </button>

            <button
              onClick={() => setReportType('weekly')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportType === 'weekly'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>সাপ্তাহিক রিপোর্ট (Weekly)</span>
            </button>

            <button
              onClick={() => setReportType('monthly')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportType === 'monthly'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>মাসিক রিপোর্ট (Monthly)</span>
            </button>
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
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      {d} তারিখ ({d}তম দিন)
                    </option>
                  ))}
                </select>
              </div>
              <button
                disabled={selectedDay >= 31}
                onClick={() => setSelectedDay(d => Math.min(31, d + 1))}
                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900">সপ্তাহ নির্বাচন:</span>
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

          {reportType === 'monthly' && (
            <div className="text-xs text-zinc-500 font-medium">
              ১লা থেকে ৩১শে তারিখের সমন্বিত খতিয়ান
            </div>
          )}

        </div>
      </div>

      {/* ======================================================== */}
      {/* Formal Printable Document Body (A4 Paper Standard) */}
      {/* ======================================================== */}
      <div className="print-page-container bg-white p-8 sm:p-12 rounded-2xl border border-zinc-200 shadow-xs max-w-[210mm] w-full mx-auto space-y-6 print:max-w-none print:p-0 print:border-none print:shadow-none print:rounded-none">
        
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
            {reportType === 'daily' && `দৈনিক বিক্রয়, স্টক ও আর্থিক বিবরণী রিপোর্ট • তারিখ: ${selectedDay} তারিখ (মাসের ${selectedDay}তম দিন)`}
            {reportType === 'weekly' && `সাপ্তাহিক বিক্রয় ও অগ্রগতি বিবরণী রিপোর্ট • ${currentWeek.name} (${currentWeek.startDay} থেকে ${currentWeek.endDay} তারিখ)`}
            {reportType === 'monthly' && `মাসিক সার্বিক বুক সেলস, স্টক ইনভেন্টরি ও আর্থিক বিবরণী রিপোর্ট (১ থেকে ৩১ তারিখ)`}
          </div>

          <div className="text-[11px] text-zinc-500 mt-2">
            প্রতিবেদন প্রস্তুতের তারিখ: <b>{currentDate}</b>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: DAILY REPORT BODY */}
        {/* ======================================================== */}
        {reportType === 'daily' && (
          <div className="space-y-6">
            
            {/* Daily KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">{selectedDay} তারিখে বিক্রি</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatNumber(dayData.totalSold)} কপি</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">অনলাইন {dayData.onlineSold} • অফলাইন {dayData.offlineSold}</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">আজকের রাজস্ব</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatBDT(dayData.revenue)}</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">বিক্রয়মূল্য</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">আজকের নিট লাভ</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">+{formatBDT(dayData.profit)}</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">মুনাফা</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">প্রেস থেকে প্রাপ্ত</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatNumber(dayData.pressReceived)} কপি</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">নতুন চালান</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">আজকের রিটার্ন</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatNumber(dayData.returns)} কপি</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">স্টকে যুক্ত</span>
              </div>
            </div>

            {/* Daily Channel Delivery Summary */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50">
              <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1">
                {selectedDay} তারিখের চ্যানেল ভিত্তিক ডেলিভারি চালান
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">বইবাড়ি</span>
                  <span className="font-bold text-zinc-900 font-mono">{dayData.channels.boibari}</span>
                </div>
                <div className="p-2 bg-white rounded border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">রকমারি</span>
                  <span className="font-bold text-zinc-900 font-mono">{dayData.channels.rokomari}</span>
                </div>
                <div className="p-2 bg-white rounded border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">ওয়াফিলাইফ</span>
                  <span className="font-bold text-zinc-900 font-mono">{dayData.channels.wafilife}</span>
                </div>
                <div className="p-2 bg-white rounded border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">অন্যান্য অনলাইন</span>
                  <span className="font-bold text-zinc-900 font-mono">{dayData.channels.othersOnline}</span>
                </div>
                <div className="p-2 bg-white rounded border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">HO কাউন্টার</span>
                  <span className="font-bold text-zinc-900 font-mono">{dayData.channels.headOfficeOffline}</span>
                </div>
                <div className="p-2 bg-white rounded border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">নীলক্ষেত</span>
                  <span className="font-bold text-zinc-900 font-mono">{dayData.channels.nilkhet}</span>
                </div>
                <div className="p-2 bg-white rounded border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">সুমনা</span>
                  <span className="font-bold text-zinc-900 font-mono">{dayData.channels.sumona}</span>
                </div>
                <div className="p-2 bg-white rounded border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">প্রমিজ</span>
                  <span className="font-bold text-zinc-900 font-mono">{dayData.channels.promise}</span>
                </div>
                <div className="p-2 bg-white rounded border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 block">জয়স্টার</span>
                  <span className="font-bold text-zinc-900 font-mono">{dayData.channels.joystar}</span>
                </div>
              </div>
            </div>

            {/* Book-by-Book Table for Selected Date */}
            <div>
              <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1">
                {selectedDay} তারিখে বই ভিত্তিক বিক্রয় ও আয় খতিয়ান
              </h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 border-y border-zinc-300 text-zinc-900 font-bold">
                    <th className="py-2 px-2 text-center w-10">SL</th>
                    <th className="py-2 px-3">বইয়ের নাম</th>
                    <th className="py-2 px-2 text-right">মূল্য (MRP)</th>
                    <th className="py-2 px-2 text-right">লাভ/কপি</th>
                    <th className="py-2 px-2 text-center">প্রেস প্রাপ্তি</th>
                    <th className="py-2 px-2 text-center font-bold">আজকের বিক্রি</th>
                    <th className="py-2 px-2 text-right">আজকের রাজস্ব</th>
                    <th className="py-2 px-2 text-right font-bold text-zinc-900">আজকের লাভ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {books.map(book => {
                    const m = calculateBookMetrics(book);
                    const bDayReceipt = Number(book.pressDailyReceipts?.[selectedDay]) || 0;
                    const bBoibari = Number(book.boibari?.[selectedDay]) || 0;
                    const bRokomari = Number(book.rokomari?.[selectedDay]) || 0;
                    const bWafilife = Number(book.wafilife?.[selectedDay]) || 0;
                    const bOthers = Number(book.othersOnline?.[selectedDay]) || 0;
                    const bHO = Number(book.headOfficeSellOffline?.[selectedDay]) || 0;
                    const bNilkhet = Number(book.nilkhetLibrary?.[selectedDay]) || 0;
                    const bSumona = Number(book.sumonaLibrary?.[selectedDay]) || 0;
                    const bPromise = Number(book.promiseLibrary?.[selectedDay]) || 0;
                    const bJoystar = Number(book.joystarLibrary?.[selectedDay]) || 0;

                    const daySold = bBoibari + bRokomari + bWafilife + bOthers + bHO + bNilkhet + bSumona + bPromise + bJoystar;
                    const dayRev = daySold * m.perBookAmount;
                    const dayProf = daySold * m.profitPerBook;

                    return (
                      <tr key={book.id}>
                        <td className="py-2 px-2 text-center font-mono">{book.sl}</td>
                        <td className="py-2 px-3 font-semibold text-zinc-900">{book.bookName}</td>
                        <td className="py-2 px-2 text-right font-mono">{m.perBookAmount}৳</td>
                        <td className="py-2 px-2 text-right font-bold font-mono">+{m.profitPerBook}৳</td>
                        <td className="py-2 px-2 text-center font-mono">{bDayReceipt > 0 ? bDayReceipt : '-'}</td>
                        <td className="py-2 px-2 text-center font-bold text-zinc-900 font-mono">
                          {daySold > 0 ? `${daySold} কপি` : '-'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">{dayRev > 0 ? formatBDT(dayRev) : '-'}</td>
                        <td className="py-2 px-2 text-right font-bold text-zinc-900 font-mono">
                          {dayProf > 0 ? `+${formatBDT(dayProf)}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals Row */}
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                    <td colSpan={4} className="py-2.5 px-3 text-right">সর্বমোট যোগফল ({selectedDay} তাং):</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(dayData.pressReceived)}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-zinc-900">{formatNumber(dayData.totalSold)} কপি</td>
                    <td className="py-2.5 px-2 text-right font-mono">{formatBDT(dayData.revenue)}</td>
                    <td className="py-2.5 px-2 text-right font-mono">+{formatBDT(dayData.profit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: WEEKLY REPORT BODY */}
        {/* ======================================================== */}
        {reportType === 'weekly' && (
          <div className="space-y-6">
            
            {/* Weekly KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">{currentWeek.name} মোট বিক্রি</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatNumber(currentWeek.totalSold)} কপি</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">অনলাইন {currentWeek.onlineSold} • অফলাইন {currentWeek.offlineSold}</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">সাপ্তাহিক মোট রাজস্ব</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatBDT(currentWeek.revenue)}</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">মোট বিক্রয়মূল্য</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">সাপ্তাহিক নিট লাভ</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">+{formatBDT(currentWeek.profit)}</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">অর্জিত মুনাফা</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">প্রেস থেকে মোট প্রাপ্তি</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatNumber(currentWeek.pressReceived)} কপি</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">রিটার্ন: {currentWeek.returns} কপি</span>
              </div>
            </div>

            {/* Daily Progression Breakdown for the Week */}
            <div>
              <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1">
                {currentWeek.name}-এর দিনভিত্তিক সেলস ও লাভ অগ্রগতি ({currentWeek.startDay} থেকে {currentWeek.endDay} তারিখ)
              </h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 border-y border-zinc-300 text-zinc-900 font-bold">
                    <th className="py-2 px-3">তারিখ</th>
                    <th className="py-2 px-2 text-center">অনলাইন</th>
                    <th className="py-2 px-2 text-center">অফলাইন</th>
                    <th className="py-2 px-2 text-center font-bold">মোট বিক্রি</th>
                    <th className="py-2 px-2 text-center">প্রেস চালান</th>
                    <th className="py-2 px-2 text-center">রিটার্ন</th>
                    <th className="py-2 px-2 text-right">রাজস্ব</th>
                    <th className="py-2 px-2 text-right font-bold text-zinc-900">নিট লাভ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {currentWeek.dailyTotals.map(({ day }) => {
                    const dayItem = calculateDayBreakdown(books, day);
                    return (
                      <tr key={day}>
                        <td className="py-2 px-3 font-semibold text-zinc-900">{day} তারিখ</td>
                        <td className="py-2 px-2 text-center font-mono">{dayItem.onlineSold > 0 ? formatNumber(dayItem.onlineSold) : '-'}</td>
                        <td className="py-2 px-2 text-center font-mono">{dayItem.offlineSold > 0 ? formatNumber(dayItem.offlineSold) : '-'}</td>
                        <td className="py-2 px-2 text-center font-bold text-zinc-900 font-mono">
                          {dayItem.totalSold > 0 ? `${formatNumber(dayItem.totalSold)} কপি` : '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-mono">{dayItem.pressReceived > 0 ? formatNumber(dayItem.pressReceived) : '-'}</td>
                        <td className="py-2 px-2 text-center font-mono">{dayItem.returns > 0 ? formatNumber(dayItem.returns) : '-'}</td>
                        <td className="py-2 px-2 text-right font-mono">{dayItem.revenue > 0 ? formatBDT(dayItem.revenue) : '-'}</td>
                        <td className="py-2 px-2 text-right font-bold text-zinc-900 font-mono">
                          {dayItem.profit > 0 ? `+${formatBDT(dayItem.profit)}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                    <td className="py-2.5 px-3">সাপ্তাহিক যোগফল:</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(currentWeek.onlineSold)}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(currentWeek.offlineSold)}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(currentWeek.totalSold)} কপি</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(currentWeek.pressReceived)}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(currentWeek.returns)}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{formatBDT(currentWeek.revenue)}</td>
                    <td className="py-2.5 px-2 text-right font-mono">+{formatBDT(currentWeek.profit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Book-by-Book Weekly Breakdown */}
            <div>
              <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1">
                {currentWeek.name}-এ বই ভিত্তিক বিক্রয় বিবরণী
              </h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 border-y border-zinc-300 text-zinc-900 font-bold">
                    <th className="py-2 px-2 text-center w-10">SL</th>
                    <th className="py-2 px-3">বইয়ের নাম</th>
                    <th className="py-2 px-2 text-right">MRP</th>
                    <th className="py-2 px-2 text-right">লাভ/কপি</th>
                    <th className="py-2 px-2 text-center">অনলাইন</th>
                    <th className="py-2 px-2 text-center">অফলাইন</th>
                    <th className="py-2 px-2 text-center font-bold">মোট বিক্রি</th>
                    <th className="py-2 px-2 text-right">রাজস্ব</th>
                    <th className="py-2 px-2 text-right font-bold text-zinc-900">নিট লাভ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {weekBooks.map(b => (
                    <tr key={b.bookId}>
                      <td className="py-2 px-2 text-center font-mono">{b.sl}</td>
                      <td className="py-2 px-3 font-semibold text-zinc-900">{b.bookName}</td>
                      <td className="py-2 px-2 text-right font-mono">{b.perBookAmount}৳</td>
                      <td className="py-2 px-2 text-right font-bold font-mono">+{b.profitPerBook}৳</td>
                      <td className="py-2 px-2 text-center font-mono">{b.onlineSold > 0 ? b.onlineSold : '-'}</td>
                      <td className="py-2 px-2 text-center font-mono">{b.offlineSold > 0 ? b.offlineSold : '-'}</td>
                      <td className="py-2 px-2 text-center font-bold text-zinc-900 font-mono">
                        {b.totalSold > 0 ? `${b.totalSold} কপি` : '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">{b.revenue > 0 ? formatBDT(b.revenue) : '-'}</td>
                      <td className="py-2 px-2 text-right font-bold text-zinc-900 font-mono">
                        {b.profit > 0 ? `+${formatBDT(b.profit)}` : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                    <td colSpan={4} className="py-2.5 px-3 text-right">সর্বমোট যোগফল ({currentWeek.name}):</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(currentWeek.onlineSold)}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(currentWeek.offlineSold)}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(currentWeek.totalSold)} কপি</td>
                    <td className="py-2.5 px-2 text-right font-mono">{formatBDT(currentWeek.revenue)}</td>
                    <td className="py-2.5 px-2 text-right font-mono">+{formatBDT(currentWeek.profit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: MONTHLY REPORT BODY (DEFAULT) */}
        {/* ======================================================== */}
        {reportType === 'monthly' && (
          <div className="space-y-6">
            
            {/* Executive Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">মোট হেড অফিস স্টক</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalHOStock)} কপি</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">প্রেস স্টক (Farid Bhai)</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalPressStock)} কপি</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">মোট বিক্রিত কপি</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalSold)} কপি</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[11px] text-zinc-500 block">মোট নিট লাভ</span>
                <span className="text-lg font-bold text-zinc-900 font-mono">+{formatBDT(monthlyTotals.totalProfit)}</span>
              </div>
            </div>

            {/* Full 31-Day Books Table */}
            <div>
              <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1">
                বই ভিত্তিক পূর্ণাঙ্গ হিসাব খতিয়ান (১ থেকে ৩১ তারিখ)
              </h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 border-y border-zinc-300 text-zinc-900 font-bold">
                    <th className="py-2 px-2 text-center w-10">SL</th>
                    <th className="py-2 px-3">বইয়ের নাম</th>
                    <th className="py-2 px-2 text-right">MRP</th>
                    <th className="py-2 px-2 text-right">লাভ/কপি</th>
                    <th className="py-2 px-2 text-center">প্রেস অর্ডার</th>
                    <th className="py-2 px-2 text-center">HO স্টক</th>
                    <th className="py-2 px-2 text-center">প্রেস স্টক</th>
                    <th className="py-2 px-2 text-center">অনলাইন</th>
                    <th className="py-2 px-2 text-center">অফলাইন</th>
                    <th className="py-2 px-2 text-center font-bold">মোট বিক্রি</th>
                    <th className="py-2 px-2 text-right">রাজস্ব</th>
                    <th className="py-2 px-2 text-right font-bold text-zinc-900">নিট লাভ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {books.map(book => {
                    const m = calculateBookMetrics(book);
                    return (
                      <tr key={book.id}>
                        <td className="py-2 px-2 text-center font-mono">{book.sl}</td>
                        <td className="py-2 px-3 font-semibold text-zinc-900">{book.bookName}</td>
                        <td className="py-2 px-2 text-right font-mono">{m.perBookAmount}৳</td>
                        <td className="py-2 px-2 text-right font-bold text-zinc-900 font-mono">+{m.profitPerBook}৳</td>
                        <td className="py-2 px-2 text-center font-mono">{formatNumber(m.totalOrderFaridBhai)}</td>
                        <td className="py-2 px-2 text-center font-bold text-zinc-900 font-mono">{formatNumber(m.totalPresentStockHO)}</td>
                        <td className="py-2 px-2 text-center font-mono text-zinc-700">{formatNumber(m.stockToFaridBhai)}</td>
                        <td className="py-2 px-2 text-center font-mono">{formatNumber(m.totalOnlineSell)}</td>
                        <td className="py-2 px-2 text-center font-mono">{formatNumber(m.totalOfflineSell)}</td>
                        <td className="py-2 px-2 text-center font-bold text-zinc-900 font-mono">{formatNumber(m.totalSold)}</td>
                        <td className="py-2 px-2 text-right font-mono">{formatBDT(m.totalRevenue)}</td>
                        <td className="py-2 px-2 text-right font-bold text-zinc-900 font-mono">+{formatBDT(m.totalNetProfit)}</td>
                      </tr>
                    );
                  })}
                  {/* Totals Row */}
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                    <td colSpan={5} className="py-2.5 px-3 text-right">সর্বমোট যোগফল:</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(monthlyTotals.totalHOStock)}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(monthlyTotals.totalPressStock)}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(monthlyTotals.totalOnlineSold)}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{formatNumber(monthlyTotals.totalOfflineSold)}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-zinc-900">{formatNumber(monthlyTotals.totalSold)}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{formatBDT(monthlyTotals.totalRevenue)}</td>
                    <td className="py-2.5 px-2 text-right font-mono">+{formatBDT(monthlyTotals.totalProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Signatures block (Auto avoid cut across pages) */}
        <div className="signature-block avoid-break pt-12 grid grid-cols-3 gap-6 text-center text-xs text-zinc-600 border-t border-zinc-200">
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
