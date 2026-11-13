import React, { useState, useRef, useEffect } from 'react';
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
  RotateCcw,
  Palette,
  FolderOpen
} from 'lucide-react';
import { ActiveTab } from '../types/book';
import { 
  BENGALI_MONTHS, 
  AVAILABLE_YEARS, 
  formatYearBengali, 
  formatMonthYearBengali,
  formatNumber
} from '../utils/calculations';
import { Language, Theme, THEME_OPTIONS } from '../utils/i18n';

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
  onOpenStorage?: () => void;
  storageCount?: number;

  // Language & Theme
  language: Language;
  onSetLanguage: (lang: Language) => void;
  theme: Theme;
  onSetTheme: (theme: Theme) => void;

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
  onOpenStorage,
  storageCount = 0,
  language,
  onSetLanguage,
  theme,
  onSetTheme,
  selectedMonth,
  selectedYear,
  onSelectPeriod,
  onPrevMonth,
  onNextMonth,
}) => {
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Close theme dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900">
                    {language === 'bn' ? 'বিদ্যাবাড়ি পাবলিকেশন' : 'Biddabari Publication'}
                  </h1>
                  <span className="bg-zinc-100 text-zinc-800 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold border border-zinc-200">
                    {language === 'bn' ? 'বুক ট্র্যাকার' : 'Book Tracker'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-300 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span>{language === 'bn' ? 'ফায়ারবেস ক্লাউড লাইভ' : 'Firebase Cloud Live'}</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-normal">
                  {formatMonthYearBengali(selectedMonth, selectedYear, language)} • {bookCount} {language === 'bn' ? 'টি বই' : 'Books'}
                </p>
              </div>
            </div>

            {/* Prominent Month & Year Switcher */}
            <div className="flex items-center bg-zinc-50 p-1 rounded-xl border border-zinc-300 gap-1 shadow-xs ml-auto sm:ml-2">
              <button
                type="button"
                onClick={onPrevMonth}
                className="p-1 rounded-lg text-zinc-600 hover:text-black hover:bg-white transition-colors border border-transparent hover:border-zinc-200"
                title={language === 'bn' ? 'পূর্ববর্তী মাস' : 'Previous Month'}
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
                  title={language === 'bn' ? 'মাস নির্বাচন করুন' : 'Select Month'}
                >
                  {BENGALI_MONTHS.map(m => (
                    <option key={m.value} value={m.value}>
                      {language === 'bn' ? m.name : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m.value - 1]}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={selectedYear}
                  onChange={(e) => onSelectPeriod(selectedMonth, Number(e.target.value))}
                  className="text-xs font-bold font-mono bg-white border border-zinc-200 rounded-lg px-1.5 sm:px-2 py-1 text-zinc-900 focus:outline-hidden cursor-pointer"
                  title={language === 'bn' ? 'বছর নির্বাচন করুন' : 'Select Year'}
                >
                  {AVAILABLE_YEARS.map(y => (
                    <option key={y} value={y}>
                      {formatYearBengali(y, language)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={onNextMonth}
                className="p-1 rounded-lg text-zinc-600 hover:text-black hover:bg-white transition-colors border border-transparent hover:border-zinc-200"
                title={language === 'bn' ? 'পরবর্তী মাস' : 'Next Month'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto justify-start sm:justify-end">
            
            {/* View Zoom Switcher (Desktop 75% default vs 100%) */}
            <div className="hidden lg:flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs font-bold" title={language === 'bn' ? 'কম্পিউটার স্ক্রিন ভিউ (৭৫% কমপ্যাক্ট বা ১০০%)' : 'Screen View (75% or 100%)'}>
              <button
                type="button"
                onClick={() => onSetZoom?.('75')}
                className={`px-2 py-1 rounded-md transition-all ${
                  zoom === '75'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="75% View"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => onSetZoom?.('100')}
                className={`px-2 py-1 rounded-md transition-all ${
                  zoom === '100'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="100% View"
              >
                100%
              </button>
            </div>

            <button
              onClick={onOpenDailyEntry}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors"
              title={language === 'bn' ? 'সহজ ডেটা এন্ট্রি ফরম খুলুন' : 'Quick Data Entry'}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সহজ এন্ট্রি' : 'Quick Entry'}</span>
            </button>

            <button
              onClick={onOpenAddBook}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title={language === 'bn' ? 'নতুন বই যুক্ত করুন' : 'Add New Book'}
            >
              <PlusCircle className="w-3.5 h-3.5 text-zinc-700" />
              <span>{language === 'bn' ? 'নতুন বই' : 'New Book'}</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title={language === 'bn' ? 'এক্সেল (.xlsx) ফাইল ডাউনলোড করুন' : 'Export Excel (.xlsx)'}
            >
              <Download className="w-3.5 h-3.5 text-zinc-700" />
              <span className="hidden sm:inline">{language === 'bn' ? 'এক্সপোর্ট' : 'Export'}</span>
            </button>

            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
              title={language === 'bn' ? 'এক্সেল ফাইল ইমপোর্ট করুন' : 'Import Excel'}
            >
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">{language === 'bn' ? 'ইমপোর্ট' : 'Import'}</span>
            </button>

            {onResetData && (
              <button
                type="button"
                onClick={onResetData}
                className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
                title={language === 'bn' ? 'সকল ডেটা মুছে সম্পূর্ণ শূন্য (০) থেকে শুরু করুন' : 'Reset All Data to 0'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden md:inline">{language === 'bn' ? 'রিসেট (০)' : 'Reset (0)'}</span>
              </button>
            )}

            {/* STORAGE & NOTEBOOK BUTTON - ON THE LEFT OF THEME */}
            {onOpenStorage && (
              <button
                type="button"
                onClick={onOpenStorage}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
                title={language === 'bn' ? 'ফাইল স্টোরেজ ও ডিজিটাল নোটবুক' : 'File Storage & Digital Notebook'}
              >
                <FolderOpen className="w-3.5 h-3.5 text-zinc-600" />
                <span className="hidden sm:inline">
                  {language === 'bn' ? 'স্টোরেজ' : 'Storage'}
                </span>
                {storageCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-zinc-900 text-white rounded-full">
                    {storageCount}
                  </span>
                )}
              </button>
            )}

            {/* 1. COLOR THEME SELECTOR - RIGHT BESIDE PRINT */}
            <div className="relative inline-block" ref={themeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsThemeOpen(prev => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
                title={language === 'bn' ? 'ওয়েবসাইটের কালার থিম পরিবর্তন করুন' : 'Change Website Color Theme'}
              >
                <Palette className="w-3.5 h-3.5 text-zinc-600" />
                <span className="hidden sm:inline">
                  {language === 'bn' ? 'থিম' : 'Theme'}
                </span>
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block border border-black/20 shrink-0" 
                  style={{ backgroundColor: THEME_OPTIONS.find(t => t.key === theme)?.iconBg || '#18181b' }}
                />
              </button>

              {isThemeOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1 flex items-center justify-between">
                    <span>{language === 'bn' ? 'কালার থিম নির্বাচন করুন' : 'Select Color Theme'}</span>
                    <Palette className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  {THEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        onSetTheme(opt.key);
                        setIsThemeOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                        theme === opt.key ? 'bg-zinc-100 font-bold text-zinc-900' : 'hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-3.5 h-3.5 rounded-full inline-block border border-zinc-300 shrink-0" 
                          style={{ backgroundColor: opt.iconBg }}
                        />
                        <span>{language === 'bn' ? opt.nameBn : opt.nameEn}</span>
                      </div>
                      {theme === opt.key && <span className="text-zinc-900 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. BANGLA & ENGLISH LANGUAGE TOGGLE - RIGHT BESIDE PRINT */}
            <div 
              className="inline-flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 shrink-0"
              title={language === 'bn' ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
            >
              <button
                type="button"
                onClick={() => onSetLanguage('bn')}
                className={`px-2 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-all ${
                  language === 'bn' 
                    ? 'bg-white text-zinc-900 shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onSetLanguage('en')}
                className={`px-2 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-all ${
                  language === 'en' 
                    ? 'bg-white text-zinc-900 shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                EN
              </button>
            </div>

            {/* 3. PRINT BUTTON */}
            <button
              onClick={onPrint}
              className="inline-flex items-center p-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 shrink-0"
              title={language === 'bn' ? 'রিপোর্ট প্রিন্ট করুন' : 'Print Report'}
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
            <span className="truncate">{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
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
            <span className="truncate">{language === 'bn' ? 'তারিখ ও পিরিয়ড' : 'Period View'}</span>
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
            <span className="truncate">{language === 'bn' ? 'প্রেস ও ডিউ হিসাব' : 'Accounts & Dues'}</span>
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
            <span className="truncate">{language === 'bn' ? 'ডাটা এন্ট্রি' : 'Data Entry'}</span>
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
            <span className="truncate">{language === 'bn' ? 'বই তালিকা' : 'Books'}</span>
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
            <span className="truncate">{language === 'bn' ? 'ম্যাট্রিক্স শিট' : 'Matrix'}</span>
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
            <span className="truncate">{language === 'bn' ? 'রিপোর্ট ও প্রিন্ট' : 'Reports & Print'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
