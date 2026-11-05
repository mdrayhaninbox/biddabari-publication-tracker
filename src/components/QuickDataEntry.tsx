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
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { BookRecord } from '../types/book';
import { calculateBookMetrics, formatBDT, formatNumber } from '../utils/calculations';

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
  onBatchSaveDailyEntries?: (day: number, entriesMap: { [bookId: string]: any }) => void;
}

export const QuickDataEntry: React.FC<QuickDataEntryProps> = ({
  books,
  initialBookId,
  initialDay = 1,
  onSaveDailyEntry,
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

  return (
    <div className="space-y-6">
      
      {/* Top Card: Mode Selection */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              সহজ ডেটা এন্ট্রি সিস্টেম (Simple Data Input)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            একক বই অনুযায়ী অথবা একই দিনে সব বইয়ের চালান ও বিক্রয় এক ক্লিকে এন্ট্রি দিন
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setEntryMode('single')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              entryMode === 'single'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>একক বই এন্ট্রি (Single)</span>
          </button>

          <button
            onClick={() => setEntryMode('sheet')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              entryMode === 'sheet'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>সকল বই দৈনিক শিট এন্ট্রি (All Books)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>ডাটা সফলভাবে সংরক্ষিত হয়েছে এবং স্টক ও লাভ তাৎক্ষণিক আপডেট হয়েছে!</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 1: SINGLE BOOK QUICK ENTRY */}
      {/* ======================================================== */}
      {entryMode === 'single' && (
        <form onSubmit={handleSaveSingle} className="space-y-5 animate-in fade-in duration-150">
          
          {/* Book & Day Selectors */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ১. বই নির্বাচন করুন
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-rose-500"
              >
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.sl}. {b.bookName} (মূল্য: {b.perBookAmount}৳ | লাভ: {b.profitPerBook}৳)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ২. তারিখ / দিন নির্বাচন করুন
              </label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full text-sm font-semibold border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-rose-500 font-mono"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>
                    দিন {d} ({d} তারিখ)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Calculation Badge */}
          <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border border-rose-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-700" />
              <span className="font-bold text-slate-800">
                "{currentBook?.bookName}" - দিন {day}-এর হিসাব:
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <span>মোট বিক্রি: <b className="text-blue-700 text-sm">{formatNumber(singleTotalSold)}</b> কপি</span>
              <span>রাজস্ব: <b className="text-slate-900 text-sm">{formatBDT(singleRevenue)}</b></span>
              <span>নিট লাভ: <b className="text-emerald-700 text-sm">+{formatBDT(singleProfit)}</b></span>
            </div>
          </div>

          {/* Section 1: Press Receipt */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-amber-900 mb-3 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-amber-600" />
              <span>প্রেস চালান (ফরিদ ভাই থেকে হেড অফিসে প্রাপ্ত)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  দিন {day}-এ ফরিদ ভাই প্রেস থেকে আসা বই
                </label>
                <input
                  type="number"
                  min="0"
                  value={pressReceipt || ''}
                  onChange={(e) => setPressReceipt(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
              <div className="p-3 bg-amber-50/70 rounded-xl text-xs text-amber-900">
                <span className="block">প্রেসের মোট অর্ডার: <b>{formatNumber(m?.totalOrderFaridBhai || 0)}</b> কপি</span>
                <span className="block mt-0.5">বর্তমান প্রেস ব্যালেন্স: <b>{formatNumber(m?.stockToFaridBhai || 0)}</b> কপি</span>
              </div>
            </div>
          </div>

          {/* Section 2: Online Sales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-sky-900 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-600" />
              <span>অনলাইন ডেলিভারি (হেড অফিস থেকে কুরিয়ার প্রেরিত)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">বইবাড়ি</label>
                <input
                  type="number"
                  min="0"
                  value={boibari || ''}
                  onChange={(e) => setBoibari(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">রকমারি</label>
                <input
                  type="number"
                  min="0"
                  value={rokomari || ''}
                  onChange={(e) => setRokomari(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">ওয়াফিলাইফ</label>
                <input
                  type="number"
                  min="0"
                  value={wafilife || ''}
                  onChange={(e) => setWafilife(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">অন্যান্য অনলাইন</label>
                <input
                  type="number"
                  min="0"
                  value={othersOnline || ''}
                  onChange={(e) => setOthersOnline(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Offline Sales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-purple-900 mb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-purple-600" />
              <span>অফলাইন ও লাইব্রেরি ডেলিভারি</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">হেড অফিস সেল</label>
                <input
                  type="number"
                  min="0"
                  value={headOfficeOffline || ''}
                  onChange={(e) => setHeadOfficeOffline(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">নীলক্ষেত লাইব্রেরি</label>
                <input
                  type="number"
                  min="0"
                  value={nilkhet || ''}
                  onChange={(e) => setNilkhet(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">সুমনা (প্রেস থেকে)</label>
                <input
                  type="number"
                  min="0"
                  value={sumona || ''}
                  onChange={(e) => setSumona(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">প্রমিজ (প্রেস থেকে)</label>
                <input
                  type="number"
                  min="0"
                  value={promise || ''}
                  onChange={(e) => setPromise(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">জয়স্টার (প্রেস থেকে)</label>
                <input
                  type="number"
                  min="0"
                  value={joystar || ''}
                  onChange={(e) => setJoystar(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Returns */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-rose-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>দৈনিক রিটার্ন (ফেরত এসে স্টকে যুক্ত হওয়া বই)</span>
            </h3>
            <div className="max-w-xs">
              <input
                type="number"
                min="0"
                value={returns || ''}
                onChange={(e) => setReturns(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-full text-base font-bold border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDay(d => Math.min(31, d + 1))}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
              >
                পরের দিন (দিন {Math.min(31, day + 1)}) ➔
              </button>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-rose-500"
            >
              <Save className="w-4 h-4" />
              <span>দিন {day}-এর ডাটা সংরক্ষণ করুন</span>
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">তারিখ / দিন:</span>
              <select
                value={sheetDay}
                onChange={(e) => setSheetDay(Number(e.target.value))}
                className="text-sm font-bold border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-rose-500 font-mono"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>
                    দিন {d} ({d} তারিখ)
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">({books.length} টি বইয়ের জন্য একযোগে এন্ট্রি)</span>
            </div>

            <button
              onClick={handleSaveSheet}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors self-end sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>দিন {sheetDay}-এ সব বইয়ের ডাটা সেভ করুন</span>
            </button>
          </div>

          {/* Bulk Spreadsheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 min-w-[180px] sticky left-0 z-10 bg-slate-100">বইয়ের নাম</th>
                    <th className="py-2.5 px-2 text-center bg-amber-50 min-w-[70px]">প্রেস প্রাপ্ত</th>
                    <th className="py-2.5 px-2 text-center bg-sky-50 min-w-[65px]">বইবাড়ি</th>
                    <th className="py-2.5 px-2 text-center bg-sky-50 min-w-[65px]">রকমারি</th>
                    <th className="py-2.5 px-2 text-center bg-sky-50 min-w-[65px]">ওয়াফিলাইফ</th>
                    <th className="py-2.5 px-2 text-center bg-sky-50 min-w-[65px]">অন্যান্য</th>
                    <th className="py-2.5 px-2 text-center bg-purple-50 min-w-[65px]">HO কাউন্টার</th>
                    <th className="py-2.5 px-2 text-center bg-purple-50 min-w-[65px]">নীলক্ষেত</th>
                    <th className="py-2.5 px-2 text-center bg-purple-50 min-w-[65px]">সুমনা</th>
                    <th className="py-2.5 px-2 text-center bg-purple-50 min-w-[65px]">প্রমিজ</th>
                    <th className="py-2.5 px-2 text-center bg-purple-50 min-w-[65px]">জয়স্টার</th>
                    <th className="py-2.5 px-2 text-center bg-rose-50 min-w-[65px]">রিটার্ন</th>
                    <th className="py-2.5 px-3 text-center font-bold bg-blue-50 text-blue-900 min-w-[80px]">আজকের বিক্রি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900 sticky left-0 z-10 bg-white">
                          {b.sl}. {b.bookName}
                        </td>

                        {/* Press Receipt */}
                        <td className="py-1 px-1 bg-amber-50/40">
                          <input
                            type="number"
                            min="0"
                            value={row.pressReceipt || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'pressReceipt', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-amber-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Boibari */}
                        <td className="py-1 px-1 bg-sky-50/30">
                          <input
                            type="number"
                            min="0"
                            value={row.boibari || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'boibari', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-sky-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Rokomari */}
                        <td className="py-1 px-1 bg-sky-50/30">
                          <input
                            type="number"
                            min="0"
                            value={row.rokomari || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'rokomari', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-sky-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Wafilife */}
                        <td className="py-1 px-1 bg-sky-50/30">
                          <input
                            type="number"
                            min="0"
                            value={row.wafilife || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'wafilife', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-sky-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Others Online */}
                        <td className="py-1 px-1 bg-sky-50/30">
                          <input
                            type="number"
                            min="0"
                            value={row.othersOnline || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'othersOnline', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-sky-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* HO Offline */}
                        <td className="py-1 px-1 bg-purple-50/30">
                          <input
                            type="number"
                            min="0"
                            value={row.headOfficeOffline || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'headOfficeOffline', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-purple-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Nilkhet */}
                        <td className="py-1 px-1 bg-purple-50/30">
                          <input
                            type="number"
                            min="0"
                            value={row.nilkhet || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'nilkhet', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-purple-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Sumona */}
                        <td className="py-1 px-1 bg-purple-50/30">
                          <input
                            type="number"
                            min="0"
                            value={row.sumona || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'sumona', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-purple-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Promise */}
                        <td className="py-1 px-1 bg-purple-50/30">
                          <input
                            type="number"
                            min="0"
                            value={row.promise || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'promise', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-purple-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Joystar */}
                        <td className="py-1 px-1 bg-purple-50/30">
                          <input
                            type="number"
                            min="0"
                            value={row.joystar || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'joystar', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-purple-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Returns */}
                        <td className="py-1 px-1 bg-rose-50/40">
                          <input
                            type="number"
                            min="0"
                            value={row.returns || ''}
                            onChange={(e) => handleSheetCellChange(b.id, 'returns', parseInt(e.target.value) || 0)}
                            className="w-full text-center py-1 font-mono text-xs border border-slate-200 rounded focus:border-rose-500 focus:bg-white"
                            placeholder="0"
                          />
                        </td>

                        {/* Row Total */}
                        <td className="py-2 px-3 text-center font-bold text-blue-700 bg-blue-50/50">
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
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>দিন {sheetDay}-এ সব বইয়ের ডাটা সেভ করুন</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
