import React from 'react';
import { Printer, BookOpen, Download } from 'lucide-react';
import { BookRecord } from '../types/book';
import { calculateBookMetrics, formatBDT, formatNumber } from '../utils/calculations';
import { exportBooksToExcel } from '../utils/excelHandler';

interface PrintableReportProps {
  books: BookRecord[];
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ books }) => {
  const currentDate = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totals = books.reduce(
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

  return (
    <div className="space-y-6">
      
      {/* Print & Action Bar (Hidden during printing) */}
      <div className="print:hidden flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">অফিসিয়াল এক্সিকিউটিভ রিপোর্ট</h2>
          <p className="text-xs text-slate-500">প্রিন্ট বা PDF হিসেবে সংরক্ষণ করার উপযোগী ফরম্যাট</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBooksToExcel(books)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
          >
            <Download className="w-4 h-4" />
            <span>এক্সেল ফাইল</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / PDF করুন</span>
          </button>
        </div>
      </div>

      {/* The Printable Page Layout */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 max-w-5xl mx-auto space-y-6">
        
        {/* Publication Header */}
        <div className="border-b-2 border-slate-900 pb-5 text-center relative">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-900 flex items-center justify-center text-white">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">বিদ্যাবাড়ি পাবলিকেশন</h1>
          <p className="text-xs text-slate-600 mt-0.5">প্রধান কার্যালয়, ঢাকা, বাংলাদেশ • বুক পাবলিকেশন অ্যান্ড ডিস্ট্রিবিউশন ডিপার্টমেন্ট</p>
          <div className="inline-block mt-2 bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-full font-bold">
            বুক সেলস, স্টক ইনভেন্টরি ও আর্থিক বিবরণী রিপোর্ট
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            প্রতিবেদন প্রস্তুতের তারিখ: <b>{currentDate}</b>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] text-slate-500 block">মোট হেড অফিস স্টক</span>
            <span className="text-lg font-bold text-slate-900">{formatNumber(totals.totalHOStock)} কপি</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] text-slate-500 block">প্রেস স্টক (Farid Bhai)</span>
            <span className="text-lg font-bold text-amber-800">{formatNumber(totals.totalPressStock)} কপি</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] text-slate-500 block">মোট বিক্রিত কপি</span>
            <span className="text-lg font-bold text-blue-800">{formatNumber(totals.totalSold)} কপি</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] text-slate-500 block">মোট নিট লাভ</span>
            <span className="text-lg font-bold text-emerald-800">{formatBDT(totals.totalProfit)}</span>
          </div>
        </div>

        {/* Books Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">
            বই ভিত্তিক পূর্ণাঙ্গ হিসাব খতিয়ান
          </h3>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 text-slate-800 font-bold">
                <th className="py-2 px-2 text-center">SL</th>
                <th className="py-2 px-3">বইয়ের নাম</th>
                <th className="py-2 px-2 text-right">MRP</th>
                <th className="py-2 px-2 text-right">লাভ/কপি</th>
                <th className="py-2 px-2 text-center">প্রেস অর্ডার</th>
                <th className="py-2 px-2 text-center">HO স্টক</th>
                <th className="py-2 px-2 text-center">প্রেস স্টক</th>
                <th className="py-2 px-2 text-center">অনলাইন</th>
                <th className="py-2 px-2 text-center">অফলাইন</th>
                <th className="py-2 px-2 text-center">মোট বিক্রি</th>
                <th className="py-2 px-2 text-right">রাজস্ব</th>
                <th className="py-2 px-2 text-right">নিট লাভ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {books.map(book => {
                const m = calculateBookMetrics(book);
                return (
                  <tr key={book.id}>
                    <td className="py-2 px-2 text-center font-mono">{book.sl}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{book.bookName}</td>
                    <td className="py-2 px-2 text-right">{m.perBookAmount}৳</td>
                    <td className="py-2 px-2 text-right text-emerald-700 font-semibold">+{m.profitPerBook}৳</td>
                    <td className="py-2 px-2 text-center">{formatNumber(m.totalOrderFaridBhai)}</td>
                    <td className="py-2 px-2 text-center font-bold">{formatNumber(m.totalPresentStockHO)}</td>
                    <td className="py-2 px-2 text-center text-amber-800">{formatNumber(m.stockToFaridBhai)}</td>
                    <td className="py-2 px-2 text-center">{formatNumber(m.totalOnlineSell)}</td>
                    <td className="py-2 px-2 text-center">{formatNumber(m.totalOfflineSell)}</td>
                    <td className="py-2 px-2 text-center font-bold text-blue-800">{formatNumber(m.totalSold)}</td>
                    <td className="py-2 px-2 text-right">{formatBDT(m.totalRevenue)}</td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-800">{formatBDT(m.totalNetProfit)}</td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-slate-900">
                <td colSpan={5} className="py-2.5 px-3 text-right">সর্বমোট যোগফল:</td>
                <td className="py-2.5 px-2 text-center">{formatNumber(totals.totalHOStock)}</td>
                <td className="py-2.5 px-2 text-center">{formatNumber(totals.totalPressStock)}</td>
                <td className="py-2.5 px-2 text-center">{formatNumber(totals.totalOnlineSold)}</td>
                <td className="py-2.5 px-2 text-center">{formatNumber(totals.totalOfflineSold)}</td>
                <td className="py-2.5 px-2 text-center text-blue-900">{formatNumber(totals.totalSold)}</td>
                <td className="py-2.5 px-2 text-right">{formatBDT(totals.totalRevenue)}</td>
                <td className="py-2.5 px-2 text-right text-emerald-900">{formatBDT(totals.totalProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures block */}
        <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs text-slate-600 border-t border-slate-200">
          <div>
            <div className="border-t border-slate-400 w-36 mx-auto pt-1 mb-1"></div>
            <span className="font-semibold block">ইনভেন্টরি অফিসার</span>
            <span className="text-[10px] text-slate-400">ওয়্যারহাউজ ও স্টক বিভাগ</span>
          </div>

          <div>
            <div className="border-t border-slate-400 w-36 mx-auto pt-1 mb-1"></div>
            <span className="font-semibold block">হিসাবরক্ষণ কর্মকর্তা</span>
            <span className="text-[10px] text-slate-400">অ্যাকাউন্টিং অ্যান্ড ফিন্যান্স</span>
          </div>

          <div>
            <div className="border-t border-slate-400 w-36 mx-auto pt-1 mb-1"></div>
            <span className="font-semibold block">প্রকাশনা পরিচালক</span>
            <span className="text-[10px] text-slate-400">বিদ্যাবাড়ি পাবলিকেশন</span>
          </div>
        </div>

      </div>

    </div>
  );
};
