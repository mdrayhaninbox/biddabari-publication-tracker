import React, { useState, useEffect } from 'react';
import { 
  X, 
  CalendarPlus, 
  Save, 
  Globe, 
  Store, 
  Warehouse, 
  RotateCcw, 
  Gift, 
  CheckCircle2 
} from 'lucide-react';
import { BookRecord, ChannelConfig, DEFAULT_CHANNELS } from '../types/book';
import { calculateBookMetrics, getBookChannelSales, formatBDT, formatNumber, formatMonthYearBengali } from '../utils/calculations';
import { Language, tr } from '../utils/i18n';

interface DailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  initialBookId?: string;
  onSaveDailyEntry: (
    bookId: string,
    day: number,
    data: any
  ) => void;
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
  language?: Language;
  channels?: ChannelConfig[];
}

export const DailyEntryModal: React.FC<DailyEntryModalProps> = ({
  isOpen,
  onClose,
  books,
  initialBookId,
  onSaveDailyEntry,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
  language = 'en',
  channels = DEFAULT_CHANNELS,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || books[0]?.id || '');
  const [day, setDay] = useState<number>(1);

  // Form fields
  const [pressReceipt, setPressReceipt] = useState<number>(0);
  const [boibari, setBoibari] = useState<number>(0);
  const [rokomari, setRokomari] = useState<number>(0);
  const [wafilife, setWafilife] = useState<number>(0);
  const [othersOnline, setOthersOnline] = useState<number>(0);
  const [headOfficeOffline, setHeadOfficeOffline] = useState<number>(0);
  const [nilkhet, setNilkhet] = useState<number>(0);
  const [sumona, setSumona] = useState<number>(0);
  const [promise, setPromise] = useState<number>(0);
  const [joystar, setJoystar] = useState<number>(0);
  const [returns, setReturns] = useState<number>(0);

  // Promo copies (stored at book level)
  const [marketing, setMarketing] = useState<number>(0);
  const [service, setService] = useState<number>(0);
  const [adVideoMaking, setAdVideoMaking] = useState<number>(0);
  const [rd, setRd] = useState<number>(0);
  const [gift, setGift] = useState<number>(0);

  const effectiveChannels = channels && channels.length > 0 ? channels : DEFAULT_CHANNELS;
  const customOnlineChannels = effectiveChannels.filter(c => c.type === 'online' && !['boibari', 'rokomari', 'wafilife', 'othersOnline'].includes(c.id));
  const customOfflineChannels = effectiveChannels.filter(c => c.type === 'offline' && !['headOfficeSellOffline', 'nilkhetLibrary', 'sumonaLibrary', 'promiseLibrary', 'joystarLibrary'].includes(c.id));

  const [customChannelSales, setCustomChannelSales] = useState<{ [channelId: string]: number }>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialBookId) {
      setSelectedBookId(initialBookId);
    }
  }, [initialBookId]);

  useEffect(() => {
    const book = books.find(b => b.id === selectedBookId);
    if (book) {
      setPressReceipt(book.pressDailyReceipts?.[day] || 0);
      setBoibari(book.boibari?.[day] || 0);
      setRokomari(book.rokomari?.[day] || 0);
      setWafilife(book.wafilife?.[day] || 0);
      setOthersOnline(book.othersOnline?.[day] || 0);
      setHeadOfficeOffline(book.headOfficeSellOffline?.[day] || 0);
      setNilkhet(book.nilkhetLibrary?.[day] || 0);
      setSumona(book.sumonaLibrary?.[day] || 0);
      setPromise(book.promiseLibrary?.[day] || 0);
      setJoystar(book.joystarLibrary?.[day] || 0);
      setReturns(book.dailyReturns?.[day] || 0);
      setMarketing(book.marketing || 0);
      setService(book.service || 0);
      setAdVideoMaking(book.adVideoMaking || 0);
      setRd(book.rd || 0);
      setGift(book.gift || 0);

      const customMap: { [channelId: string]: number } = {};
      [...customOnlineChannels, ...customOfflineChannels].forEach(ch => {
        const map = getBookChannelSales(book, ch.id);
        customMap[ch.id] = map[day] || 0;
      });
      setCustomChannelSales(customMap);
    }
    setSavedSuccess(false);
  }, [selectedBookId, day, books, channels]);

  if (!isOpen) return null;

  if (books.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl border border-zinc-200">
          <h3 className="font-bold text-zinc-900 text-sm">{tr('কোনো বই পাওয়া যায়নি', 'No books found', language)}</h3>
          <p className="text-xs text-zinc-500">
            {tr('ডেটা এন্ট্রি করার আগে অনুগ্রহ করে "+ নতুন বই" বাটনে ক্লিক করে বই যুক্ত করুন।', 'Please click "+ New Book" to add a book before entering data.', language)}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
          >
            {tr('বন্ধ করুন', 'Close', language)}
          </button>
        </div>
      </div>
    );
  }

  const currentBook = books.find(b => b.id === selectedBookId);
  const currentMetrics = currentBook ? calculateBookMetrics(currentBook) : null;

  // Day calculations
  const customOnlineSum = customOnlineChannels.reduce((sum, ch) => sum + (customChannelSales[ch.id] || 0), 0);
  const customOfflineSum = customOfflineChannels.reduce((sum, ch) => sum + (customChannelSales[ch.id] || 0), 0);
  const dayOnlineSold = boibari + rokomari + wafilife + othersOnline + customOnlineSum;
  const dayOfflineSold = headOfficeOffline + nilkhet + sumona + promise + joystar + customOfflineSum;
  const dayTotalSold = dayOnlineSold + dayOfflineSold;
  const dayRevenue = dayTotalSold * (currentMetrics?.perBookAmount || 0);
  const dayProfit = dayTotalSold * (currentMetrics?.profitPerBook || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) return;

    onSaveDailyEntry(selectedBookId, day, {
      pressReceipt: Number(pressReceipt) || 0,
      boibari: Number(boibari) || 0,
      rokomari: Number(rokomari) || 0,
      wafilife: Number(wafilife) || 0,
      othersOnline: Number(othersOnline) || 0,
      headOfficeOffline: Number(headOfficeOffline) || 0,
      nilkhet: Number(nilkhet) || 0,
      sumona: Number(sumona) || 0,
      promise: Number(promise) || 0,
      joystar: Number(joystar) || 0,
      returns: Number(returns) || 0,
      marketing: Number(marketing) || 0,
      service: Number(service) || 0,
      adVideoMaking: Number(adVideoMaking) || 0,
      rd: Number(rd) || 0,
      gift: Number(gift) || 0,
      channelSales: {
        boibari,
        rokomari,
        wafilife,
        othersOnline,
        headOfficeSellOffline: headOfficeOffline,
        nilkhetLibrary: nilkhet,
        sumonaLibrary: sumona,
        promiseLibrary: promise,
        joystarLibrary: joystar,
        ...customChannelSales,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-zinc-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header (Black & White) */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {tr('তারিখ ভিত্তিক ডেটা এন্ট্রি ফরম', 'Date-wise Data Entry Form', language)}
              </h3>
              <p className="text-xs text-zinc-400">
                {tr('প্রতিদিনের সেলস, প্রেস চালান ও রিটার্ন লিপিবদ্ধ করুন', 'Record daily sales, press receipts, and returns', language)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            {/* Book & Date Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr('বই নির্বাচন করুন *', 'Select Book *', language)}
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:ring-2 focus:ring-zinc-900"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.sl}. {b.bookName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr(
                    `তারিখ নির্বাচন করুন (১লা থেকে ${formatNumber(daysInMonth, language)} তারিখ • ${formatMonthYearBengali(selectedMonth, selectedYear, language)}) *`,
                    `Select Date (Day 1 to ${formatNumber(daysInMonth, language)} • ${formatMonthYearBengali(selectedMonth, selectedYear, language)}) *`,
                    language
                  )}
                </label>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:ring-2 focus:ring-zinc-900 font-mono"
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      {language === 'bn' ? `${d} তারিখ (${d}তম দিন)` : `Day ${d}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Live Summary of Selected Date */}
            <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-zinc-900">
                {language === 'bn' ? `${day} ${formatMonthYearBengali(selectedMonth, selectedYear, language)} এর হিসাব:` : `Day ${day} Summary:`}
              </span>
              <span className="text-zinc-700">
                {tr('অনলাইন:', 'Online:', language)} <b className="text-zinc-900">{formatNumber(dayOnlineSold, language)}</b> {tr('কপি', 'copies', language)}
              </span>
              <span className="text-zinc-700">
                {tr('অফলাইন:', 'Offline:', language)} <b className="text-zinc-900">{formatNumber(dayOfflineSold, language)}</b> {tr('কপি', 'copies', language)}
              </span>
              <span className="text-zinc-700">
                {tr('মোট বিক্রয়:', 'Total Sold:', language)} <b className="text-zinc-900 font-bold">{formatNumber(dayTotalSold, language)}</b> {tr('কপি', 'copies', language)}
              </span>
              <span className="text-zinc-700">
                {tr('সম্ভাব্য রাজস্ব:', 'Revenue:', language)} <b className="text-zinc-900">{formatBDT(dayRevenue, language)}</b>
              </span>
              <span className="text-zinc-700">
                {tr('প্রাক্কলিত লাভ:', 'Net Profit:', language)} <b className="text-zinc-900 font-bold">+{formatBDT(dayProfit, language)}</b>
              </span>
            </div>

            {/* Section 1: Press Receipt */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-zinc-900 font-bold text-xs">
                <Warehouse className="w-4 h-4 text-zinc-700" />
                <span>{tr('১. ফরিদ ভাই প্রেস থেকে হেড অফিসে চালান গ্রহণ (Press Receipt)', '1. Press Delivery Received to Head Office (Chalan Receipt)', language)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">
                    {tr(`${day} তারিখে প্রাপ্ত মোট বই (Farid Bhai to HO)`, `Books received on Day ${day} (Press to HO)`, language)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pressReceipt || ''}
                    onChange={(e) => setPressReceipt(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                  <span className="text-[11px] text-zinc-400 mt-0.5 block font-mono">
                    {tr('বর্তমান মোট প্রাপ্ত:', 'Total Received so far:', language)} {formatNumber(currentMetrics?.faridBhaiToHeadOffice || 0, language)} {tr('কপি', 'copies', language)}
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-lg text-xs text-zinc-800 border border-zinc-200 flex flex-col justify-center">
                  <span>{tr('প্রেসের মোট অর্ডার:', 'Total Press Orders:', language)} <b>{formatNumber(currentMetrics?.totalOrderFaridBhai || 0, language)}</b> {tr('কপি', 'copies', language)}</span>
                  <span className="mt-0.5">{tr('প্রেসে বর্তমান স্টক:', 'Remaining at Press:', language)} <b>{formatNumber(currentMetrics?.stockToFaridBhai || 0, language)}</b> {tr('কপি', 'copies', language)}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Online Sales */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-zinc-900 font-bold text-xs">
                <Globe className="w-4 h-4 text-zinc-700" />
                <span>{tr(`২. অনলাইন প্ল্যাটফর্মে বিক্রয় (${day} তারিখের অনলাইন সেলস)`, `2. Online Sales (Day ${day})`, language)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">{tr('বইবাড়ি', 'Boibari', language)}</label>
                  <input
                    type="number"
                    min="0"
                    value={boibari || ''}
                    onChange={(e) => setBoibari(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">{tr('রকমারি', 'Rokomari', language)}</label>
                  <input
                    type="number"
                    min="0"
                    value={rokomari || ''}
                    onChange={(e) => setRokomari(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">{tr('ওয়াফিলাইফ', 'Wafilife', language)}</label>
                  <input
                    type="number"
                    min="0"
                    value={wafilife || ''}
                    onChange={(e) => setWafilife(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">{tr('অন্যান্য অনলাইন', 'Others Online', language)}</label>
                  <input
                    type="number"
                    min="0"
                    value={othersOnline || ''}
                    onChange={(e) => setOthersOnline(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
                {customOnlineChannels.map((ch) => (
                  <div key={ch.id}>
                    <label className="block text-xs text-zinc-700 mb-1 font-semibold truncate" title={ch.name}>
                      {language === 'bn' ? ch.name : (ch.nameEn || ch.name)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customChannelSales[ch.id] || ''}
                      onChange={(e) => setCustomChannelSales(prev => ({ ...prev, [ch.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      placeholder="0"
                      className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Offline & Libraries */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-zinc-900 font-bold text-xs">
                <Store className="w-4 h-4 text-zinc-700" />
                <span>{tr(`৩. অফলাইন ও লাইব্রেরি বিক্রয় (${day} তারিখের অফলাইন সেলস)`, `3. Offline & Library Sales (Day ${day})`, language)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">{tr('হেড অফিস সেল', 'Head Office', language)}</label>
                  <input
                    type="number"
                    min="0"
                    value={headOfficeOffline || ''}
                    onChange={(e) => setHeadOfficeOffline(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">{tr('নীলক্ষেত লাইব্রেরি', 'Nilkhet', language)}</label>
                  <input
                    type="number"
                    min="0"
                    value={nilkhet || ''}
                    onChange={(e) => setNilkhet(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">{tr('সুমনা (প্রেস)', 'Sumona', language)}</label>
                  <input
                    type="number"
                    min="0"
                    value={sumona || ''}
                    onChange={(e) => setSumona(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">{tr('প্রমিজ (প্রেস)', 'Promise', language)}</label>
                  <input
                    type="number"
                    min="0"
                    value={promise || ''}
                    onChange={(e) => setPromise(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">{tr('জয়স্টার (প্রেস)', 'Joystar', language)}</label>
                  <input
                    type="number"
                    min="0"
                    value={joystar || ''}
                    onChange={(e) => setJoystar(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
                {customOfflineChannels.map((ch) => (
                  <div key={ch.id}>
                    <label className="block text-xs text-zinc-700 mb-1 font-semibold truncate" title={ch.name}>
                      {language === 'bn' ? ch.name : (ch.nameEn || ch.name)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customChannelSales[ch.id] || ''}
                      onChange={(e) => setCustomChannelSales(prev => ({ ...prev, [ch.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      placeholder="0"
                      className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Returns & Departmental copies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Daily Returns */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-2 text-zinc-900 font-bold text-xs">
                  <RotateCcw className="w-4 h-4 text-zinc-700" />
                  <span>{tr(`৪. দৈনিক রিটার্ন (${day} তারিখে ফেরত আসা বই)`, `4. Daily Returns (Day ${day})`, language)}</span>
                </div>
                <label className="block text-xs text-zinc-600 mb-1">
                  {tr('হেড অফিসে ফেরত আসা বই (স্টকে যুক্ত হবে)', 'Books returned to Head Office (Added to stock)', language)}
                </label>
                <input
                  type="number"
                  min="0"
                  value={returns || ''}
                  onChange={(e) => setReturns(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>

              {/* Promotional / Dept */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-2 text-zinc-900 font-bold text-xs">
                  <Gift className="w-4 h-4 text-zinc-700" />
                  <span>{tr('৫. প্রমোশন ও ডিপার্টমেন্ট কপি', '5. Promo & Dept Copies', language)}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">{tr('মার্কেটিং', 'Mkt', language)}</label>
                    <input
                      type="number"
                      min="0"
                      value={marketing || ''}
                      onChange={(e) => setMarketing(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-bold border border-zinc-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">{tr('সার্ভিস', 'Service', language)}</label>
                    <input
                      type="number"
                      min="0"
                      value={service || ''}
                      onChange={(e) => setService(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-bold border border-zinc-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">{tr('ভিডিও', 'Video', language)}</label>
                    <input
                      type="number"
                      min="0"
                      value={adVideoMaking || ''}
                      onChange={(e) => setAdVideoMaking(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-bold border border-zinc-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">R&D</label>
                    <input
                      type="number"
                      min="0"
                      value={rd || ''}
                      onChange={(e) => setRd(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-bold border border-zinc-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">{tr('উপহার', 'Gift', language)}</label>
                    <input
                      type="number"
                      min="0"
                      value={gift || ''}
                      onChange={(e) => setGift(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-bold border border-zinc-300 rounded p-1.5 font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Modal Footer */}
          <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-4 flex items-center justify-between">
            {savedSuccess ? (
              <div className="flex items-center gap-1.5 text-xs text-zinc-900 font-bold animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>{tr(`সফলভাবে ${day} তারিখের ডাটা সংরক্ষিত হয়েছে!`, `Successfully saved data for Day ${day}!`, language)}</span>
              </div>
            ) : (
              <span className="text-xs text-zinc-500">
                {tr('সংরক্ষণ করলে তাৎক্ষণিক স্টক ও হিসাব আপডেট হবে', 'Saving will immediately update stock and metrics', language)}
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                {tr('বাতিল', 'Cancel', language)}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{tr('সংরক্ষণ করুন', 'Save', language)}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
