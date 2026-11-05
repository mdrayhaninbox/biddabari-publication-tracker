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
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                  বিদ্যাবাড়ি পাবলিকেশন
                </h1>
                <span className="bg-zinc-100 text-zinc-800 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-zinc-200">
                  বুক ট্র্যাকার
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-normal">
                ১ থেকে ৩১ তারিখের দৈনিক, সাপ্তাহিক ও মাসিক সেলস ও স্টক খতিয়ান • {bookCount} টি বই
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenDailyEntry}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors"
              title="সহজ ডেটা এন্ট্রি ফরম খুলুন"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>সহজ এন্ট্রি</span>
            </button>

            <button
              onClick={onOpenAddBook}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title="নতুন বই যুক্ত করুন"
            >
              <PlusCircle className="w-4 h-4 text-zinc-700" />
              <span>নতুন বই</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title="এক্সেল (.xlsx) ফাইল ডাউনলোড করুন"
            >
              <Download className="w-4 h-4 text-zinc-700" />
              <span>এক্সেল এক্সপোর্ট</span>
            </button>

            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title="এক্সেল ফাইল ইমপোর্ট করুন"
            >
              <Upload className="w-4 h-4 text-zinc-500" />
              <span className="hidden sm:inline">ইমপোর্ট</span>
            </button>

            <button
              onClick={onPrint}
              className="inline-flex items-center p-2 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title="রিপোর্ট প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center p-2 text-xs font-medium text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title="ডিফল্ট এক্সেল ডাটায় রিসেট করুন"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Full Width Responsive Grid - Never Scrolls) */}
        <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 mt-3.5 border-t border-zinc-100 pt-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'dashboard'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">ড্যাশবোর্ড</span>
          </button>

          <button
            onClick={() => setActiveTab('period')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'period'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">তারিখভিত্তিক ভিউ</span>
          </button>

          <button
            onClick={() => setActiveTab('entry')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'entry'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">ডাটা এন্ট্রি</span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'books'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">বই তালিকা</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'matrix'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">৩১ দিনের ম্যাট্রিক্স</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'reports'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
            }`}
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">রিপোর্ট ও প্রিন্ট</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
