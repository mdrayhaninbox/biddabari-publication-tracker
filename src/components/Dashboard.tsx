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

  // Calculate day-by-day sales (1..31 dates)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">সার্বিক সেলস ও স্টক ওভারভিউ</h2>
          <p className="text-xs text-zinc-500">বই অনুযায়ী ফিল্টার করে সামগ্রিক চিত্র দেখুন</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={selectedBookFilter}
            onChange={(e) => setSelectedBookFilter(e.target.value)}
            className="text-xs font-semibold border border-zinc-300 rounded-xl px-3 py-2 bg-white text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
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

      {/* Primary KPI Cards (Black & White Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        
        {/* Head Office Stock */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>হেড অফিস স্টক</span>
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-zinc-900">{formatNumber(totals.totalHOStock)}</span>
            <span className="text-xs text-zinc-500">কপি</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-600 font-medium">
            তাৎক্ষণিক ডেলিভারি প্রস্তুত
          </div>
        </div>

        {/* Farid Bhai Press Stock */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>ফরিদ ভাই (প্রেস) স্টক</span>
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-zinc-900">{formatNumber(totals.totalPressStock)}</span>
            <span className="text-xs text-zinc-500">কপি</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 font-medium">
            মোট অর্ডার: {formatNumber(totals.totalPressOrder)}
          </div>
        </div>

        {/* Total Sold */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>মোট বিক্রয়</span>
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-zinc-900">{formatNumber(totals.totalSold)}</span>
            <span className="text-xs text-zinc-500">কপি</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-600 font-medium">
            অনলাইন {Math.round((totals.totalOnlineSold / (totals.totalSold || 1)) * 100)}% • অফলাইন {Math.round((totals.totalOfflineSold / (totals.totalSold || 1)) * 100)}%
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>মোট রাজস্ব (Revenue)</span>
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-zinc-900">{formatBDT(totals.totalRevenue)}</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 font-medium">
            সর্বমোট বিক্রয়মূল্য
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>মোট নিট লাভ (Profit)</span>
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-zinc-900">+{formatBDT(totals.totalProfit)}</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 font-medium">
            খরচ বাদে আনুমানিক মুনাফা
          </div>
        </div>

        {/* Returns & Promos */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>রিটার্ন ও প্রমোশন</span>
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-zinc-900">{formatNumber(totals.totalReturns)}</span>
            <span className="text-xs text-zinc-500">রিটার্ন / {formatNumber(totals.totalPromo)} প্রমো</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 font-medium">
            মার্কেটিং ও উপহার কপি
          </div>
        </div>

      </div>

      {/* Visual Channel Breakdowns (Black & White Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Online Channels Card */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg border border-zinc-200">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">অনলাইন সেলস চ্যানেল</h3>
                <p className="text-xs text-zinc-500">ই-কমার্স প্ল্যাটফর্ম ভিত্তিক বিক্রয় খতিয়ান</p>
              </div>
            </div>
            <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
              মোট: {formatNumber(totals.totalOnlineSold)} কপি
            </span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'বইবাড়ি (Boibari)', count: totals.boibari, bar: 'bg-zinc-900' },
              { name: 'রকমারি (Rokomari)', count: totals.rokomari, bar: 'bg-zinc-700' },
              { name: 'ওয়াফিলাইফ (Wafilife)', count: totals.wafilife, bar: 'bg-zinc-500' },
              { name: 'অন্যান্য অনলাইন লাইব্রেরি', count: totals.othersOnline, bar: 'bg-zinc-400' },
            ].map(channel => {
              const pct = totals.totalOnlineSold > 0 ? (channel.count / totals.totalOnlineSold) * 100 : 0;
              return (
                <div key={channel.name}>
                  <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
                    <span>{channel.name}</span>
                    <span className="font-mono">{formatNumber(channel.count)} কপি ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/50">
                    <div
                      className={`h-full ${channel.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Offline & Library Channels Card */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg border border-zinc-200">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">অফলাইন ও লাইব্রেরি সেলস</h3>
                <p className="text-xs text-zinc-500">হেড অফিস ও ডিলার লাইব্রেরিভিত্তিক সরবরাহ</p>
              </div>
            </div>
            <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
              মোট: {formatNumber(totals.totalOfflineSold)} কপি
            </span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'সুমনা লাইব্রেরি (Sumona Library)', count: totals.sumona, bar: 'bg-zinc-900', note: 'প্রেস থেকে সরাসরি' },
              { name: 'প্রমিজ লাইব্রেরি (Promise Library)', count: totals.promise, bar: 'bg-zinc-700', note: 'প্রেস থেকে সরাসরি' },
              { name: 'জয়স্টার লাইব্রেরি (Joystar Library)', count: totals.joystar, bar: 'bg-zinc-600', note: 'প্রেস থেকে সরাসরি' },
              { name: 'নীলক্ষেত লাইব্রেরি (Nilkhet)', count: totals.nilkhet, bar: 'bg-zinc-500', note: 'হেড অফিস সরবরাহ' },
              { name: 'হেড অফিস সরাসরি অফলাইন বিক্রয়', count: totals.hoOffline, bar: 'bg-zinc-400', note: 'হেড অফিস কাউন্টার' },
            ].map(lib => {
              const pct = totals.totalOfflineSold > 0 ? (lib.count / totals.totalOfflineSold) * 100 : 0;
              return (
                <div key={lib.name}>
                  <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
                    <span>
                      {lib.name} <span className="text-[10px] text-zinc-400 font-normal">({lib.note})</span>
                    </span>
                    <span className="font-mono">{formatNumber(lib.count)} কপি ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/50">
                    <div
                      className={`h-full ${lib.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 31-Day Sales Trend Bar Timeline (Explicit Dates 1 to 31) */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-zinc-900 text-sm">১লা থেকে ৩১শে তারিখের দৈনিক বিক্রয় গতিধারা</h3>
            <p className="text-xs text-zinc-500">মাসের প্রতিটি ক্যালেন্ডার তারিখের বিক্রিত কপির হিস্টোগ্রাম</p>
          </div>
          <span className="text-xs text-zinc-500 font-mono">১ - ৩১ তারিখ</span>
        </div>

        <div className="grid grid-cols-31 gap-1 items-end h-32 pt-4 border-b border-zinc-100">
          {dailyAggregates.map((sales, idx) => {
            const dateNum = idx + 1;
            const heightPercent = maxDailySales > 0 ? Math.max((sales / maxDailySales) * 100, 4) : 4;
            return (
              <div key={dateNum} className="flex flex-col items-center group relative h-full justify-end">
                {/* Tooltip on hover */}
                <div className="absolute -top-8 bg-zinc-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-md">
                  {dateNum} তারিখ: {sales} কপি
                </div>
                {/* Bar */}
                <div
                  className={`w-full rounded-t-xs transition-all ${
                    sales > 0
                      ? 'bg-zinc-900 hover:bg-black'
                      : 'bg-zinc-100'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[9px] text-zinc-400 mt-1 font-mono">{dateNum}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Books Summary List with Quick Actions */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 text-sm">বই ভিত্তিক পারফর্ম্যান্স ও স্টক স্ট্যাটাস</h3>
          <span className="text-xs text-zinc-500 font-medium">{filteredBooks.length} টি বই</span>
        </div>

        <div className="divide-y divide-zinc-100">
          {filteredBooks.map((book) => {
            const m = calculateBookMetrics(book);
            const isLowStock = m.totalPresentStockHO < 300;

            return (
              <div key={book.id} className="p-4 hover:bg-zinc-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Book info */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 font-bold flex items-center justify-center text-xs shrink-0 border border-zinc-200">
                    {book.sl}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                      {book.bookName}
                      {isLowStock && (
                        <span className="text-[10px] bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded font-semibold border border-zinc-300">
                          লো স্টক
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span>মূল্য: <b className="text-zinc-800">{formatBDT(m.perBookAmount)}</b></span>
                      <span>উৎপাদন: {formatBDT(m.makingCost)}</span>
                      <span>কপি প্রতি লাভ: <b className="text-zinc-900">+{formatBDT(m.profitPerBook)}</b></span>
                      {book.remarks && (
                        <span className="text-zinc-400 italic">“{book.remarks}”</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock & Sales stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left md:text-right">
                  <div>
                    <div className="text-[11px] text-zinc-400">হেড অফিস স্টক</div>
                    <div className="text-sm font-bold text-zinc-900 font-mono">{formatNumber(m.totalPresentStockHO)} কপি</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400">প্রেস স্টক</div>
                    <div className="text-sm font-bold text-zinc-800 font-mono">{formatNumber(m.stockToFaridBhai)} কপি</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400">মোট বিক্রয়</div>
                    <div className="text-sm font-bold text-zinc-900 font-mono">{formatNumber(m.totalSold)} কপি</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400">অর্জিত নিট লাভ</div>
                    <div className="text-sm font-bold text-zinc-900 font-mono">+{formatBDT(m.totalNetProfit)}</div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => onOpenDailyEntryForBook(book.id)}
                    className="text-xs font-semibold text-zinc-800 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors border border-zinc-200"
                  >
                    <span>এন্ট্রি দিন</span>
                  </button>
                  <button
                    onClick={() => onSelectBookForMatrix(book.id)}
                    className="text-xs font-semibold text-white bg-zinc-900 hover:bg-black px-3 py-1.5 rounded-lg transition-colors shadow-xs flex items-center gap-1"
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
