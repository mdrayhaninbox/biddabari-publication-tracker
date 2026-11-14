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
  Filter,
  PlusCircle,
  Edit2
} from 'lucide-react';
import { BookRecord, ChannelConfig, DEFAULT_CHANNELS } from '../types/book';
import { calculateBookMetrics, getBookChannelSales, sumDaily, formatBDT, formatNumber, formatMonthYearBengali } from '../utils/calculations';
import { Language, tr } from '../utils/i18n';

interface DashboardProps {
  books: BookRecord[];
  onSelectBookForMatrix: (bookId: string) => void;
  onOpenDailyEntryForBook: (bookId: string) => void;
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
  language?: Language;
  channels?: ChannelConfig[];
  onOpenAddChannel?: (defaultType: 'online' | 'offline') => void;
  onOpenEditChannel?: (channel: ChannelConfig) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  books,
  onSelectBookForMatrix,
  onOpenDailyEntryForBook,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
  language = 'en',
  channels = DEFAULT_CHANNELS,
  onOpenAddChannel,
  onOpenEditChannel,
}) => {
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');

  const effectiveChannels = channels && channels.length > 0 ? channels : DEFAULT_CHANNELS;

  const filteredBooks = selectedBookFilter === 'all' 
    ? books 
    : books.filter(b => b.id === selectedBookFilter);

  // Dynamic channel totals map
  const channelTotalsMap: { [channelId: string]: number } = {};
  effectiveChannels.forEach(ch => {
    let count = 0;
    filteredBooks.forEach(b => {
      const map = getBookChannelSales(b, ch.id);
      count += sumDaily(map);
    });
    channelTotalsMap[ch.id] = count;
  });

  // Aggregate metrics across filtered books
  const totals = filteredBooks.reduce(
    (acc, b) => {
      const m = calculateBookMetrics(b, undefined, effectiveChannels);
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
    }
  );

  // Calculate day-by-day sales (1..31 dates) across all channels
  const dailyAggregates: number[] = new Array(daysInMonth).fill(0);
  filteredBooks.forEach(b => {
    for (let d = 1; d <= daysInMonth; d++) {
      let daySales = 0;
      effectiveChannels.forEach(ch => {
        const map = getBookChannelSales(b, ch.id);
        daySales += Number(map[d]) || 0;
      });
      dailyAggregates[d - 1] += daySales;
    }
  });

  const maxDailySales = Math.max(...dailyAggregates, 1);
  const onlineChannelsList = effectiveChannels.filter(c => c.type === 'online');
  const offlineChannelsList = effectiveChannels.filter(c => c.type === 'offline');

  return (
    <div className="space-y-6">
      
      {/* Book Filter Dropdown & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">
            {tr('সার্বিক সেলস ও স্টক ওভারভিউ', 'Overall Sales & Inventory Overview', language)}
          </h2>
          <p className="text-xs text-zinc-500">
            {formatMonthYearBengali(selectedMonth, selectedYear, language)} {tr('এর সামগ্রিক বিক্রয় ও স্টক চিত্র', 'Sales and stock summary', language)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={selectedBookFilter}
            onChange={(e) => setSelectedBookFilter(e.target.value)}
            className="text-xs font-semibold border border-zinc-300 rounded-xl px-3 py-2 bg-white text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
          >
            <option value="all">
              {tr('সবগুলো বই একনজরে', 'All Books at a Glance', language)} ({books.length})
            </option>
            {books.map(b => (
              <option key={b.id} value={b.id}>
                {b.sl}. {b.bookName}{b.edition ? ` [${b.edition}]` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Cards (Black & White Theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        
        {/* Head Office Stock */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] sm:text-xs font-semibold">
            <span>{tr('হেড অফিস স্টক', 'Head Office Stock', language)}</span>
            <div className="p-1.5 sm:p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-zinc-900 font-mono">{formatNumber(totals.totalHOStock, language)}</span>
            <span className="text-[10px] sm:text-xs text-zinc-500">{tr('কপি', 'copies', language)}</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-600 font-medium">
            {tr('তাৎক্ষণিক ডেলিভারি প্রস্তুত', 'Ready for Dispatch', language)}
          </div>
        </div>

        {/* Farid Bhai Press Stock */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] sm:text-xs font-semibold">
            <span>{tr('ফরিদ ভাই (প্রেস) স্টক', 'Press Stock (Farid)', language)}</span>
            <div className="p-1.5 sm:p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <Warehouse className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-zinc-900 font-mono">{formatNumber(totals.totalPressStock, language)}</span>
            <span className="text-[10px] sm:text-xs text-zinc-500">{tr('কপি', 'copies', language)}</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 font-medium font-mono">
            {tr('মোট অর্ডার:', 'Total Orders:', language)} {formatNumber(totals.totalPressOrder, language)}
          </div>
        </div>

        {/* Total Sold */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] sm:text-xs font-semibold">
            <span>{tr('মোট বিক্রয়', 'Total Sold', language)}</span>
            <div className="p-1.5 sm:p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-zinc-900 font-mono">{formatNumber(totals.totalSold, language)}</span>
            <span className="text-[10px] sm:text-xs text-zinc-500">{tr('কপি', 'copies', language)}</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-600 font-medium">
            {tr('অনলাইন', 'Online', language)} {Math.round((totals.totalOnlineSold / (totals.totalSold || 1)) * 100)}% • {tr('অফলাইন', 'Offline', language)} {Math.round((totals.totalOfflineSold / (totals.totalSold || 1)) * 100)}%
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] sm:text-xs font-semibold">
            <span>{tr('মোট রাজস্ব (Revenue)', 'Total Revenue', language)}</span>
            <div className="p-1.5 sm:p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-zinc-900 font-mono">{formatBDT(totals.totalRevenue, language)}</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 font-medium">
            {tr('সর্বমোট বিক্রয়মূল্য', 'Gross Invoiced Value', language)}
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] sm:text-xs font-semibold">
            <span>{tr('মোট নিট লাভ (Profit)', 'Total Net Profit', language)}</span>
            <div className="p-1.5 sm:p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-zinc-900 font-mono">+{formatBDT(totals.totalProfit, language)}</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 font-medium">
            {tr('খরচ বাদে আনুমানিক মুনাফা', 'Net Profit Margin', language)}
          </div>
        </div>

        {/* Returns & Promos */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] sm:text-xs font-semibold">
            <span>{tr('রিটার্ন ও প্রমোশন', 'Returns & Promotion', language)}</span>
            <div className="p-1.5 sm:p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-zinc-900 font-mono">{formatNumber(totals.totalReturns, language)}</span>
            <span className="text-[10px] sm:text-xs text-zinc-500">{tr('রিটার্ন', 'Returns', language)} / {formatNumber(totals.totalPromo, language)} {tr('প্রমো', 'Promo', language)}</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 font-medium">
            {tr('মার্কেটিং ও উপহার কপি', 'Marketing & Promo copies', language)}
          </div>
        </div>

      </div>

      {/* Visual Channel Breakdowns (Black & White Theme + Dynamic Custom Channels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Online Channels Card */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg border border-zinc-200">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">{tr('অনলাইন সেলস চ্যানেল', 'Online Sales Channels', language)}</h3>
                <p className="text-xs text-zinc-500">{tr('ই-কমার্স প্ল্যাটফর্ম ভিত্তিক বিক্রয় খতিয়ান', 'E-commerce platform sales ledger', language)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddChannel && (
                <button
                  type="button"
                  onClick={() => onOpenAddChannel('online')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                  title={tr('নতুন অনলাইন চ্যানেল যুক্ত করুন', 'Add New Online Channel', language)}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{tr('+ নতুন চ্যানেল', '+ Add Channel', language)}</span>
                </button>
              )}
              <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200 font-mono">
                {tr('মোট:', 'Total:', language)} {formatNumber(totals.totalOnlineSold, language)} {tr('কপি', 'cps', language)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {onlineChannelsList.map((ch) => {
              const count = channelTotalsMap[ch.id] || 0;
              const pct = totals.totalOnlineSold > 0 ? (count / totals.totalOnlineSold) * 100 : 0;
              return (
                <div key={ch.id} className="group">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span>{language === 'bn' ? ch.name : (ch.nameEn || ch.name)}</span>
                      {onOpenEditChannel && (
                        <button
                          type="button"
                          onClick={() => onOpenEditChannel(ch)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-600 p-0.5 rounded transition-opacity"
                          title={tr('চ্যানেল সম্পাদনা বা মুছুন', 'Edit or Delete Channel', language)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="font-mono text-zinc-700">
                      {formatNumber(count, language)} {tr('কপি', 'copies', language)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/50">
                    <div
                      className="h-full bg-zinc-800 rounded-full transition-all duration-500"
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
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg border border-zinc-200">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">{tr('অফলাইন ও লাইব্রেরি সেলস', 'Offline & Library Sales', language)}</h3>
                <p className="text-xs text-zinc-500">{tr('হেড অফিস ও ডিলার লাইব্রেরিভিত্তিক সরবরাহ', 'Head Office & library distribution', language)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddChannel && (
                <button
                  type="button"
                  onClick={() => onOpenAddChannel('offline')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                  title={tr('নতুন অফলাইন / লাইব্রেরি চ্যানেল যুক্ত করুন', 'Add New Library Channel', language)}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{tr('+ নতুন লাইব্রেরি / চ্যানেল', '+ Add Library Channel', language)}</span>
                </button>
              )}
              <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200 font-mono">
                {tr('মোট:', 'Total:', language)} {formatNumber(totals.totalOfflineSold, language)} {tr('কপি', 'cps', language)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {offlineChannelsList.map((ch) => {
              const count = channelTotalsMap[ch.id] || 0;
              const pct = totals.totalOfflineSold > 0 ? (count / totals.totalOfflineSold) * 100 : 0;
              const sourceNote = ch.source === 'press' 
                ? tr('প্রেস থেকে সরাসরি', 'Direct from Press', language)
                : tr('হেড অফিস সরবরাহ', 'Dispatched from HO', language);

              return (
                <div key={ch.id} className="group">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span>{language === 'bn' ? ch.name : (ch.nameEn || ch.name)}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        ({sourceNote})
                      </span>
                      {onOpenEditChannel && (
                        <button
                          type="button"
                          onClick={() => onOpenEditChannel(ch)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-600 p-0.5 rounded transition-opacity"
                          title={tr('চ্যানেল সম্পাদনা বা মুছুন', 'Edit or Delete Channel', language)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="font-mono text-zinc-700">
                      {formatNumber(count, language)} {tr('কপি', 'copies', language)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/50">
                    <div
                      className="h-full bg-zinc-700 rounded-full transition-all duration-500"
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
            <h3 className="font-bold text-zinc-900 text-sm">
              {tr(`১লা থেকে ${formatNumber(daysInMonth, language)} তারিখের দৈনিক বিক্রয় গতিধারা`, `Daily Sales Trend (Day 1 to ${formatNumber(daysInMonth, language)})`, language)}
            </h3>
            <p className="text-xs text-zinc-500">
              {formatMonthYearBengali(selectedMonth, selectedYear, language)} {tr('মাসের ক্যালেন্ডার তারিখ অনুযায়ী বিক্রিত কপির হিস্টোগ্রাম', 'Calendar histogram of sold copies', language)}
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
            1 - {formatNumber(daysInMonth, language)} {tr('তারিখ', 'Days', language)}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono sm:hidden">
            👉 {tr('ডানে স্ক্রোল করুন', 'Scroll right', language)}
          </span>
        </div>

        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="grid gap-1 items-end h-32 pt-4 border-b border-zinc-100 min-w-[580px]" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(16px, 1fr))` }}>
            {dailyAggregates.map((sales, idx) => {
              const dateNum = idx + 1;
              const heightPercent = maxDailySales > 0 ? Math.max((sales / maxDailySales) * 100, 4) : 4;
              return (
                <div key={dateNum} className="flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 bg-zinc-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-md">
                    {tr(`তারিখ ${dateNum}: ${sales} কপি`, `Day ${dateNum}: ${sales} copies`, language)}
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
      </div>

      {/* Books Summary List with Quick Actions */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 text-sm">
            {tr('বই ভিত্তিক পারফর্ম্যান্স ও স্টক স্ট্যাটাস', 'Book-wise Performance & Stock Status', language)}
          </h3>
          <span className="text-xs text-zinc-500 font-medium">{filteredBooks.length} {tr('টি বই', 'Books', language)}</span>
        </div>

        <div className="divide-y divide-zinc-100">
          {filteredBooks.map((book) => {
            const m = calculateBookMetrics(book);
            const isLowStock = m.totalPresentStockHO < 300;

            return (
              <div key={book.id} className="p-4 hover:bg-zinc-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Book info */}
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 font-bold flex items-center justify-center text-xs shrink-0 border border-zinc-200">
                    {book.sl}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5 flex-wrap">
                      <span>{book.bookName}</span>
                      {book.edition && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200 shrink-0">
                          {book.edition}
                        </span>
                      )}
                      {book.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                          📚 {book.category}
                        </span>
                      )}
                      {isLowStock && (
                        <span className="text-[10px] bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded font-semibold border border-zinc-300 shrink-0">
                          {tr('লো স্টক', 'Low Stock', language)}
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500 mt-1">
                      <span>{tr('মূল্য:', 'MRP:', language)} <b className="text-zinc-800 font-mono">{formatBDT(m.perBookAmount, language)}</b></span>
                      <span>{tr('উৎপাদন:', 'Cost:', language)} <span className="font-mono">{formatBDT(m.makingCost, language)}</span></span>
                      <span>{tr('কপি প্রতি লাভ:', 'Profit/unit:', language)} <b className="text-zinc-900 font-mono">+{formatBDT(m.profitPerBook, language)}</b></span>
                      {book.publishMonth && (
                        <span className="inline-flex items-center gap-1 text-zinc-600 font-medium bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                          📅 {book.publishMonth}
                        </span>
                      )}
                      {book.remarks && (
                        <span className="text-zinc-400 italic truncate max-w-[150px]">“{book.remarks}”</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock & Sales stats - Perfectly Aligned 4 Fixed Columns */}
                <div className="shrink-0 w-full md:w-[420px] lg:w-[460px] xl:w-[500px] grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-left sm:text-right">
                  <div className="text-left sm:text-right min-w-0">
                    <div className="text-[11px] text-zinc-400 font-medium truncate">{tr('হেড অফিস স্টক', 'HO Stock', language)}</div>
                    <div className="text-sm font-bold text-zinc-900 font-mono truncate">{formatNumber(m.totalPresentStockHO, language)} {tr('কপি', 'copies', language)}</div>
                  </div>
                  <div className="text-left sm:text-right min-w-0">
                    <div className="text-[11px] text-zinc-400 font-medium truncate">{tr('প্রেস স্টক', 'Press Stock', language)}</div>
                    <div className="text-sm font-bold text-zinc-800 font-mono truncate">{formatNumber(m.stockToFaridBhai, language)} {tr('কপি', 'copies', language)}</div>
                  </div>
                  <div className="text-left sm:text-right min-w-0">
                    <div className="text-[11px] text-zinc-400 font-medium truncate">{tr('মোট বিক্রয়', 'Total Sold', language)}</div>
                    <div className="text-sm font-bold text-zinc-900 font-mono truncate">{formatNumber(m.totalSold, language)} {tr('কপি', 'copies', language)}</div>
                  </div>
                  <div className="text-left sm:text-right min-w-0">
                    <div className="text-[11px] text-zinc-400 font-medium truncate">{tr('অর্জিত নিট লাভ', 'Net Profit', language)}</div>
                    <div className="text-sm font-bold text-zinc-900 font-mono truncate">+{formatBDT(m.totalNetProfit, language)}</div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="shrink-0 flex items-center justify-end gap-2 self-start md:self-center">
                  <button
                    onClick={() => onOpenDailyEntryForBook(book.id)}
                    className="text-xs font-semibold text-zinc-800 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors border border-zinc-200 shrink-0"
                  >
                    <span>{tr('এন্ট্রি দিন', 'Quick Entry', language)}</span>
                  </button>
                  <button
                    onClick={() => onSelectBookForMatrix(book.id)}
                    className="text-xs font-semibold text-white bg-zinc-900 hover:bg-black px-3 py-1.5 rounded-lg transition-colors shadow-xs flex items-center gap-1 shrink-0"
                  >
                    <span>{formatNumber(daysInMonth, language)} {tr('দিন ম্যাট্রিক্স', 'Days Matrix', language)}</span>
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
