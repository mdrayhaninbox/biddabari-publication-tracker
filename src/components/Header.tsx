import React from 'react';
import { 
  BookOpen, 
  BarChart3, 
  Table as TableIcon, 
  CalendarPlus, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  PlusCircle, 
  Printer, 
  RotateCcw,
  CalendarRange
} from 'lucide-react';
import { ActiveTab } from '../types/book';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddBook: () => void;
  onOpenDailyEntry: () => void;
  onExportExcel: () => void;
  onOpenImport: () => void;
  onResetData: () => void;
  onPrint: () => void;
  bookCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddBook,
  onOpenDailyEntry,
  onExportExcel,
  onOpenImport,
  onResetData,
  onPrint,
  bookCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-700 to-rose-900 flex items-center justify-center text-white shadow-md shadow-rose-900/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  বিদ্যাবাড়ি পাবলিকেশন
                </h1>
                <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-rose-200">
                  স্মার্ট সফটওয়্যার
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                দৈনিক, সাপ্তাহিক ও মাসিক সেলস ও স্টক হিসাব ট্র্যাকার • {bookCount} টি বই
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenDailyEntry}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              title="সহজ ডেটা এন্ট্রি ফরম খুলুন"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>সহজ এন্ট্রি</span>
            </button>

            <button
              onClick={onOpenAddBook}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              title="নতুন বই যুক্ত করুন"
            >
              <PlusCircle className="w-4 h-4 text-rose-600" />
              <span>নতুন বই</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
              title="এক্সেল (.xlsx) ফাইল ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">এক্সেল</span> এক্সপোর্ট
            </button>

            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              title="এক্সেল ফাইল ইমপোর্ট করুন"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">ইমপোর্ট</span>
            </button>

            <button
              onClick={onPrint}
              className="inline-flex items-center p-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              title="রিপোর্ট প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center p-2 text-sm font-medium text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200"
              title="ডিফল্ট এক্সেল ডাটায় রিসেট করুন"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1.5 mt-4 border-t border-slate-100 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>ড্যাশবোর্ড (Dashboard)</span>
          </button>

          <button
            onClick={() => setActiveTab('period')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'period'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarRange className="w-4 h-4 text-rose-500" />
            <span>📅 দৈনিক / সাপ্তাহিক / মাসিক ভিউ</span>
          </button>

          <button
            onClick={() => setActiveTab('entry')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'entry'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
            <span>⚡ সহজ ডেটা এন্ট্রি (Data Input)</span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'books'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>বই তালিকা ও স্টক খতিয়ান</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'matrix'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>৩১ দিনের সম্পূর্ণ ম্যাট্রিক্স</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'reports'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>এক্সিকিউটিভ রিপোর্ট</span>
          </button>
        </div>
      </div>
    </header>
  );
};
