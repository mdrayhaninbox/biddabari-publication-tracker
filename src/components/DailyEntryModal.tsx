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
import { calculateBookMetrics, formatBDT, formatNumber } from '../utils/calculations';

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
}

export const DailyEntryModal: React.FC<DailyEntryModalProps> = ({
  isOpen,
  onClose,
  books,
  initialBookId,
  onSaveDailyEntry,
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

  // When selected book or day changes, load current values for that day
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-800 to-rose-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">দৈনিক বিক্রয় ও স্টক এন্ট্রি ফরম (Input Form)</h3>
              <p className="text-xs text-rose-200">প্রতিদিনের সেলস, প্রেস চালান ও রিটার্ন ডাটা লিপিবদ্ধ করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Book & Day Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  বই নির্বাচন করুন *
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.sl}. {b.bookName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  তারিখ / দিন নির্বাচন করুন (Day 1 - 31) *
                </label>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      দিন {d} ({d} তারিখ)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Live Summary of Selected Day */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-rose-900">
                দিন {day}-এর হিসাব:
              </span>
              <span className="text-slate-700">
                অনলাইন: <b className="text-sky-700">{formatNumber(dayOnlineSold)}</b> কপি
              </span>
              <span className="text-slate-700">
                অফলাইন: <b className="text-purple-700">{formatNumber(dayOfflineSold)}</b> কপি
              </span>
              <span className="text-slate-700">
                মোট বিক্রয়: <b className="text-blue-700">{formatNumber(dayTotalSold)}</b> কপি
              </span>
              <span className="text-slate-700">
                সম্ভাব্য রাজস্ব: <b className="text-slate-900">{formatBDT(dayRevenue)}</b>
              </span>
              <span className="text-slate-700">
                প্রাক্কলিত লাভ: <b className="text-emerald-700 font-bold">+{formatBDT(dayProfit)}</b>
              </span>
            </div>

            {/* Section 1: Press Receipt */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold text-sm">
                <Warehouse className="w-4 h-4 text-amber-600" />
                <span>১. ফরিদ ভাই প্রেস থেকে হেড অফিসে চালান গ্রহণ (Press Receipt)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    দিন {day}-এ প্রাপ্ত মোট বই (Farid Bhai to HO)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pressReceipt || ''}
                    onChange={(e) => setPressReceipt(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    বর্তমান মোট প্রাপ্ত: {currentMetrics?.faridBhaiToHeadOffice || 0} কপি
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-lg text-xs text-amber-900 flex flex-col justify-center">
                  <span>প্রেসের মোট অর্ডার: <b>{formatNumber(currentMetrics?.totalOrderFaridBhai || 0)}</b> কপি</span>
                  <span>প্রেসে বর্তমান স্টক: <b>{formatNumber(currentMetrics?.stockToFaridBhai || 0)}</b> কপি</span>
                </div>
              </div>
            </div>

            {/* Section 2: Online Sales */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-sky-800 font-bold text-sm">
                <Globe className="w-4 h-4 text-sky-600" />
                <span>২. অনলাইন প্ল্যাটফর্মে বিক্রয় (Online Sales)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">বইবাড়ি (Boibari)</label>
                  <input
                    type="number"
                    min="0"
                    value={boibari || ''}
                    onChange={(e) => setBoibari(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">রকমারি (Rokomari)</label>
                  <input
                    type="number"
                    min="0"
                    value={rokomari || ''}
                    onChange={(e) => setRokomari(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">ওয়াফিলাইফ (Wafilife)</label>
                  <input
                    type="number"
                    min="0"
                    value={wafilife || ''}
                    onChange={(e) => setWafilife(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono"
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
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Offline & Libraries */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3 text-purple-800 font-bold text-sm">
                <Store className="w-4 h-4 text-purple-600" />
                <span>৩. অফলাইন ও লাইব্রেরি বিক্রয় (Offline & Libraries)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">হেড অফিস সেল</label>
                  <input
                    type="number"
                    min="0"
                    value={headOfficeOffline || ''}
                    onChange={(e) => setHeadOfficeOffline(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-mono"
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
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">সুমনা লাইব্রেরি (প্রেস)</label>
                  <input
                    type="number"
                    min="0"
                    value={sumona || ''}
                    onChange={(e) => setSumona(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">প্রমিজ লাইব্রেরি (প্রেস)</label>
                  <input
                    type="number"
                    min="0"
                    value={promise || ''}
                    onChange={(e) => setPromise(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">জয়স্টার লাইব্রেরি (প্রেস)</label>
                  <input
                    type="number"
                    min="0"
                    value={joystar || ''}
                    onChange={(e) => setJoystar(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Returns & Departmental copies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Daily Returns */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-2 text-rose-800 font-bold text-sm">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>৪. দৈনিক রিটার্ন (Daily Returns)</span>
                </div>
                <label className="block text-xs text-slate-600 mb-1">
                  দিন {day}-এ হেড অফিসে ফেরত আসা বই (স্টকে যুক্ত হবে)
                </label>
                <input
                  type="number"
                  min="0"
                  value={returns || ''}
                  onChange={(e) => setReturns(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              {/* Promotional / Dept */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-2 text-indigo-800 font-bold text-sm">
                  <Gift className="w-4 h-4 text-indigo-600" />
                  <span>৫. প্রমোশন ও ডিপার্টমেন্ট কপি</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">মার্কেটিং</label>
                    <input
                      type="number"
                      min="0"
                      value={marketing || ''}
                      onChange={(e) => setMarketing(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">সার্ভিস</label>
                    <input
                      type="number"
                      min="0"
                      value={service || ''}
                      onChange={(e) => setService(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">ভিডিও</label>
                    <input
                      type="number"
                      min="0"
                      value={adVideoMaking || ''}
                      onChange={(e) => setAdVideoMaking(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">R&D</label>
                    <input
                      type="number"
                      min="0"
                      value={rd || ''}
                      onChange={(e) => setRd(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">উপহার</label>
                    <input
                      type="number"
                      min="0"
                      value={gift || ''}
                      onChange={(e) => setGift(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            {savedSuccess ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>সফলভাবে দিন {day}-এর ডাটা সংরক্ষিত হয়েছে!</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">
                সংরক্ষণ করলে তাৎক্ষণিক স্টক ও হিসাব আপডেট হবে
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-rose-500"
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
