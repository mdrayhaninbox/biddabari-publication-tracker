import React, { useState } from 'react';
import { 
  Boxes, 
  Warehouse, 
  ShoppingBag, 
  TrendingUp, 
  Wallet, 
  RotateCcw, 
  ArrowUpRight, 
  Globe, 
  Store, 
  Filter
} from 'lucide-react';
import { BookRecord } from '../types/book';
import { calculateBookMetrics, formatBDT, formatNumber } from '../utils/calculations';

interface DashboardProps {
  books: BookRecord[];
  onSelectBookForMatrix: (bookId: string) => void;
  onOpenDailyEntryForBook: (bookId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  books,
  onSelectBookForMatrix,
  onOpenDailyEntryForBook,
}) => {
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');

  const filteredBooks = selectedBookFilter === 'all' 
    ? books 
    : books.filter(b => b.id === selectedBookFilter);

  // Aggregate metrics across filtered books
  const totals = filteredBooks.reduce(
    (acc, b) => {
      const m = calculateBookMetrics(b);
      acc.totalHOStock += m.totalPresentStockHO;
      acc.totalPressStock += m.stockToFaridBhai;
      acc.totalPressOrder += m.totalOrderFaridBhai;
      acc.totalPressReceived += m.faridBhaiToHeadOffice;
      acc.totalOnlineSold += m.totalOnlineSell;
      acc.totalOfflineSold += m.totalOfflineSell;
      acc.totalSold += m.totalSold;
      acc.totalReturns += m.totalReturns;
      acc.totalPromo += m.totalPromo;
      acc.totalRevenue += m.totalRevenue;
      acc.totalProfit += m.totalNetProfit;
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
      totalPressOrder: 0,
      totalPressReceived: 0,
      totalOnlineSold: 0,
      totalOfflineSold: 0,
      totalSold: 0,
      totalReturns: 0,
      totalPromo: 0,
      totalRevenue: 0,
      totalProfit: 0,
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

  // Calculate day-by-day sales (1..31)
  const dailyAggregates: number[] = new Array(31).fill(0);
  filteredBooks.forEach(b => {
    for (let d = 1; d <= 31; d++) {
      const daySales = 
        (b.boibari[d] || 0) +
        (b.rokomari[d] || 0) +
        (b.wafilife[d] || 0) +
        (b.othersOnline[d] || 0) +
        (b.headOfficeSellOffline[d] || 0) +
        (b.nilkhetLibrary[d] || 0) +
        (b.sumonaLibrary[d] || 0) +
        (b.promiseLibrary[d] || 0) +
        (b.joystarLibrary[d] || 0);
      dailyAggregates[d - 1] += daySales;
    }
  });

  const maxDailySales = Math.max(...dailyAggregates, 1);

  return (
    <div className="space-y-6">
      
      {/* Book Filter Dropdown & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">সার্বক্ষণিক সেলস ও স্টক রিপোর্ট</h2>
          <p className="text-xs text-slate-500">বই অনুযায়ী ডাটা ফিল্টার ও বিশ্লেষণ করুন</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBookFilter}
            onChange={(e) => setSelectedBookFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">সবগুলো বই একনজরে ({books.length})</option>
            {books.map(b => (
              <option key={b.id} value={b.id}>
                {b.sl}. {b.bookName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Head Office Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>হেড অফিস স্টক</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{formatNumber(totals.totalHOStock)}</span>
            <span className="text-xs text-slate-500">কপি</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-0.5">
            <span>তাৎক্ষণিক ডেলিভারি প্রস্তুত</span>
          </div>
        </div>

        {/* Farid Bhai Press Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>ফরিদ ভাই (প্রেস) স্টক</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{formatNumber(totals.totalPressStock)}</span>
            <span className="text-xs text-slate-500">কপি</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            মোট অর্ডার: {formatNumber(totals.totalPressOrder)}
          </div>
        </div>

        {/* Total Sold */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>মোট বিক্রয়</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{formatNumber(totals.totalSold)}</span>
            <span className="text-xs text-slate-500">কপি</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            অনলাইন {Math.round((totals.totalOnlineSold / (totals.totalSold || 1)) * 100)}% • অফলাইন {Math.round((totals.totalOfflineSold / (totals.totalSold || 1)) * 100)}%
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>মোট রাজস্ব (Revenue)</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">{formatBDT(totals.totalRevenue)}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            অনলাইন + অফলাইন মোট
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>মোট নিট লাভ (Profit)</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-emerald-700">{formatBDT(totals.totalProfit)}</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">
            খরচ বাদে আনুমানিক লাভ
          </div>
        </div>

        {/* Returns & Promos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>রিটার্ন ও প্রমোশন</span>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-700">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{formatNumber(totals.totalReturns)}</span>
            <span className="text-xs text-slate-500">রিটার্ন / {formatNumber(totals.totalPromo)} প্রমো</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            মার্কেটিং ও গিফট কপি
          </div>
        </div>

      </div>

      {/* Visual Channel Breakdowns (Online vs Offline Channels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Online Channels Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">অনলাইন সেলস চ্যানেল</h3>
                <p className="text-xs text-slate-500">ই-কমার্স প্ল্যাটফর্ম ভিত্তিক বিক্রয় খতিয়ান</p>
              </div>
            </div>
            <span className="text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
              মোট: {formatNumber(totals.totalOnlineSold)} কপি
            </span>
          </div>

          <div className="space-y-3.5">
            {[
              { name: 'বইবাড়ি (Boibari)', count: totals.boibari, color: 'bg-rose-500' },
              { name: 'রকমারি (Rokomari)', count: totals.rokomari, color: 'bg-amber-500' },
              { name: 'ওয়াফিলাইফ (Wafilife)', count: totals.wafilife, color: 'bg-emerald-500' },
              { name: 'অন্যান্য অনলাইন লাইব্রেরি', count: totals.othersOnline, color: 'bg-indigo-500' },
            ].map(channel => {
              const pct = totals.totalOnlineSold > 0 ? (channel.count / totals.totalOnlineSold) * 100 : 0;
              return (
                <div key={channel.name}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{channel.name}</span>
                    <span className="font-semibold">{formatNumber(channel.count)} কপি ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${channel.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Offline & Library Channels Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">অফলাইন ও লাইব্রেরি সেলস</h3>
                <p className="text-xs text-slate-500">হেড অফিস ও ডিলার লাইব্রেরিভিত্তিক সরবরাহ</p>
              </div>
            </div>
            <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              মোট: {formatNumber(totals.totalOfflineSold)} কপি
            </span>
          </div>

          <div className="space-y-3.5">
            {[
              { name: 'সুমনা লাইব্রেরি (Sumona Library)', count: totals.sumona, color: 'bg-purple-600', note: 'প্রেস থেকে সরাসরি' },
              { name: 'প্রমিজ লাইব্রেরি (Promise Library)', count: totals.promise, color: 'bg-blue-600', note: 'প্রেস থেকে সরাসরি' },
              { name: 'জয়স্টার লাইব্রেরি (Joystar Library)', count: totals.joystar, color: 'bg-teal-600', note: 'প্রেস থেকে সরাসরি' },
              { name: 'নীলক্ষেত লাইব্রেরি (Nilkhet)', count: totals.nilkhet, color: 'bg-amber-600', note: 'হেড অফিস সরবরাহ' },
              { name: 'হেড অফিস সরাসরি অফলাইন বিক্রয়', count: totals.hoOffline, color: 'bg-rose-600', note: 'হেড অফিস কাউন্টার' },
            ].map(lib => {
              const pct = totals.totalOfflineSold > 0 ? (lib.count / totals.totalOfflineSold) * 100 : 0;
              return (
                <div key={lib.name}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>
                      {lib.name} <span className="text-[10px] text-slate-400">({lib.note})</span>
                    </span>
                    <span className="font-semibold">{formatNumber(lib.count)} কপি ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${lib.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 31-Day Sales Trend Bar Timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">৩১ দিনের দৈনিক বিক্রয় গতিধারা (Daily Sales Velocity)</h3>
            <p className="text-xs text-slate-500">মাসের প্রতিটি দিনের মোট বিক্রিত কপির হিস্টোগ্রাম</p>
          </div>
          <span className="text-xs text-slate-400">১ম থেকে ৩১তম দিন</span>
        </div>

        <div className="grid grid-cols-31 gap-1 items-end h-32 pt-4 border-b border-slate-100">
          {dailyAggregates.map((sales, idx) => {
            const dayNum = idx + 1;
            const heightPercent = maxDailySales > 0 ? Math.max((sales / maxDailySales) * 100, 4) : 4;
            return (
              <div key={dayNum} className="flex flex-col items-center group relative h-full justify-end">
                {/* Tooltip on hover */}
                <div className="absolute -top-8 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-md">
                  দিন {dayNum}: {sales} কপি
                </div>
                {/* Bar */}
                <div
                  className={`w-full rounded-t-xs transition-all ${
                    sales > 0
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-100'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[9px] text-slate-400 mt-1 font-mono">{dayNum}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Books Summary List with Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">বই ভিত্তিক পারফর্ম্যান্স ও স্টক স্ট্যাটাস</h3>
          <span className="text-xs text-slate-500">{filteredBooks.length} টি বই প্রদর্শিত</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredBooks.map((book) => {
            const m = calculateBookMetrics(book);
            const isLowStock = m.totalPresentStockHO < 300;

            return (
              <div key={book.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Book info */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-sm shrink-0">
                    {book.sl}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      {book.bookName}
                      {isLowStock && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                          লো স্টক
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>মূল্য: <b className="text-slate-700">{formatBDT(m.perBookAmount)}</b></span>
                      <span>উৎপাদন: {formatBDT(m.makingCost)}</span>
                      <span>লাভ/কপি: <b className="text-emerald-700">{formatBDT(m.profitPerBook)}</b></span>
                      {book.remarks && (
                        <span className="text-slate-400 italic">“{book.remarks}”</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock & Sales stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left md:text-right">
                  <div>
                    <div className="text-[11px] text-slate-400">হেড অফিস স্টক</div>
                    <div className="text-sm font-bold text-slate-800">{formatNumber(m.totalPresentStockHO)} কপি</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">প্রেস স্টক</div>
                    <div className="text-sm font-bold text-amber-700">{formatNumber(m.stockToFaridBhai)} কপি</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">মোট বিক্রয়</div>
                    <div className="text-sm font-bold text-blue-700">{formatNumber(m.totalSold)} কপি</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">অর্জিত নিট লাভ</div>
                    <div className="text-sm font-bold text-emerald-700">{formatBDT(m.totalNetProfit)}</div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => onOpenDailyEntryForBook(book.id)}
                    className="text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors border border-rose-200 flex items-center gap-1"
                  >
                    <span>এন্ট্রি দিন</span>
                  </button>
                  <button
                    onClick={() => onSelectBookForMatrix(book.id)}
                    className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 flex items-center gap-1"
                  >
                    <span>৩১ দিন ম্যাট্রিক্স</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
