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
import { BookRecord } from '../types/book';
import { calculateBookMetrics, formatBDT, formatNumber, formatMonthYearBengali } from '../utils/calculations';

interface DailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  initialBookId?: string;
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

export const DailyEntryModal: React.FC<DailyEntryModalProps> = ({
  isOpen,
  onClose,
  books,
  initialBookId,
  onSaveDailyEntry,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
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
    }
    setSavedSuccess(false);
  }, [selectedBookId, day, books]);

  if (!isOpen) return null;

  if (books.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl border border-zinc-200">
          <h3 className="font-bold text-zinc-900 text-sm">কোনো বই পাওয়া যায়নি</h3>
          <p className="text-xs text-zinc-500">ডেটা এন্ট্রি করার আগে অনুগ্রহ করে "+ নতুন বই" বাটনে ক্লিক করে বই যুক্ত করুন।</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    );
  }

  const currentBook = books.find(b => b.id === selectedBookId);
  const currentMetrics = currentBook ? calculateBookMetrics(currentBook) : null;

  // Day calculations
  const dayOnlineSold = boibari + rokomari + wafilife + othersOnline;
  const dayOfflineSold = headOfficeOffline + nilkhet + sumona + promise + joystar;
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
              <h3 className="text-base font-bold">তারিখ ভিত্তিক ডেটা এন্ট্রি ফরম</h3>
              <p className="text-xs text-zinc-400">প্রতিদিনের সেলস, প্রেস চালান ও রিটার্ন লিপিবদ্ধ করুন</p>
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
                  বই নির্বাচন করুন *
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
                  তারিখ নির্বাচন করুন (১লা থেকে {formatNumber(daysInMonth)} তারিখ • {formatMonthYearBengali(selectedMonth, selectedYear)}) *
                </label>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:ring-2 focus:ring-zinc-900 font-mono"
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      {d} তারিখ ({d}তম দিন)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Live Summary of Selected Date */}
            <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-zinc-900">
                {day} {formatMonthYearBengali(selectedMonth, selectedYear)} এর হিসাব:
              </span>
              <span className="text-zinc-700">
                অনলাইন: <b className="text-zinc-900">{formatNumber(dayOnlineSold)}</b> কপি
              </span>
              <span className="text-zinc-700">
                অফলাইন: <b className="text-zinc-900">{formatNumber(dayOfflineSold)}</b> কপি
              </span>
              <span className="text-zinc-700">
                মোট বিক্রয়: <b className="text-zinc-900 font-bold">{formatNumber(dayTotalSold)}</b> কপি
              </span>
              <span className="text-zinc-700">
                সম্ভাব্য রাজস্ব: <b className="text-zinc-900">{formatBDT(dayRevenue)}</b>
              </span>
              <span className="text-zinc-700">
                প্রাক্কলিত লাভ: <b className="text-zinc-900 font-bold">+{formatBDT(dayProfit)}</b>
              </span>
            </div>

            {/* Section 1: Press Receipt */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-zinc-900 font-bold text-xs">
                <Warehouse className="w-4 h-4 text-zinc-700" />
                <span>১. ফরিদ ভাই প্রেস থেকে হেড অফিসে চালান গ্রহণ (Press Receipt)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">
                    {day} তারিখে প্রাপ্ত মোট বই (Farid Bhai to HO)
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
                    বর্তমান মোট প্রাপ্ত: {currentMetrics?.faridBhaiToHeadOffice || 0} কপি
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-lg text-xs text-zinc-800 border border-zinc-200 flex flex-col justify-center">
                  <span>প্রেসের মোট অর্ডার: <b>{formatNumber(currentMetrics?.totalOrderFaridBhai || 0)}</b> কপি</span>
                  <span className="mt-0.5">প্রেসে বর্তমান স্টক: <b>{formatNumber(currentMetrics?.stockToFaridBhai || 0)}</b> কপি</span>
                </div>
              </div>
            </div>

            {/* Section 2: Online Sales */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-zinc-900 font-bold text-xs">
                <Globe className="w-4 h-4 text-zinc-700" />
                <span>২. অনলাইন প্ল্যাটফর্মে বিক্রয় ({day} তারিখের অনলাইন সেলস)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">বইবাড়ি</label>
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
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">রকমারি</label>
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
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">ওয়াফিলাইফ</label>
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
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">অন্যান্য অনলাইন</label>
                  <input
                    type="number"
                    min="0"
                    value={othersOnline || ''}
                    onChange={(e) => setOthersOnline(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Offline & Libraries */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-zinc-900 font-bold text-xs">
                <Store className="w-4 h-4 text-zinc-700" />
                <span>৩. অফলাইন ও লাইব্রেরি বিক্রয় ({day} তারিখের অফলাইন সেলস)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">হেড অফিস সেল</label>
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
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">নীলক্ষেত লাইব্রেরি</label>
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
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">সুমনা (প্রেস)</label>
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
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">প্রমিজ (প্রেস)</label>
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
                  <label className="block text-xs text-zinc-700 mb-1 font-semibold">জয়স্টার (প্রেস)</label>
                  <input
                    type="number"
                    min="0"
                    value={joystar || ''}
                    onChange={(e) => setJoystar(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Returns & Departmental copies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Daily Returns */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-2 text-zinc-900 font-bold text-xs">
                  <RotateCcw className="w-4 h-4 text-zinc-700" />
                  <span>৪. দৈনিক রিটার্ন ({day} তারিখে ফেরত আসা বই)</span>
                </div>
                <label className="block text-xs text-zinc-600 mb-1">
                  হেড অফিসে ফেরত আসা বই (স্টকে যুক্ত হবে)
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
                  <span>৫. প্রমোশন ও ডিপার্টমেন্ট কপি</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">মার্কেটিং</label>
                    <input
                      type="number"
                      min="0"
                      value={marketing || ''}
                      onChange={(e) => setMarketing(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-bold border border-zinc-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">সার্ভিস</label>
                    <input
                      type="number"
                      min="0"
                      value={service || ''}
                      onChange={(e) => setService(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-bold border border-zinc-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">ভিডিও</label>
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
                    <label className="block text-[10px] text-zinc-500 mb-0.5">উপহার</label>
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
                <span>সফলভাবে {day} তারিখের ডাটা সংরক্ষিত হয়েছে!</span>
              </div>
            ) : (
              <span className="text-xs text-zinc-500">
                সংরক্ষণ করলে তাৎক্ষণিক স্টক ও হিসাব আপডেট হবে
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
