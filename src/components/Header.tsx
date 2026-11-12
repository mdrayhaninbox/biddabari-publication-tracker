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
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { ActiveTab } from '../types/book';
import { 
  BENGALI_MONTHS, 
  AVAILABLE_YEARS, 
  formatYearBengali, 
  formatMonthYearBengali 
} from '../utils/calculations';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddBook: () => void;
  onOpenDailyEntry: () => void;
  onExportExcel: () => void;
  onOpenImport: () => void;
  onResetData?: () => void;
  onPrint: () => void;
  bookCount: number;
  zoom?: '75' | '100';
  onSetZoom?: (zoom: '75' | '100') => void;

  // Month & Year controls
  selectedMonth: number;
  selectedYear: number;
  onSelectPeriod: (month: number, year: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
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
  zoom = '75',
  onSetZoom,
  selectedMonth,
  selectedYear,
  onSelectPeriod,
  onPrevMonth,
  onNextMonth,
}) => {
  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 sm:gap-3">
          
          {/* Logo, Title & Month-Year Badge */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xs shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900">
                    বিদ্যাবাড়ি পাবলিকেশন
                  </h1>
                  <span className="bg-zinc-100 text-zinc-800 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold border border-zinc-200">
                    বুক ট্র্যাকার
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-normal">
                  {formatMonthYearBengali(selectedMonth, selectedYear)}-এর খতিয়ান • {bookCount} টি বই
                </p>
              </div>
            </div>

            {/* Prominent Month & Year Switcher */}
            <div className="flex items-center bg-zinc-50 p-1 rounded-xl border border-zinc-300 gap-1 shadow-xs ml-auto sm:ml-2">
              <button
                type="button"
                onClick={onPrevMonth}
                className="p-1 rounded-lg text-zinc-600 hover:text-black hover:bg-white transition-colors border border-transparent hover:border-zinc-200"
                title="পূর্ববর্তী মাস"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
                
                {/* Month Dropdown */}
                <select
                  value={selectedMonth}
                  onChange={(e) => onSelectPeriod(Number(e.target.value), selectedYear)}
                  className="text-xs font-bold bg-white border border-zinc-200 rounded-lg px-1.5 sm:px-2 py-1 text-zinc-900 focus:outline-hidden cursor-pointer"
                  title="মাস নির্বাচন করুন"
                >
                  {BENGALI_MONTHS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={selectedYear}
                  onChange={(e) => onSelectPeriod(selectedMonth, Number(e.target.value))}
                  className="text-xs font-bold font-mono bg-white border border-zinc-200 rounded-lg px-1.5 sm:px-2 py-1 text-zinc-900 focus:outline-hidden cursor-pointer"
                  title="বছর নির্বাচন করুন"
                >
                  {AVAILABLE_YEARS.map(y => (
                    <option key={y} value={y}>
                      {formatYearBengali(y)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={onNextMonth}
                className="p-1 rounded-lg text-zinc-600 hover:text-black hover:bg-white transition-colors border border-transparent hover:border-zinc-200"
                title="পরবর্তী মাস"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto justify-start sm:justify-end">
            
            {/* View Zoom Switcher (Desktop 75% default vs 100%) */}
            <div className="hidden lg:flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs font-bold" title="কম্পিউটার স্ক্রিন ভিউ (৭৫% কমপ্যাক্ট বা ১০০%)">
              <button
                type="button"
                onClick={() => onSetZoom?.('75')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  zoom === '75'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="৭৫% কমপ্যাক্ট ভিউ (পারফেক্ট সাইজ)"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => onSetZoom?.('100')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  zoom === '100'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="১০০% স্বাভাবিক ভিউ"
              >
                100%
              </button>
            </div>

            <button
              onClick={onOpenDailyEntry}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors"
              title="সহজ ডেটা এন্ট্রি ফরম খুলুন"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>সহজ এন্ট্রি</span>
            </button>

            <button
              onClick={onOpenAddBook}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title="নতুন বই যুক্ত করুন"
            >
              <PlusCircle className="w-3.5 h-3.5 text-zinc-700" />
              <span>নতুন বই</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title="এক্সেল (.xlsx) ফাইল ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5 text-zinc-700" />
              <span>এক্সপোর্ট</span>
            </button>

            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title="এক্সেল ফাইল ইমপোর্ট করুন"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>ইমপোর্ট</span>
            </button>

            {onResetData && (
              <button
                type="button"
                onClick={onResetData}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
                title="সকল ডেটা মুছে সম্পূর্ণ শূন্য (০) থেকে শুরু করুন"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                <span>রিসেট (০)</span>
              </button>
            )}

            <button
              onClick={onPrint}
              className="inline-flex items-center p-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title="রিপোর্ট প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Navigation Tabs (Full Width Responsive Grid - Never Overflows or Scrolls) */}
        <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 sm:gap-1.5 mt-2.5 sm:mt-3 border-t border-zinc-100 pt-2 sm:pt-2.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center min-w-0 ${
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
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center min-w-0 ${
              activeTab === 'period'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">তারিখ ও পিরিয়ড</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center min-w-0 ${
              activeTab === 'accounts'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">প্রেস ও ডিউ হিসাব</span>
          </button>

          <button
            onClick={() => setActiveTab('entry')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center min-w-0 ${
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
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center min-w-0 ${
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
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center min-w-0 ${
              activeTab === 'matrix'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">ম্যাট্রিক্স শিট</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center min-w-0 ${
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
