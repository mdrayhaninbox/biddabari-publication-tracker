import React, { useState, useEffect } from 'react';
import { 
  CalendarPlus, 
  Save, 
  CheckCircle2, 
  Layers, 
  TableProperties, 
  Globe, 
  Store, 
  Warehouse, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { BookRecord } from '../types/book';
import { calculateBookMetrics, formatBDT, formatNumber, formatMonthYearBengali } from '../utils/calculations';

interface QuickDataEntryProps {
  books: BookRecord[];
  initialBookId?: string;
  initialDay?: number;
  onSaveDailyEntry: (
    bookId: string,
    day: number,
    data: {
      pressReceipt: number;
      boibari: number;
      rokomari: number;
      wafilife: number;
      othersOnline: number;
      headOfficeOffline: number;
      nilkhet: number;
      sumona: number;
      promise: number;
      joystar: number;
      returns: number;
      marketing: number;
      service: number;
      adVideoMaking: number;
      rd: number;
      gift: number;
    }
  ) => void;
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
}

export const QuickDataEntry: React.FC<QuickDataEntryProps> = ({
  books,
  initialBookId,
  initialDay = 1,
  onSaveDailyEntry,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
}) => {
  const [entryMode, setEntryMode] = useState<'single' | 'sheet'>('single');

  // Single Book Mode State
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || books[0]?.id || '');
  const [day, setDay] = useState<number>(initialDay);

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

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sheet Mode State (holding editable rows for all books for selected day)
  const [sheetDay, setSheetDay] = useState<number>(initialDay);
  const [sheetValues, setSheetValues] = useState<{
    [bookId: string]: {
      pressReceipt: number;
      boibari: number;
      rokomari: number;
      wafilife: number;
      othersOnline: number;
      headOfficeOffline: number;
      nilkhet: number;
      sumona: number;
      promise: number;
      joystar: number;
      returns: number;
    };
  }>({});

  // Sync single form with book/day selection
  useEffect(() => {
    const book = books.find(b => b.id === selectedBookId) || books[0];
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
    }
    setSaveSuccess(false);
  }, [selectedBookId, day, books]);

  // Sync sheet mode values when sheetDay changes
  useEffect(() => {
    const initialMap: typeof sheetValues = {};
    books.forEach(b => {
      initialMap[b.id] = {
        pressReceipt: b.pressDailyReceipts?.[sheetDay] || 0,
        boibari: b.boibari?.[sheetDay] || 0,
        rokomari: b.rokomari?.[sheetDay] || 0,
        wafilife: b.wafilife?.[sheetDay] || 0,
        othersOnline: b.othersOnline?.[sheetDay] || 0,
        headOfficeOffline: b.headOfficeSellOffline?.[sheetDay] || 0,
        nilkhet: b.nilkhetLibrary?.[sheetDay] || 0,
        sumona: b.sumonaLibrary?.[sheetDay] || 0,
        promise: b.promiseLibrary?.[sheetDay] || 0,
        joystar: b.joystarLibrary?.[sheetDay] || 0,
        returns: b.dailyReturns?.[sheetDay] || 0,
      };
    });
    setSheetValues(initialMap);
  }, [sheetDay, books]);

  const currentBook = books.find(b => b.id === selectedBookId) || books[0];
  const m = currentBook ? calculateBookMetrics(currentBook) : null;

  // Single mode live calculations
  const singleOnlineSold = boibari + rokomari + wafilife + othersOnline;
  const singleOfflineSold = headOfficeOffline + nilkhet + sumona + promise + joystar;
  const singleTotalSold = singleOnlineSold + singleOfflineSold;
  const singleRevenue = singleTotalSold * (m?.perBookAmount || 0);
  const singleProfit = singleTotalSold * (m?.profitPerBook || 0);

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBook) return;

    onSaveDailyEntry(currentBook.id, day, {
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
      marketing: currentBook.marketing || 0,
      service: currentBook.service || 0,
      adVideoMaking: currentBook.adVideoMaking || 0,
      rd: currentBook.rd || 0,
      gift: currentBook.gift || 0,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveSheet = () => {
    books.forEach(b => {
      const data = sheetValues[b.id];
      if (data) {
        onSaveDailyEntry(b.id, sheetDay, {
          pressReceipt: Number(data.pressReceipt) || 0,
          boibari: Number(data.boibari) || 0,
          rokomari: Number(data.rokomari) || 0,
          wafilife: Number(data.wafilife) || 0,
          othersOnline: Number(data.othersOnline) || 0,
          headOfficeOffline: Number(data.headOfficeOffline) || 0,
          nilkhet: Number(data.nilkhet) || 0,
          sumona: Number(data.sumona) || 0,
          promise: Number(data.promise) || 0,
          joystar: Number(data.joystar) || 0,
          returns: Number(data.returns) || 0,
          marketing: b.marketing || 0,
          service: b.service || 0,
          adVideoMaking: b.adVideoMaking || 0,
          rd: b.rd || 0,
          gift: b.gift || 0,
        });
      }
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSheetCellChange = (bookId: string, field: string, val: number) => {
    setSheetValues(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        [field]: Math.max(0, val),
      },
    }));
  };

  if (books.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-zinc-200 shadow-xs text-center space-y-3">
        <BookOpen className="w-12 h-12 text-zinc-300 mx-auto" />
        <h3 className="text-base font-bold text-zinc-900">বর্তমানে কোনো বইয়ের তালিকা নেই</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          দৈনিক ও মাসিক ডেটা এন্ট্রি করার জন্য প্রথমে উপরে <b>"+ নতুন বই"</b> বাটনে ক্লিক করে বই যুক্ত করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Card: Mode Selection (Black & White Minimalist) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg border border-zinc-200">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">
              সহজ ডেটা এন্ট্রি সিস্টেম
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            মাসের যেকোনো তারিখের (১ থেকে ৩১ তারিখ) সেলস, চালান ও রিটার্ন দ্রুত লিপিবদ্ধ করুন
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-zinc-100 p-1 rounded-xl self-start md:self-auto border border-zinc-200">
          <button
            onClick={() => setEntryMode('single')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              entryMode === 'single'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>একক বই এন্ট্রি</span>
          </button>

          <button
            onClick={() => setEntryMode('sheet')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              entryMode === 'sheet'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>সকল বই দৈনিক শিট এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="p-3 bg-zinc-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>ডাটা সফলভাবে সংরক্ষিত হয়েছে এবং ইনভেন্টরি ও লাভ তাৎক্ষণিক আপডেট হয়েছে!</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 1: SINGLE BOOK QUICK ENTRY */}
      {/* ======================================================== */}
      {entryMode === 'single' && (
        <form onSubmit={handleSaveSingle} className="space-y-5 animate-in fade-in duration-150">
          
          {/* Book & Date Selectors */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                ১. বই নির্বাচন করুন
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full text-sm font-semibold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:bg-white"
              >
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.sl}. {b.bookName} (MRP: {b.perBookAmount}৳ | লাভ: +{b.profitPerBook}৳)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                ২. তারিখ নির্বাচন করুন (১লা থেকে {formatNumber(daysInMonth)} তারিখ - {formatMonthYearBengali(selectedMonth, selectedYear)})
              </label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full text-sm font-bold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:bg-white font-mono"
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>
                    {d} তারিখ ({d}তম দিন)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Calculation Summary (Monochrome Minimalist) */}
          <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-900">
                "{currentBook?.bookName}" — {day} তারিখের হিসাব:
              </span>
            </div>
            <div className="flex items-center gap-4 text-zinc-800">
              <span>আজকের বিক্রি: <b className="text-zinc-900 text-sm font-bold">{formatNumber(singleTotalSold)}</b> কপি</span>
              <span>সম্ভাব্য রাজস্ব: <b className="text-zinc-900 text-sm font-bold">{formatBDT(singleRevenue)}</b></span>
              <span>নিট লাভ: <b className="text-zinc-900 text-sm font-bold">+{formatBDT(singleProfit)}</b></span>
            </div>
          </div>

          {/* Section 1: Press Receipt */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-zinc-700" />
              <span>প্রেস চালান (ফরিদ ভাই থেকে হেড অফিসে প্রাপ্ত বই)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs text-zinc-600 mb-1">
                  {day} তারিখে ফরিদ ভাই প্রেস থেকে হেড অফিসে আসা বই
                </label>
                <input
                  type="number"
                  min="0"
                  value={pressReceipt || ''}
                  onChange={(e) => setPressReceipt(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2.5 focus:ring-2 focus:ring-zinc-900 focus:bg-white font-mono"
                />
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl text-xs text-zinc-800 border border-zinc-200">
                <span className="block font-medium">প্রেসের মোট অর্ডার: <b>{formatNumber(m?.totalOrderFaridBhai || 0)}</b> কপি</span>
                <span className="block mt-0.5 text-zinc-600">বর্তমান প্রেস ব্যালেন্স: <b>{formatNumber(m?.stockToFaridBhai || 0)}</b> কপি</span>
              </div>
            </div>
          </div>

          {/* Section 2: Online Sales */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-700" />
              <span>অনলাইন ডেলিভারি ({day} তারিখের অনলাইন বিক্রি)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">বইবাড়ি</label>
                <input
                  type="number"
                  min="0"
                  value={boibari || ''}
                  onChange={(e) => setBoibari(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">রকমারি</label>
                <input
                  type="number"
                  min="0"
                  value={rokomari || ''}
                  onChange={(e) => setRokomari(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">ওয়াফিলাইফ</label>
                <input
                  type="number"
                  min="0"
                  value={wafilife || ''}
                  onChange={(e) => setWafilife(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">অন্যান্য অনলাইন</label>
                <input
                  type="number"
                  min="0"
                  value={othersOnline || ''}
                  onChange={(e) => setOthersOnline(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Offline Sales */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-zinc-700" />
              <span>অফলাইন ও লাইব্রেরি ডেলিভারি ({day} তারিখের অফলাইন বিক্রি)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">হেড অফিস সেল</label>
                <input
                  type="number"
                  min="0"
                  value={headOfficeOffline || ''}
                  onChange={(e) => setHeadOfficeOffline(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">নীলক্ষেত লাইব্রেরি</label>
                <input
                  type="number"
                  min="0"
                  value={nilkhet || ''}
                  onChange={(e) => setNilkhet(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">সুমনা (প্রেস থেকে)</label>
                <input
                  type="number"
                  min="0"
                  value={sumona || ''}
                  onChange={(e) => setSumona(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">প্রমিজ (প্রেস থেকে)</label>
                <input
                  type="number"
                  min="0"
                  value={promise || ''}
                  onChange={(e) => setPromise(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">জয়স্টার (প্রেস থেকে)</label>
                <input
                  type="number"
                  min="0"
                  value={joystar || ''}
                  onChange={(e) => setJoystar(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Returns */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-zinc-700" />
              <span>দৈনিক রিটার্ন ({day} তারিখে ফেরত আসা বই)</span>
            </h3>
            <div className="max-w-xs">
              <input
                type="number"
                min="0"
                value={returns || ''}
                onChange={(e) => setReturns(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-full text-base font-bold border border-zinc-300 rounded-xl p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDay(d => Math.min(daysInMonth, d + 1))}
                className="text-xs font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition-colors border border-zinc-200"
              >
                পরবর্তী তারিখ ({Math.min(daysInMonth, day + 1)} তারিখ) ➔
              </button>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl shadow-xs transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{day} তারিখের ডাটা সংরক্ষণ করুন</span>
            </button>
          </div>

        </form>
      )}

      {/* ======================================================== */}
      {/* MODE 2: ALL BOOKS DAILY SHEET ENTRY */}
      {/* ======================================================== */}
      {entryMode === 'sheet' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Day Picker & Bulk Save Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-800">তারিখ নির্বাচন:</span>
              <select
                value={sheetDay}
                onChange={(e) => setSheetDay(Number(e.target.value))}
                className="text-sm font-bold border border-zinc-300 rounded-xl px-3 py-1.5 bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-zinc-900 font-mono"
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>
                    {d} তারিখ ({d}তম দিন)
                  </option>
                ))}
              </select>
              <span className="text-xs text-zinc-500">({books.length} টি বইয়ের জন্য একযোগে এন্ট্রি)</span>
            </div>

            <button
              onClick={handleSaveSheet}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl shadow-xs transition-colors self-end sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>{sheetDay} তারিখে সব বইয়ের ডাটা সেভ করুন</span>
            </button>
          </div>

          {/* Bulk Spreadsheet Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span>👉 সম্পূর্ণ শিট দেখতে ডানে স্ক্রোল করুন</span>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-semibold border-b border-zinc-200">
                    <th className="py-2.5 px-3 min-w-[180px] sticky left-0 z-10 bg-zinc-100">বইয়ের নাম</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[70px]">প্রেস প্রাপ্ত</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">বইবাড়ি</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">রকমারি</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">ওয়াফিলাইফ</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">অন্যান্য</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">HO কাউন্টার</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">নীলক্ষেত</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">সুমনা</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">প্রমিজ</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">জয়স্টার</th>
                    <th className="py-2.5 px-2 text-center bg-zinc-50 min-w-[65px]">রিটার্ন</th>
                    <th className="py-2.5 px-3 text-center font-bold bg-zinc-200 text-zinc-900 min-w-[80px]">আজকের বিক্রি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {books.map(b => {
                    const row = sheetValues[b.id] || {
                      pressReceipt: 0,
                      boibari: 0,
                      rokomari: 0,
                      wafilife: 0,
                      othersOnline: 0,
                      headOfficeOffline: 0,
                      nilkhet: 0,
                      sumona: 0,
                      promise: 0,
                      joystar: 0,
                      returns: 0,
                    };

                    const rowTotal = 
                      (row.boibari || 0) +
                      (row.rokomari || 0) +
                      (row.wafilife || 0) +
                      (row.othersOnline || 0) +
                      (row.headOfficeOffline || 0) +
                      (row.nilkhet || 0) +
                      (row.sumona || 0) +
                      (row.promise || 0) +
                      (row.joystar || 0);

                    return (
                      <tr key={b.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-2 px-3 font-semibold text-zinc-900 sticky left-0 z-10 bg-white">
                          {b.sl}. {b.bookName}
                        </td>

                        {/* Press Receipt */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.pressReceipt || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'pressReceipt', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Boibari */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.boibari || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'boibari', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Rokomari */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.rokomari || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'rokomari', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Wafilife */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.wafilife || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'wafilife', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Others Online */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.othersOnline || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'othersOnline', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* HO Offline */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.headOfficeOffline || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'headOfficeOffline', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Nilkhet */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.nilkhet || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'nilkhet', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Sumona */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.sumona || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'sumona', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Promise */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.promise || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'promise', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Joystar */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.joystar || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'joystar', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Returns */}
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min="0"
                            value={row.returns || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'returns', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-zinc-200 rounded focus:border-zinc-900 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Row Total */}
                        <td className="py-2 px-3 text-center font-bold text-zinc-900 bg-zinc-100">
                          {rowTotal > 0 ? `${rowTotal}টি` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSheet}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{sheetDay} তারিখে সব বইয়ের ডাটা সেভ করুন</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
