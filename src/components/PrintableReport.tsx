import React, { useState } from 'react';
import { 
  Printer, 
  BookOpen, 
  Download, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Layers,
  Clock,
  TrendingUp,
  Filter,
  CreditCard,
  HandCoins,
  Globe,
  Store,
  CheckSquare,
  Square,
  Settings2,
  FileText,
  Receipt,
  Search,
  Building2,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { ImageViewerModal } from './ImageViewerModal';
import { BookRecord, PressPaymentRecord, ChannelCollectionRecord, PressOrderRecord, PressDeliveryRecord, ChannelConfig, DEFAULT_CHANNELS } from '../types/book';
import { 
  calculateBookMetrics, 
  calculateDayBreakdown, 
  calculateWeekBreakdowns, 
  calculateWeekBookBreakdown,
  calculatePressAccounts,
  calculateChannelDueAccounts,
  formatBDT, 
  formatNumber,
  formatMonthYearBengali,
  formatYearBengali,
  QUARTER_OPTIONS,
  HALF_YEAR_OPTIONS,
  AVAILABLE_YEARS
} from '../utils/calculations';
import { exportBooksToExcel } from '../utils/excelHandler';
import { exportReportToExcel } from '../utils/excelReportHandler';
import { exportReportToWord } from '../utils/wordHandler';
import { Language, tr } from '../utils/i18n';

interface PrintableReportProps {
  books: BookRecord[];
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
  pressPayments?: PressPaymentRecord[];
  pressOrders?: PressOrderRecord[];
  pressDeliveries?: PressDeliveryRecord[];
  channelCollections?: ChannelCollectionRecord[];
  initialSelectedBookId?: string;
  initialScope?: PrintScope;
  initialLibraryFilter?: string;
  language?: Language;
  channels?: ChannelConfig[];
}

export type ReportType = 'monthly' | 'daily' | 'weekly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
export type PrintScope = 'all' | 'press' | 'online' | 'offline' | 'sales_due' | 'press_vouchers' | 'collection_vouchers' | 'custom';
export type SalesMode = 'all' | 'online' | 'offline' | 'none';

export const PrintableReport: React.FC<PrintableReportProps> = ({ 
  books,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
  pressPayments = [],
  pressOrders = [],
  pressDeliveries = [],
  channelCollections = [],
  initialSelectedBookId,
  initialScope,
  initialLibraryFilter,
  language = 'en',
  channels = DEFAULT_CHANNELS,
}) => {
  const effectiveChannels = channels && channels.length > 0 ? channels : DEFAULT_CHANNELS;
  // Time period filter state
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('q4');
  const [selectedHalfYear, setSelectedHalfYear] = useState<string>('h2');
  const [reportYear, setReportYear] = useState<number>(selectedYear);

  const [customStartDate, setCustomStartDate] = useState<string>(
    `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  );

  // Book Selection State: 'all' | 'single' | 'multiple'
  const [bookSelectionMode, setBookSelectionMode] = useState<'all' | 'single' | 'multiple'>(() => {
    return initialSelectedBookId ? 'single' : 'all';
  });

  const [selectedSingleBookId, setSelectedSingleBookId] = useState<string>(() => {
    if (initialSelectedBookId && books.some(b => b.id === initialSelectedBookId)) {
      return initialSelectedBookId;
    }
    return books[0]?.id || '';
  });

  const [selectedMultipleBookIds, setSelectedMultipleBookIds] = useState<string[]>(() => {
    if (initialSelectedBookId) {
      return [initialSelectedBookId];
    }
    return books.map(b => b.id);
  });

  // Keep single and multi-selection in sync when initialSelectedBookId changes
  React.useEffect(() => {
    if (initialSelectedBookId && books.some(b => b.id === initialSelectedBookId)) {
      setBookSelectionMode('single');
      setSelectedSingleBookId(initialSelectedBookId);
      setSelectedMultipleBookIds([initialSelectedBookId]);
    }
  }, [initialSelectedBookId, books]);

  // Derive Effective Books based on selection
  const effectiveBooks = React.useMemo(() => {
    if (books.length === 0) return [];
    if (bookSelectionMode === 'single') {
      const found = books.find(b => b.id === selectedSingleBookId);
      return found ? [found] : [books[0]];
    }
    if (bookSelectionMode === 'multiple') {
      const selected = books.filter(b => selectedMultipleBookIds.includes(b.id));
      return selected.length > 0 ? selected : books;
    }
    return books;
  }, [books, bookSelectionMode, selectedSingleBookId, selectedMultipleBookIds]);

  // Selective Printing Controls (প্রেস, অনলাইন, অফলাইন আলাদা বা একসাথে)
  const [scope, setScope] = useState<PrintScope>(() => initialScope || 'all');
  const [salesMode, setSalesMode] = useState<SalesMode>('all');
  const [includePressAccounts, setIncludePressAccounts] = useState<boolean>(true);
  const [includePressPayments, setIncludePressPayments] = useState<boolean>(true);
  const [includeOnlineDue, setIncludeOnlineDue] = useState<boolean>(true);
  const [includeOfflineDue, setIncludeOfflineDue] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [showCustomSettings, setShowCustomSettings] = useState<boolean>(false);
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [voucherLayoutMode, setVoucherLayoutMode] = useState<'table' | 'slips'>('table');
  const [voucherSearchQuery, setVoucherSearchQuery] = useState<string>('');
  const [selectedLibraryFilter, setSelectedLibraryFilter] = useState<string>(() => initialLibraryFilter || 'all');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const openImagePreview = (url?: string, title = 'ভাউচার কপি', subtitle?: string) => {
    if (!url) return;
    setPreviewImage({ url, title, subtitle });
  };

  // Handler for Preset Scope Selection
  const handleSelectScope = (newScope: PrintScope) => {
    setScope(newScope);
    if (newScope === 'all') {
      setSalesMode('all');
      setIncludePressAccounts(true);
      setIncludePressPayments(true);
      setIncludeOnlineDue(true);
      setIncludeOfflineDue(true);
    } else if (newScope === 'press') {
      setSalesMode('none');
      setIncludePressAccounts(true);
      setIncludePressPayments(true);
      setIncludeOnlineDue(false);
      setIncludeOfflineDue(false);
    } else if (newScope === 'online') {
      setSalesMode('online');
      setIncludePressAccounts(false);
      setIncludePressPayments(false);
      setIncludeOnlineDue(true);
      setIncludeOfflineDue(false);
    } else if (newScope === 'offline') {
      setSalesMode('offline');
      setIncludePressAccounts(false);
      setIncludePressPayments(false);
      setIncludeOnlineDue(false);
      setIncludeOfflineDue(true);
    } else if (newScope === 'sales_due') {
      setSalesMode('all');
      setIncludePressAccounts(false);
      setIncludePressPayments(false);
      setIncludeOnlineDue(true);
      setIncludeOfflineDue(true);
    } else if (newScope === 'press_vouchers') {
      setSalesMode('none');
      setIncludePressAccounts(false);
      setIncludePressPayments(true);
      setIncludeOnlineDue(false);
      setIncludeOfflineDue(false);
    } else if (newScope === 'collection_vouchers') {
      setSalesMode('none');
      setIncludePressAccounts(false);
      setIncludePressPayments(false);
      setIncludeOnlineDue(false);
      setIncludeOfflineDue(false);
    }
  };

  // Keep scope and libraryFilter in sync with incoming props
  React.useEffect(() => {
    if (initialScope) {
      handleSelectScope(initialScope);
    }
  }, [initialScope]);

  React.useEffect(() => {
    if (initialLibraryFilter) {
      setSelectedLibraryFilter(initialLibraryFilter);
    }
  }, [initialLibraryFilter]);

  const currentDate = language === 'en'
    ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

  // Press accounts and Channel Dues for Effective Books
  const pressAccounts = calculatePressAccounts(effectiveBooks, pressPayments, pressOrders);
  const channelAccounts = calculateChannelDueAccounts(effectiveBooks, channelCollections, effectiveChannels);

  // Filtered Press Payments for Effective Books
  const filteredPressPayments = React.useMemo(() => {
    return pressPayments.filter(p => {
      if (!p.bookId) return true;
      return effectiveBooks.some(b => b.id === p.bookId);
    });
  }, [pressPayments, effectiveBooks]);

  // Helper to chunk items strictly into groups of size (default 10)
  const chunkArray = <T,>(arr: T[], size: number = 10): T[][] => {
    if (arr.length === 0) return [[]];
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // Searched Press Payments
  const searchedPressPayments = React.useMemo(() => {
    const q = voucherSearchQuery.trim().toLowerCase();
    if (!q) return filteredPressPayments;
    return filteredPressPayments.filter(p => 
      (p.voucherNo && p.voucherNo.toLowerCase().includes(q)) ||
      (p.bookName && p.bookName.toLowerCase().includes(q)) ||
      (p.date && p.date.includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q))
    );
  }, [filteredPressPayments, voucherSearchQuery]);

  // Searched Channel Collections
  const searchedChannelCollections = React.useMemo(() => {
    const q = voucherSearchQuery.trim().toLowerCase();
    if (!q) return channelCollections;
    return channelCollections.filter(c => 
      (c.receiptNo && c.receiptNo.toLowerCase().includes(q)) ||
      (c.channelName && c.channelName.toLowerCase().includes(q)) ||
      (c.date && c.date.includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q)) ||
      (c.paymentMethod && c.paymentMethod.toLowerCase().includes(q))
    );
  }, [channelCollections, voucherSearchQuery]);

  // Library / Channel Options for Collection Voucher filtering
  const availableLibraries = React.useMemo(() => {
    const map = new Map<string, { key: string; name: string; nameEn?: string; type: 'online' | 'offline'; count: number; totalAmount: number }>();
    
    // Seed from effectiveChannels
    effectiveChannels.forEach(ch => {
      map.set(ch.id, {
        key: ch.id,
        name: ch.name,
        nameEn: ch.nameEn,
        type: ch.type,
        count: 0,
        totalAmount: 0,
      });
    });

    // Calculate actual counts & amounts from all channelCollections
    channelCollections.forEach(c => {
      const key = c.channelKey || 'other';
      let existing = map.get(key);
      if (!existing && c.channelName) {
        existing = Array.from(map.values()).find(item => item.name === c.channelName || (item.nameEn && item.nameEn === c.channelName));
      }
      if (existing) {
        existing.count += 1;
        existing.totalAmount += (Number(c.amount) || 0);
      } else {
        map.set(key, {
          key,
          name: c.channelName || key,
          type: (['boibari', 'rokomari', 'wafilife', 'othersOnline'].includes(key) || key.toLowerCase().includes('online')) ? 'online' : 'offline',
          count: 1,
          totalAmount: Number(c.amount) || 0,
        });
      }
    });

    return Array.from(map.values());
  }, [effectiveChannels, channelCollections]);

  // Searched and Library-Filtered Channel Collections
  const libraryFilteredCollections = React.useMemo(() => {
    if (selectedLibraryFilter === 'all' || selectedLibraryFilter === 'split_libraries') {
      return searchedChannelCollections;
    }
    const targetLib = availableLibraries.find(l => l.key === selectedLibraryFilter);
    return searchedChannelCollections.filter(c => 
      c.channelKey === selectedLibraryFilter || 
      (targetLib && (c.channelName === targetLib.name || (targetLib.nameEn && c.channelName === targetLib.nameEn)))
    );
  }, [searchedChannelCollections, selectedLibraryFilter, availableLibraries]);

  // Filtered Channels for Dues Section
  const filteredChannels = channelAccounts.channels.filter(ch => {
    if (includeOnlineDue && includeOfflineDue) return true;
    if (includeOnlineDue && !includeOfflineDue) return ch.type === 'online';
    if (!includeOnlineDue && includeOfflineDue) return ch.type === 'offline';
    return false;
  });

  // Monthly totals for Effective Books
  const monthlyTotals = effectiveBooks.reduce(
    (acc, b) => {
      const m = calculateBookMetrics(b);
      acc.totalHOStock += m.totalPresentStockHO;
      acc.totalPressStock += m.stockToFaridBhai;
      acc.totalSold += m.totalSold;
      acc.totalOnlineSold += m.totalOnlineSell;
      acc.totalOfflineSold += m.totalOfflineSell;
      acc.totalRevenue += m.totalRevenue;
      acc.totalProfit += m.totalNetProfit;
      acc.totalReturns += m.totalReturns;
      acc.totalPromo += m.totalPromo;

      // Channel specific sales totals
      acc.boibari += m.boibariTotal;
      acc.rokomari += m.rokomariTotal;
      acc.wafilife += m.wafilifeTotal;
      acc.othersOnline += m.othersOnlineTotal;
      acc.hoOffline += m.headOfficeOfflineTotal;
      acc.nilkhet += m.nilkhetTotal;
      acc.sumona += m.sumonaTotal;
      acc.promise += m.promiseTotal;
      acc.joystar += m.joystarTotal;
      return acc;
    },
    {
      totalHOStock: 0,
      totalPressStock: 0,
      totalSold: 0,
      totalOnlineSold: 0,
      totalOfflineSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalReturns: 0,
      totalPromo: 0,
      boibari: 0,
      rokomari: 0,
      wafilife: 0,
      othersOnline: 0,
      hoOffline: 0,
      nilkhet: 0,
      sumona: 0,
      promise: 0,
      joystar: 0,
    }
  );

  // Daily breakdown
  const dayData = calculateDayBreakdown(effectiveBooks, selectedDay);

  // Weekly breakdown
  const weekList = calculateWeekBreakdowns(effectiveBooks, daysInMonth);
  const currentWeek = weekList.find(w => w.weekNumber === selectedWeek) || weekList[0];
  const weekBooks = calculateWeekBookBreakdown(effectiveBooks, currentWeek.startDay, currentWeek.endDay);

  const currentQuarter = QUARTER_OPTIONS.find(q => q.key === selectedQuarter) || QUARTER_OPTIONS[3];
  const currentHalf = HALF_YEAR_OPTIONS.find(h => h.key === selectedHalfYear) || HALF_YEAR_OPTIONS[1];

  // Dynamic Report Sub-title
  const getReportScopeTitle = () => {
    let base = '';
    if (scope === 'press') {
      base = tr(
        'ফরিদ ভাই প্রেস হিসাব, চালান মূল্য, পেমেন্ট ভাউচার ও বকেয়া ব্যালেন্স বিবরণী প্রতিবেদন',
        'Farid Bhai Press Accounts, Invoices, Payment Vouchers & Due Balance Report',
        language
      );
    } else if (scope === 'online') {
      base = tr(
        'অনলাইন সেলস চ্যানেল (বইবাড়ি, রকমারি, ওয়াফিলাইফ ও অন্যান্য) বিক্রয় ও ডিউ কালেকশন খতিয়ান',
        'Online Sales Channels (Boibari, Rokomari, Wafilife & Others) Sales & Due Collection Ledger',
        language
      );
    } else if (scope === 'offline') {
      base = tr(
        'অফলাইন কাউন্টার ও ডিলার লাইব্রেরি (সুমনা, প্রমিজ, জয়স্টার, নীলক্ষেত) সেলস ও ডিউ খতিয়ান',
        'Offline Counter & Dealer Libraries (Sumona, Promise, Joystar, Nilkhet) Sales & Due Ledger',
        language
      );
    } else if (scope === 'sales_due') {
      base = tr(
        'অনলাইন ও অফলাইন চ্যানেল বিক্রয়, রাজস্ব ও ডিউ কালেকশন খতিয়ান প্রতিবেদন',
        'Online & Offline Channels Sales, Revenue & Due Collection Report',
        language
      );
    } else if (scope === 'press_vouchers') {
      base = tr(
        'ফরিদ ভাই প্রেস পেমেন্ট ভাউচার (প্রতি পৃষ্ঠায় ১০টি ভাউচার)',
        'Farid Bhai Press Payment Vouchers (10 Vouchers per Page)',
        language
      );
    } else if (scope === 'collection_vouchers') {
      base = tr(
        'অনলাইন ও লাইব্রেরি আদায় ভাউচার / মানি রিসিট (প্রতি পৃষ্ঠায় ১০টি ভাউচার)',
        'Online & Library Collection Vouchers (10 Vouchers per Page)',
        language
      );
      if (selectedLibraryFilter === 'split_libraries') {
        base += ` • [${tr('লাইব্রেরি ভিত্তিক পৃথক পৃষ্ঠা', 'Separate Page per Library', language)}]`;
      } else if (selectedLibraryFilter !== 'all') {
        const targetLib = availableLibraries.find(l => l.key === selectedLibraryFilter);
        if (targetLib) {
          const libName = language === 'en' && targetLib.nameEn ? targetLib.nameEn : targetLib.name;
          base += ` • [${tr('লাইব্রেরি', 'Library', language)}: ${libName}]`;
        }
      }
    } else {
      base = tr(
        'সার্বিক বুক সেলস, স্টক ইনভেন্টরি, প্রেস হিসাব ও চ্যানেল ডিউ খতিয়ান প্রতিবেদন',
        'Comprehensive Book Sales, Stock Inventory, Press Accounts & Channel Due Report',
        language
      );
    }

    if (bookSelectionMode === 'single' && effectiveBooks[0]) {
      return `${base} • [${tr('একক বই', 'Single Book', language)}: ${effectiveBooks[0].bookName}]`;
    }
    if (bookSelectionMode === 'multiple' && effectiveBooks.length < books.length) {
      return `${base} • [${tr(`নির্বাচিত ${effectiveBooks.length} টি বইয়ের সমন্বিত রিপোর্ট`, `Combined Report for ${effectiveBooks.length} Selected Books`, language)}]`;
    }
    return base;
  };

  const getReportPeriodTitle = () => {
    if (reportType === 'daily') return tr(`তারিখ: ${selectedDay} ${formatMonthYearBengali(selectedMonth, selectedYear, language)}`, `Date: Day ${selectedDay}, ${formatMonthYearBengali(selectedMonth, selectedYear, language)}`, language);
    if (reportType === 'weekly') return `${currentWeek.name} (${currentWeek.startDay} - ${currentWeek.endDay} ${formatMonthYearBengali(selectedMonth, selectedYear, language)})`;
    if (reportType === 'monthly') return `${formatMonthYearBengali(selectedMonth, selectedYear, language)}`;
    if (reportType === 'quarterly') return `${currentQuarter.label} - ${formatYearBengali(reportYear, language)}`;
    if (reportType === 'half_yearly') return `${currentHalf.label} - ${formatYearBengali(reportYear, language)}`;
    if (reportType === 'yearly') return tr(`${formatYearBengali(reportYear, language)} সালের বার্ষিক খতিয়ান`, `Annual Report for Year ${formatYearBengali(reportYear, language)}`, language);
    if (reportType === 'custom') return `${customStartDate} - ${customEndDate}`;
    return '';
  };

  const handleExportWordDocx = async () => {
    try {
      setIsExportingWord(true);
      await exportReportToWord({
        books: effectiveBooks,
        allBooksCount: books.length,
        reportTitle: getReportScopeTitle(),
        periodTitle: getReportPeriodTitle(),
        currentDate,
        language,
        channels: effectiveChannels,
        pressPayments: filteredPressPayments,
        pressOrders,
        pressDeliveries,
        channelCollections: (scope === 'collection_vouchers' && selectedLibraryFilter !== 'all' && selectedLibraryFilter !== 'split_libraries')
          ? libraryFilteredCollections
          : channelCollections,
        salesMode,
        includePressAccounts,
        includePressPayments,
        includeOnlineDue,
        includeOfflineDue,
        includeSignatures,
        scope,
      });
    } catch (error) {
      console.error('Failed to export Word document:', error);
      alert(language === 'en' ? 'Failed to generate Word document. Please try again.' : 'ওয়ার্ড ফাইল তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await exportReportToExcel({
        books: effectiveBooks,
        allBooksCount: books.length,
        reportTitle: getReportScopeTitle(),
        periodTitle: getReportPeriodTitle(),
        currentDate,
        language,
        channels: effectiveChannels,
        pressPayments: filteredPressPayments,
        pressOrders,
        pressDeliveries,
        channelCollections: (scope === 'collection_vouchers' && selectedLibraryFilter !== 'all' && selectedLibraryFilter !== 'split_libraries')
          ? libraryFilteredCollections
          : channelCollections,
        salesMode,
        includePressAccounts,
        includePressPayments,
        includeOnlineDue,
        includeOfflineDue,
        includeSignatures,
        scope,
      });
    } catch (error) {
      console.error('Failed to export Excel report:', error);
      alert(language === 'en' ? 'Failed to generate Excel report. Please try again.' : 'এক্সেল ফাইল তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // ========================================================
  // RENDER: Press Payment Vouchers (Strictly 10 per page)
  // ========================================================
  const renderPressVoucherPages = () => {
    const chunks = chunkArray(searchedPressPayments, 10);
    const totalPages = chunks.length;

    return (
      <div className="w-full max-w-6xl mx-auto space-y-8 print:space-y-0 print:max-w-none">
        {chunks.map((chunk, pageIndex) => {
          // Exactly 10 slots per page
          const pageRows: (PressPaymentRecord | undefined)[] = [...chunk];
          while (pageRows.length < 10) {
            pageRows.push(undefined);
          }

          const pageSubtotal = chunk.reduce((sum, p) => sum + (p?.amount || 0), 0);
          const isLastPage = pageIndex === totalPages - 1;

          return (
            <div
              key={`press-page-${pageIndex}`}
              className={`print-page-container voucher-page bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-xs min-h-[260mm] flex flex-col justify-between print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none ${
                !isLastPage ? 'break-after-page page-break-after mb-8 print:mb-0' : ''
              }`}
            >
              {/* Page Header */}
              <div>
                <div className="border-b-2 border-zinc-900 pb-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-zinc-900 leading-tight">
                        {tr('বিদ্যাবাড়ি পাবলিকেশন', 'Biddabari Publication', language)}
                      </h1>
                      <p className="text-[11px] text-zinc-500">
                        {tr('প্রধান কার্যালয়, ঢাকা • বুক পাবলিকেশন অ্যান্ড ডিস্ট্রিবিউশন ডিপার্টমেন্ট', 'Head Office, Dhaka • Book Publication & Distribution Dept.', language)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-zinc-900 text-white text-[11px] px-3 py-0.5 rounded-full font-bold">
                      🧾 {tr('ফরিদ ভাই প্রেস পেমেন্ট ভাউচার', 'Farid Bhai Press Payment Vouchers', language)}
                    </span>
                    <div className="text-[11px] text-zinc-600 font-medium mt-1">
                      <span>{tr('পৃষ্ঠা:', 'Page:', language)} <b className="font-mono text-zinc-900 font-bold">{formatNumber(pageIndex + 1, language)}</b> / <b className="font-mono text-zinc-900 font-bold">{formatNumber(totalPages, language)}</b></span>
                      <span className="mx-2">•</span>
                      <span>{tr('তারিখ:', 'Date:', language)} <b>{currentDate}</b></span>
                    </div>
                  </div>
                </div>

                {/* Subtitle / Period Banner */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 mb-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800">
                    {tr('হিসাব খাত: ফরিদ ভাই প্রেস (ছাপা ও বাঁধাই পেমেন্ট ভাউচার)', 'Account: Farid Bhai Press (Printing & Binding Payment Vouchers)', language)}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-zinc-600">
                    {tr('প্রতি পৃষ্ঠায় ১০টি ভাউচার', '10 Vouchers per page', language)} • {getReportPeriodTitle()}
                  </span>
                </div>

                {/* Voucher Content: Table or Slips */}
                {voucherLayoutMode === 'table' ? (
                  <div className="overflow-x-auto w-full border border-zinc-300 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-100 border-b-2 border-zinc-900 text-zinc-900 font-bold text-[11px]">
                          <th className="py-2 px-2 text-center w-10 border-r border-zinc-300">{tr('ক্রমিক', 'SL', language)}</th>
                          <th className="py-2 px-2.5 w-24 text-center border-r border-zinc-300">{tr('তারিখ', 'Date', language)}</th>
                          <th className="py-2 px-2.5 w-28 border-r border-zinc-300">{tr('ভাউচার নং', 'Voucher No', language)}</th>
                          <th className="py-2 px-3 border-r border-zinc-300">{tr('খাত / বইয়ের নাম ও সংস্করণ', 'Category / Book Name & Edition', language)}</th>
                          <th className="py-2 px-2 text-center w-20 border-r border-zinc-300">{tr('মাধ্যম', 'Method', language)}</th>
                          <th className="py-2 px-3 border-r border-zinc-300">{tr('বিবরণ ও রেফারেন্স', 'Notes & Ref', language)}</th>
                          <th className="py-2 px-3 text-right w-28 border-r border-zinc-300">{tr('পরিশোধিত টাকা (৳)', 'Amount (BDT)', language)}</th>
                          <th className="py-2 px-3 text-center w-24">{tr('গ্রহীতার স্বাক্ষর', 'Receiver Sign', language)}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {pageRows.map((p, rowIdx) => {
                          const itemNumber = pageIndex * 10 + rowIdx + 1;
                          if (p) {
                            return (
                              <tr key={p.id || rowIdx} className="h-10 hover:bg-zinc-50/50">
                                <td className="py-1.5 px-2 text-center font-mono font-bold text-zinc-700 border-r border-zinc-200">
                                  {formatNumber(itemNumber, language)}
                                </td>
                                <td className="py-1.5 px-2.5 text-center font-mono text-zinc-900 border-r border-zinc-200 text-[11px]">
                                  {p.date}
                                </td>
                                <td className="py-1.5 px-2.5 font-mono font-bold text-zinc-900 border-r border-zinc-200 text-[11px]">
                                  <div className="flex items-center gap-1 justify-between">
                                    <span>{p.voucherNo || `VCH-${itemNumber}`}</span>
                                    {p.voucherImage && (
                                      <button
                                        type="button"
                                        onClick={() => openImagePreview(p.voucherImage, `${p.bookName || tr('প্রেস পেমেন্ট', 'Press Payment', language)} (${p.voucherNo || 'ভাউচার'})`, `${p.date} • ${formatBDT(p.amount, language)}`)}
                                        className="print:hidden p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                        title={tr('ভাউচারের ছবি দেখুন', 'View Voucher Image', language)}
                                      >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1.5 px-3 font-semibold text-zinc-900 border-r border-zinc-200 text-[11px]">
                                  {p.bookName || tr('সার্বিক প্রেস অর্ডার বাবদ', 'General Press Order', language)}
                                </td>
                                <td className="py-1.5 px-2 text-center uppercase font-mono text-[10px] text-zinc-700 border-r border-zinc-200">
                                  {p.paymentMethod}
                                </td>
                                <td className="py-1.5 px-3 text-zinc-600 border-r border-zinc-200 text-[11px]">
                                  {p.notes || '—'}
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-zinc-900 border-r border-zinc-200">
                                  {formatBDT(p.amount, language)}
                                </td>
                                <td className="py-1.5 px-3 text-center">
                                  <span className="inline-block border-b border-zinc-300 w-16 text-[9px] text-zinc-300"></span>
                                </td>
                              </tr>
                            );
                          } else {
                            return (
                              <tr key={`blank-${rowIdx}`} className="h-10 text-zinc-300">
                                <td className="py-1.5 px-2 text-center font-mono text-zinc-400 border-r border-zinc-200">
                                  {formatNumber(itemNumber, language)}
                                </td>
                                <td className="py-1.5 px-2.5 text-center border-r border-zinc-200 font-mono text-zinc-300">—</td>
                                <td className="py-1.5 px-2.5 border-r border-zinc-200 font-mono text-zinc-300">—</td>
                                <td className="py-1.5 px-3 border-r border-zinc-200 text-zinc-300 italic text-[11px]">
                                  {tr('(ফাঁকা ভাউচার লাইন)', '(Blank Voucher Line)', language)}
                                </td>
                                <td className="py-1.5 px-2 text-center border-r border-zinc-200 font-mono text-zinc-300">—</td>
                                <td className="py-1.5 px-3 border-r border-zinc-200 text-zinc-300">—</td>
                                <td className="py-1.5 px-3 text-right border-r border-zinc-200 font-mono text-zinc-300">—</td>
                                <td className="py-1.5 px-3 text-center">
                                  <span className="inline-block border-b border-zinc-200 w-16"></span>
                                </td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-zinc-100 font-bold border-t-2 border-zinc-300 text-zinc-900 text-xs">
                          <td colSpan={6} className="py-2 px-3 text-right border-r border-zinc-300">
                            {tr('এই পৃষ্ঠার মোট পরিশোধ (Subtotal):', 'Page Subtotal:', language)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black border-r border-zinc-300 text-zinc-900">
                            {formatBDT(pageSubtotal, language)}
                          </td>
                          <td></td>
                        </tr>
                        {isLastPage && (
                          <tr className="bg-zinc-200 font-black border-t-2 border-zinc-900 text-zinc-900 text-xs">
                            <td colSpan={6} className="py-2.5 px-3 text-right border-r border-zinc-300">
                              {tr('সর্বমোট প্রেস পরিশোধ (Grand Total):', 'Grand Total Paid to Press:', language)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-sm border-r border-zinc-300 text-zinc-900">
                              {formatBDT(pressAccounts.totalPaidToPress, language)}
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  // Slips Format (2 cols x 5 rows = 10 slips per page)
                  <div className="grid grid-cols-2 gap-3 print:gap-2 my-2">
                    {pageRows.map((p, rowIdx) => {
                      const itemNumber = pageIndex * 10 + rowIdx + 1;
                      if (p) {
                        return (
                          <div 
                            key={p.id || rowIdx} 
                            className="border border-dashed border-zinc-400 rounded-xl p-2.5 bg-zinc-50/40 print:bg-white flex flex-col justify-between h-[45mm] print:h-[45mm] relative"
                          >
                            <div className="flex items-center justify-between border-b border-zinc-200 pb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
                                <span className="font-bold text-[11px] text-zinc-900">{tr('বিদ্যাবাড়ি পাবলিকেশন', 'Biddabari Publication', language)}</span>
                                <span className="text-[10px] text-zinc-500 font-medium">({tr('পেমেন্ট ভাউচার', 'Payment Voucher', language)})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[10px] px-1.5 py-0.2 bg-zinc-200 text-zinc-800 rounded font-bold">
                                  #{p.voucherNo || `VCH-${itemNumber}`}
                                </span>
                                {p.voucherImage && (
                                  <button
                                    type="button"
                                    onClick={() => openImagePreview(p.voucherImage, `${p.bookName || tr('প্রেস পেমেন্ট', 'Press Payment', language)} (${p.voucherNo || 'ভাউচার'})`, `${p.date} • ${formatBDT(p.amount, language)}`)}
                                    className="print:hidden p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                    title={tr('ভাউচারের ছবি দেখুন', 'View Voucher Image', language)}
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1 text-[11px] py-1">
                              <div>
                                <span className="text-[9px] text-zinc-500 block">{tr('প্রাপক:', 'Payee:', language)}</span>
                                <span className="font-bold text-zinc-900 block text-xs">{tr('ফরিদ ভাই প্রেস', 'Farid Bhai Press', language)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-zinc-500 block">{tr('তারিখ ও মাধ্যম:', 'Date & Method:', language)}</span>
                                <span className="font-mono text-zinc-800 font-semibold text-[10px]">{p.date} • <span className="uppercase">{p.paymentMethod}</span></span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[9px] text-zinc-500 block">{tr('বই / বিবরণ:', 'Book / Category:', language)}</span>
                                <span className="font-medium text-zinc-900 truncate block text-[11px]">{p.bookName || tr('সার্বিক প্রেস অর্ডার বাবদ', 'General Press Order', language)} {p.notes ? `(${p.notes})` : ''}</span>
                              </div>
                            </div>

                            <div className="pt-1 border-t border-zinc-200 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-zinc-400 block">{tr('পরিশোধিত টাকা:', 'Paid Amount:', language)}</span>
                                <span className="font-black text-sm text-zinc-900 font-mono">{formatBDT(p.amount, language)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[9px] text-zinc-500">
                                <div className="text-center">
                                  <div className="w-14 border-b border-zinc-300 mb-0.5"></div>
                                  <span>{tr('প্রস্তুতকারী', 'Prepared', language)}</span>
                                </div>
                                <div className="text-center">
                                  <div className="w-14 border-b border-zinc-300 mb-0.5"></div>
                                  <span>{tr('গ্রহীতা (প্রেস)', 'Receiver', language)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div 
                            key={`blank-slip-${rowIdx}`} 
                            className="border border-dashed border-zinc-300 rounded-xl p-2.5 bg-white flex flex-col justify-between h-[45mm] print:h-[45mm] relative opacity-60"
                          >
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-1">
                              <span className="font-bold text-[11px] text-zinc-700">{tr('বিদ্যাবাড়ি পাবলিকেশন (পেমেন্ট ভাউচার)', 'Biddabari Publication (Blank Voucher)', language)}</span>
                              <span className="font-mono text-[10px] text-zinc-400">#{itemNumber}</span>
                            </div>
                            <div className="text-center py-2 text-[10px] text-zinc-400 italic">
                              {tr('— ফাঁকা ভাউচার স্লিপ (হাতে লিখে ব্যবহারের জন্য) —', '— Blank voucher slip for manual entry —', language)}
                            </div>
                            <div className="pt-1 border-t border-zinc-100 flex items-center justify-between text-[9px] text-zinc-400">
                              <span>{tr('টাকা: ....................', 'Amount: ....................', language)}</span>
                              <span>{tr('স্বাক্ষর: ....................', 'Signature: ....................', language)}</span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>

              {/* Signatures at bottom of page */}
              {includeSignatures && (
                <div className="signature-block avoid-break pt-6 mt-6 border-t border-zinc-200">
                  <div className="grid grid-cols-3 gap-6 text-center text-xs text-zinc-600">
                    <div>
                      <div className="border-t border-zinc-400 w-32 mx-auto pt-1 mb-1"></div>
                      <span className="font-semibold block text-zinc-800">{tr('প্রস্তুতকারী / হিসাব সহকারী', 'Prepared By / Accounts Asst.', language)}</span>
                      <span className="text-[10px] text-zinc-400">{tr('বিদ্যাবাড়ি প্রকাশনা বিভাগ', 'Biddabari Publication Dept.', language)}</span>
                    </div>

                    <div>
                      <div className="border-t border-zinc-400 w-32 mx-auto pt-1 mb-1"></div>
                      <span className="font-semibold block text-zinc-800">{tr('হিসাবরক্ষণ কর্মকর্তা', 'Accounts Officer', language)}</span>
                      <span className="text-[10px] text-zinc-400">{tr('অ্যাকাউন্টিং অ্যান্ড ফিন্যান্স', 'Accounting & Finance', language)}</span>
                    </div>

                    <div>
                      <div className="border-t border-zinc-400 w-32 mx-auto pt-1 mb-1"></div>
                      <span className="font-semibold block text-zinc-800">{tr('গ্রহীতা (ফরিদ ভাই প্রেস)', 'Receiver (Farid Bhai Press)', language)}</span>
                      <span className="text-[10px] text-zinc-400">{tr('স্বাক্ষর ও তারিখ', 'Signature & Date', language)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ========================================================
  // RENDER: Channel Collection Vouchers (Strictly 10 per page, library-wise aware)
  // ========================================================
  // Helper to render an individual A4 Collection Voucher Page (10 items / page)
  const renderSingleCollectionPage = ({
    pageKey,
    chunk,
    pageIndex,
    totalPages,
    sectionTitle,
    badgeTitle,
    groupLabel,
    grandTotalAmount,
    isLastPageOfGroup,
    isLastPageOverall,
  }: {
    pageKey: string;
    chunk: (ChannelCollectionRecord | undefined)[];
    pageIndex: number;
    totalPages: number;
    sectionTitle: string;
    badgeTitle: string;
    groupLabel: string;
    grandTotalAmount: number;
    isLastPageOfGroup: boolean;
    isLastPageOverall: boolean;
  }) => {
    // Exactly 10 slots per page
    const pageRows: (ChannelCollectionRecord | undefined)[] = [...chunk];
    while (pageRows.length < 10) {
      pageRows.push(undefined);
    }

    const pageSubtotal = chunk.reduce((sum, c) => sum + (c?.amount || 0), 0);

    const getChannelType = (key: string, name: string) => {
      const ch = effectiveChannels.find(c => c.id === key || c.name === name);
      if (ch) return ch.type;
      if (['boibari', 'rokomari', 'wafilife', 'othersOnline'].includes(key) || key.toLowerCase().includes('online')) return 'online';
      return 'offline';
    };

    return (
      <div
        key={pageKey}
        className={`print-page-container voucher-page bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-xs min-h-[260mm] flex flex-col justify-between print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none ${
          !isLastPageOverall ? 'break-after-page page-break-after mb-8 print:mb-0' : ''
        }`}
      >
        {/* Page Header */}
        <div>
          <div className="border-b-2 border-zinc-900 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-zinc-900 leading-tight">
                  {tr('বিদ্যাবাড়ি পাবলিকেশন', 'Biddabari Publication', language)}
                </h1>
                <p className="text-[11px] text-zinc-500">
                  {tr('প্রধান কার্যালয়, ঢাকা • বুক পাবলিকেশন অ্যান্ড ডিস্ট্রিবিউশন ডিপার্টমেন্ট', 'Head Office, Dhaka • Book Publication & Distribution Dept.', language)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-zinc-900 text-white text-[11px] px-3 py-0.5 rounded-full font-bold">
                {badgeTitle}
              </span>
              <div className="text-[11px] text-zinc-600 font-medium mt-1">
                <span>{tr('পৃষ্ঠা:', 'Page:', language)} <b className="font-mono text-zinc-900 font-bold">{formatNumber(pageIndex + 1, language)}</b> / <b className="font-mono text-zinc-900 font-bold">{formatNumber(totalPages, language)}</b></span>
                <span className="mx-2">•</span>
                <span>{tr('তারিখ:', 'Date:', language)} <b>{currentDate}</b></span>
              </div>
            </div>
          </div>

          {/* Subtitle / Period Banner */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800">
              {sectionTitle}
            </span>
            <span className="text-[11px] font-mono font-bold text-zinc-600">
              {tr('প্রতি পৃষ্ঠায় ১০টি ভাউচার', '10 Vouchers per page', language)} • {getReportPeriodTitle()}
            </span>
          </div>

          {/* Voucher Content: Table or Slips */}
          {voucherLayoutMode === 'table' ? (
            <div className="overflow-x-auto w-full border border-zinc-300 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 border-b-2 border-zinc-900 text-zinc-900 font-bold text-[11px]">
                    <th className="py-2 px-2 text-center w-10 border-r border-zinc-300">{tr('ক্রমিক', 'SL', language)}</th>
                    <th className="py-2 px-2.5 w-24 text-center border-r border-zinc-300">{tr('তারিখ', 'Date', language)}</th>
                    <th className="py-2 px-2.5 w-28 border-r border-zinc-300">{tr('মানি রিসিট নং', 'Receipt No', language)}</th>
                    <th className="py-2 px-3 border-r border-zinc-300">{tr('চ্যানেল / লাইব্রেরির নাম', 'Channel / Library Name', language)}</th>
                    <th className="py-2 px-2 text-center w-20 border-r border-zinc-300">{tr('ধরন', 'Type', language)}</th>
                    <th className="py-2 px-2 text-center w-20 border-r border-zinc-300">{tr('মাধ্যম', 'Method', language)}</th>
                    <th className="py-2 px-3 border-r border-zinc-300">{tr('বিবরণ ও নোট', 'Notes & Ref', language)}</th>
                    <th className="py-2 px-3 text-right w-28 border-r border-zinc-300">{tr('আদায়কৃত টাকা (৳)', 'Amount (BDT)', language)}</th>
                    <th className="py-2 px-3 text-center w-24">{tr('আদায়কারীর স্বাক্ষর', 'Collector Sign', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {pageRows.map((c, rowIdx) => {
                    const itemNumber = pageIndex * 10 + rowIdx + 1;
                    if (c) {
                      const cType = getChannelType(c.channelKey, c.channelName);
                      return (
                        <tr key={c.id || rowIdx} className="h-10 hover:bg-zinc-50/50">
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-zinc-700 border-r border-zinc-200">
                            {formatNumber(itemNumber, language)}
                          </td>
                          <td className="py-1.5 px-2.5 text-center font-mono text-zinc-900 border-r border-zinc-200 text-[11px]">
                            {c.date}
                          </td>
                          <td className="py-1.5 px-2.5 font-mono font-bold text-zinc-900 border-r border-zinc-200 text-[11px]">
                            <div className="flex items-center gap-1 justify-between">
                              <span>{c.receiptNo || `MR-${itemNumber}`}</span>
                              {(c.voucherImage || c.receiptImage) && (
                                <button
                                  type="button"
                                  onClick={() => openImagePreview(c.voucherImage || c.receiptImage, `${c.channelName} (${c.receiptNo || 'রশিদ'})`, `${c.date} • ${formatBDT(c.amount, language)}`)}
                                  className="print:hidden p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                  title={tr('মানি রিসিটের ছবি দেখুন', 'View Receipt Image', language)}
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-zinc-900 border-r border-zinc-200 text-[11px]">
                            {c.channelName}
                          </td>
                          <td className="py-1.5 px-2 text-center uppercase font-mono text-[10px] border-r border-zinc-200">
                            <span className={`px-1.5 py-0.2 rounded font-bold ${
                              cType === 'online' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            }`}>
                              {cType === 'online' ? tr('অনলাইন', 'Online', language) : tr('অফলাইন', 'Offline', language)}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center uppercase font-mono text-[10px] text-zinc-700 border-r border-zinc-200">
                            {c.paymentMethod}
                          </td>
                          <td className="py-1.5 px-3 text-zinc-600 border-r border-zinc-200 text-[11px]">
                            {c.notes || '—'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-zinc-900 border-r border-zinc-200">
                            {formatBDT(c.amount, language)}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <span className="inline-block border-b border-zinc-300 w-16 text-[9px] text-zinc-300"></span>
                          </td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key={`blank-${rowIdx}`} className="h-10 text-zinc-300">
                          <td className="py-1.5 px-2 text-center font-mono text-zinc-400 border-r border-zinc-200">
                            {formatNumber(itemNumber, language)}
                          </td>
                          <td className="py-1.5 px-2.5 text-center border-r border-zinc-200 font-mono text-zinc-300">—</td>
                          <td className="py-1.5 px-2.5 border-r border-zinc-200 font-mono text-zinc-300">—</td>
                          <td className="py-1.5 px-3 border-r border-zinc-200 text-zinc-300 italic text-[11px]">
                            {tr('(ফাঁকা মানি রিসিট লাইন)', '(Blank Receipt Line)', language)}
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-zinc-200 font-mono text-zinc-300">—</td>
                          <td className="py-1.5 px-2 text-center border-r border-zinc-200 font-mono text-zinc-300">—</td>
                          <td className="py-1.5 px-3 border-r border-zinc-200 text-zinc-300">—</td>
                          <td className="py-1.5 px-3 text-right border-r border-zinc-200 font-mono text-zinc-300">—</td>
                          <td className="py-1.5 px-3 text-center">
                            <span className="inline-block border-b border-zinc-200 w-16"></span>
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-bold border-t-2 border-zinc-300 text-zinc-900 text-xs">
                    <td colSpan={7} className="py-2 px-3 text-right border-r border-zinc-300">
                      {tr('এই পৃষ্ঠার মোট আদায় (Subtotal):', 'Page Subtotal:', language)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black border-r border-zinc-300 text-zinc-900">
                      {formatBDT(pageSubtotal, language)}
                    </td>
                    <td></td>
                  </tr>
                  {isLastPageOfGroup && (
                    <tr className="bg-zinc-200 font-black border-t-2 border-zinc-900 text-zinc-900 text-xs">
                      <td colSpan={7} className="py-2.5 px-3 text-right border-r border-zinc-300">
                        {tr(`সর্বমোট সংগৃহীত আদায় (${groupLabel}):`, `Grand Total Collected (${groupLabel}):`, language)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-sm border-r border-zinc-300 text-zinc-900">
                        {formatBDT(grandTotalAmount, language)}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          ) : (
            // Slips Format (2 cols x 5 rows = 10 slips per page)
            <div>
              <div className="grid grid-cols-2 gap-3 print:gap-2 my-2">
                {pageRows.map((c, rowIdx) => {
                  const itemNumber = pageIndex * 10 + rowIdx + 1;
                  if (c) {
                    const cType = getChannelType(c.channelKey, c.channelName);
                    return (
                      <div 
                        key={c.id || rowIdx} 
                        className="border border-dashed border-zinc-400 rounded-xl p-2.5 bg-zinc-50/40 print:bg-white flex flex-col justify-between h-[45mm] print:h-[45mm] relative"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
                            <span className="font-bold text-[11px] text-zinc-900">{tr('বিদ্যাবাড়ি পাবলিকেশন', 'Biddabari Publication', language)}</span>
                            <span className="text-[10px] text-zinc-500 font-medium">({tr('মানি রিসিট', 'Money Receipt', language)})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-zinc-200 text-zinc-800 rounded font-bold">
                              #{c.receiptNo || `MR-${itemNumber}`}
                            </span>
                            {(c.voucherImage || c.receiptImage) && (
                              <button
                                type="button"
                                onClick={() => openImagePreview(c.voucherImage || c.receiptImage, `${c.channelName} (${c.receiptNo || 'রশিদ'})`, `${c.date} • ${formatBDT(c.amount, language)}`)}
                                className="print:hidden p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title={tr('মানি রিসিটের ছবি দেখুন', 'View Receipt Image', language)}
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] py-1">
                          <div>
                            <span className="text-[9px] text-zinc-500 block">{tr('প্রাপ্তি চ্যানেল / লাইব্রেরি:', 'Channel / Library:', language)}</span>
                            <span className="font-bold text-zinc-900 block text-xs">{c.channelName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-zinc-500 block">{tr('তারিখ ও মাধ্যম:', 'Date & Method:', language)}</span>
                            <span className="font-mono text-zinc-800 font-semibold text-[10px]">{c.date} • <span className="uppercase">{c.paymentMethod}</span></span>
                          </div>
                          <div className="col-span-2 flex items-center justify-between">
                            <span className="text-[11px] text-zinc-600 truncate block">
                              {c.notes || tr('বই বিক্রয় বাবদ আদায়', 'Book sales collection', language)}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              cType === 'online' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                            }`}>
                              {cType === 'online' ? tr('অনলাইন', 'Online', language) : tr('অফলাইন', 'Offline', language)}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-zinc-200 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-zinc-400 block">{tr('আদায়কৃত টাকা:', 'Collected Amount:', language)}</span>
                            <span className="font-black text-sm text-zinc-900 font-mono">{formatBDT(c.amount, language)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] text-zinc-500">
                            <div className="text-center">
                              <div className="w-14 border-b border-zinc-300 mb-0.5"></div>
                              <span>{tr('আদায়কারী', 'Collector', language)}</span>
                            </div>
                            <div className="text-center">
                              <div className="w-14 border-b border-zinc-300 mb-0.5"></div>
                              <span>{tr('অনুমোদন', 'Authorized', language)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div 
                        key={`blank-slip-${rowIdx}`} 
                        className="border border-dashed border-zinc-300 rounded-xl p-2.5 bg-white flex flex-col justify-between h-[45mm] print:h-[45mm] relative opacity-60"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-1">
                          <span className="font-bold text-[11px] text-zinc-700">{tr('বিদ্যাবাড়ি পাবলিকেশন (মানি রিসিট)', 'Biddabari Publication (Blank Receipt)', language)}</span>
                          <span className="font-mono text-[10px] text-zinc-400">#{itemNumber}</span>
                        </div>
                        <div className="text-center py-2 text-[10px] text-zinc-400 italic">
                          {tr('— ফাঁকা মানি রিসিট স্লিপ (হাতে লিখে ব্যবহারের জন্য) —', '— Blank money receipt for manual entry —', language)}
                        </div>
                        <div className="pt-1 border-t border-zinc-100 flex items-center justify-between text-[9px] text-zinc-400">
                          <span>{tr('আদায়কৃত টাকা: ....................', 'Amount: ....................', language)}</span>
                          <span>{tr('স্বাক্ষর: ....................', 'Signature: ....................', language)}</span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {/* Slips Grand Total footer if last page of group */}
              {isLastPageOfGroup && (
                <div className="bg-zinc-100 border border-zinc-300 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold mt-2">
                  <span className="text-zinc-800">
                    {tr(`সর্বমোট সংগৃহীত আদায় (${groupLabel}):`, `Grand Total Collected (${groupLabel}):`, language)}
                  </span>
                  <span className="font-mono text-zinc-900 text-sm font-black">
                    {formatBDT(grandTotalAmount, language)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Signatures at bottom of page */}
        {includeSignatures && (
          <div className="signature-block avoid-break pt-6 mt-6 border-t border-zinc-200">
            <div className="grid grid-cols-3 gap-6 text-center text-xs text-zinc-600">
              <div>
                <div className="border-t border-zinc-400 w-32 mx-auto pt-1 mb-1"></div>
                <span className="font-semibold block text-zinc-800">{tr('আদায়কারী / ক্যাশিয়ার', 'Collector / Cashier', language)}</span>
                <span className="text-[10px] text-zinc-400">{tr('কালেকশন অ্যান্ড ক্যাশ বিভাগ', 'Collection & Cash Dept.', language)}</span>
              </div>

              <div>
                <div className="border-t border-zinc-400 w-32 mx-auto pt-1 mb-1"></div>
                <span className="font-semibold block text-zinc-800">{tr('হিসাবরক্ষণ কর্মকর্তা', 'Accounts Officer', language)}</span>
                <span className="text-[10px] text-zinc-400">{tr('অ্যাকাউন্টিং অ্যান্ড ফিন্যান্স', 'Accounting & Finance', language)}</span>
              </div>

              <div>
                <div className="border-t border-zinc-400 w-32 mx-auto pt-1 mb-1"></div>
                <span className="font-semibold block text-zinc-800">{tr('অনুমোদনকারী / পরিচালক', 'Approved By / Director', language)}</span>
                <span className="text-[10px] text-zinc-400">{tr('বিদ্যাবাড়ি পাবলিকেশন', 'Biddabari Publication', language)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCollectionVoucherPages = () => {
    // Mode 1: Split Libraries (Each library on its own separate page/pages with page breaks)
    if (selectedLibraryFilter === 'split_libraries') {
      const activeLibsWithCollections = availableLibraries.filter(lib => {
        return searchedChannelCollections.some(c => 
          c.channelKey === lib.key || 
          c.channelName === lib.name || 
          (lib.nameEn && c.channelName === lib.nameEn)
        );
      });

      if (activeLibsWithCollections.length === 0) {
        return (
          <div className="w-full max-w-6xl mx-auto space-y-8 print:space-y-0 print:max-w-none">
            {renderSingleCollectionPage({
              pageKey: 'split-lib-empty',
              chunk: [],
              pageIndex: 0,
              totalPages: 1,
              sectionTitle: tr('খাত: অনলাইন ও ডিলার লাইব্রেরি বিক্রয় আদায় ও জমা খতিয়ান', 'Category: Online & Dealer Libraries Sales Collection Ledger', language),
              badgeTitle: `💵 ${tr('অনলাইন ও লাইব্রেরি আদায় ভাউচার', 'Channel Collection Receipts', language)}`,
              groupLabel: tr('সকল চ্যানেল', 'All Channels', language),
              grandTotalAmount: 0,
              isLastPageOfGroup: true,
              isLastPageOverall: true,
            })}
          </div>
        );
      }

      return (
        <div className="w-full max-w-6xl mx-auto space-y-8 print:space-y-0 print:max-w-none">
          {activeLibsWithCollections.flatMap((lib, libIdx) => {
            const libVouchers = searchedChannelCollections.filter(c => 
              c.channelKey === lib.key || 
              c.channelName === lib.name || 
              (lib.nameEn && c.channelName === lib.nameEn)
            );
            const chunks = chunkArray(libVouchers, 10);
            const libTotalPages = Math.max(chunks.length, 1);
            const pagesToRender = chunks.length > 0 ? chunks : [[]];
            const libGrandTotal = libVouchers.reduce((s, c) => s + (Number(c.amount) || 0), 0);
            const libDisplayName = language === 'en' && lib.nameEn ? lib.nameEn : lib.name;

            return pagesToRender.map((chunk, pageIndex) => {
              const isLastPageOfGroup = pageIndex === pagesToRender.length - 1;
              const isLastPageOverall = (libIdx === activeLibsWithCollections.length - 1) && isLastPageOfGroup;

              return renderSingleCollectionPage({
                pageKey: `lib-${lib.key}-page-${pageIndex}`,
                chunk,
                pageIndex,
                totalPages: libTotalPages,
                sectionTitle: tr(`খাত: ${libDisplayName} বিক্রয় আদায় ও জমা খতিয়ান`, `Category: ${libDisplayName} Sales Collection Ledger`, language),
                badgeTitle: `💵 ${libDisplayName} ${tr('আদায় ভাউচার', 'Collection Receipts', language)}`,
                groupLabel: libDisplayName,
                grandTotalAmount: libGrandTotal,
                isLastPageOfGroup,
                isLastPageOverall,
              });
            });
          })}
        </div>
      );
    }

    // Mode 2: Specific Single Library Filter
    if (selectedLibraryFilter !== 'all') {
      const targetLib = availableLibraries.find(l => l.key === selectedLibraryFilter);
      const libDisplayName = targetLib ? (language === 'en' && targetLib.nameEn ? targetLib.nameEn : targetLib.name) : selectedLibraryFilter;
      const libVouchers = libraryFilteredCollections;
      const chunks = chunkArray(libVouchers, 10);
      const totalPages = Math.max(chunks.length, 1);
      const pagesToRender = chunks.length > 0 ? chunks : [[]];
      const libGrandTotal = libVouchers.reduce((s, c) => s + (Number(c.amount) || 0), 0);

      return (
        <div className="w-full max-w-6xl mx-auto space-y-8 print:space-y-0 print:max-w-none">
          {pagesToRender.map((chunk, pageIndex) => {
            const isLastPage = pageIndex === pagesToRender.length - 1;

            return renderSingleCollectionPage({
              pageKey: `single-lib-${selectedLibraryFilter}-page-${pageIndex}`,
              chunk,
              pageIndex,
              totalPages,
              sectionTitle: tr(`খাত: ${libDisplayName} বিক্রয় আদায় ও জমা খতিয়ান`, `Category: ${libDisplayName} Sales Collection Ledger`, language),
              badgeTitle: `💵 ${libDisplayName} ${tr('আদায় ভাউচার', 'Collection Receipts', language)}`,
              groupLabel: libDisplayName,
              grandTotalAmount: libGrandTotal,
              isLastPageOfGroup: isLastPage,
              isLastPageOverall: isLastPage,
            });
          })}
        </div>
      );
    }

    // Mode 3: All Libraries Combined
    const chunks = chunkArray(searchedChannelCollections, 10);
    const totalPages = Math.max(chunks.length, 1);
    const pagesToRender = chunks.length > 0 ? chunks : [[]];
    const overallGrandTotal = searchedChannelCollections.reduce((s, c) => s + (Number(c.amount) || 0), 0);

    return (
      <div className="w-full max-w-6xl mx-auto space-y-8 print:space-y-0 print:max-w-none">
        {pagesToRender.map((chunk, pageIndex) => {
          const isLastPage = pageIndex === pagesToRender.length - 1;

          return renderSingleCollectionPage({
            pageKey: `all-coll-page-${pageIndex}`,
            chunk,
            pageIndex,
            totalPages,
            sectionTitle: tr('খাত: অনলাইন ও ডিলার লাইব্রেরি বিক্রয় আদায় ও জমা খতিয়ান (সকল লাইব্রেরি)', 'Category: Online & Dealer Libraries Sales Collection Ledger (All Channels)', language),
            badgeTitle: `💵 ${tr('অনলাইন ও লাইব্রেরি আদায় ভাউচার / মানি রিসিট', 'Channel Collection Receipts', language)}`,
            groupLabel: tr('সকল চ্যানেল', 'All Channels', language),
            grandTotalAmount: overallGrandTotal,
            isLastPageOfGroup: isLastPage,
            isLastPageOverall: isLastPage,
          });
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* ======================================================== */}
      {/* Print Controls Bar (Hidden during printing) */}
      {/* ======================================================== */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4 max-w-6xl mx-auto w-full">
        
        {/* Top Header Row with Print & Export Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <span>{tr('অফিসিয়াল এক্সিকিউটিভ রিপোর্ট ও প্রিন্ট কনসোল', 'Official Executive Report & Print Console', language)}</span>
            </h2>
            <p className="text-xs text-zinc-500">
              {tr(
                'প্রেস হিসাব, অনলাইন সেলস, অফলাইন সেলস ও ডিউ খতিয়ান আলাদা আলাদা বা সমন্বিতভাবে প্রিন্ট করুন',
                'Print press accounts, online sales, offline sales, and dues separately or combined',
                language
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded-lg">
              📄 {tr('A4 সাইজ অটো-ফিট', 'A4 Size Auto-fit', language)}
            </span>

            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-300 disabled:opacity-50"
              title={tr('সাজানো এক্সেল ফাইল ডাউনলোড (.xlsx)', 'Download Styled Excel File (.xlsx)', language)}
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>
                {isExportingExcel
                  ? tr('ডাউনলোড হচ্ছে...', 'Downloading...', language)
                  : tr('এক্সেল ফাইল', 'Excel File', language)}
              </span>
            </button>

            <button
              onClick={handleExportWordDocx}
              disabled={isExportingWord}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-300 disabled:opacity-50"
              title={tr('ওয়ার্ড ফাইল ডাউনলোড (.docx)', 'Download Word File (.docx)', language)}
            >
              <Download className="w-4 h-4 text-zinc-700" />
              <span>
                {isExportingWord
                  ? tr('ডাউনলোড হচ্ছে...', 'Downloading...', language)
                  : tr('ওয়ার্ড ফাইল', 'Word File', language)}
              </span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{tr('A4 প্রিন্ট / PDF', 'A4 Print / PDF', language)}</span>
            </button>
          </div>
        </div>

        {/* 1. SELECTIVE SCOPE SWITCHER (প্রেস / অনলাইন / অফলাইন আলাদা ও একসাথে) */}
        <div className="pt-3 border-t border-zinc-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <span>{tr('প্রিন্টের বিষয়বস্তু নির্বাচন করুন (Scope):', 'Select Print Scope:', language)}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomSettings(prev => !prev)}
              className="text-xs font-semibold text-zinc-600 hover:text-black flex items-center gap-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showCustomSettings ? tr('কাস্টম সেটিং লুকান', 'Hide Custom Settings', language) : tr('সেকশন কাস্টমাইজ করুন', 'Customize Sections', language)}</span>
            </button>
          </div>

          {/* Row 1: General Reports, Ledgers & Vouchers */}
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-zinc-400" />
              <span>{tr('📊 রিপোর্ট ও ভাউচার ক্যাটাগরি (Report & Voucher Scopes):', 'Report & Voucher Scopes:', language)}</span>
            </div>
            <div className="flex flex-wrap bg-zinc-100 p-1 rounded-xl border border-zinc-200 gap-1">
              <button
                type="button"
                onClick={() => handleSelectScope('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{tr('সবকিছু একসাথে (পূর্ণাঙ্গ রিপোর্ট)', 'All Combined (Complete Report)', language)}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectScope('press')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'press'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>🏭 {tr('শুধু প্রেস হিসাব ও পেমেন্ট', 'Press Accounts & Payments Only', language)}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectScope('online')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'online'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🌐 {tr('শুধু অনলাইন সেলস ও ডিউ', 'Online Sales & Dues Only', language)}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectScope('offline')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'offline'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>🏪 {tr('শুধু অফলাইন সেলস ও ডিউ', 'Offline Sales & Dues Only', language)}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectScope('sales_due')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'sales_due'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <HandCoins className="w-3.5 h-3.5" />
                <span>🌐+🏪 {tr('অনলাইন ও অফলাইন সেলস ও ডিউ', 'Online & Offline Sales & Dues', language)}</span>
              </button>

              {/* Collection Voucher Button in the same pattern */}
              <button
                type="button"
                onClick={() => handleSelectScope('collection_vouchers')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'collection_vouchers'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                <HandCoins className="w-3.5 h-3.5" />
                <span>💵 {tr('আদায় ভাউচার (১০টি/পৃষ্ঠা)', 'Collection Vouchers (10/Page)', language)}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  scope === 'collection_vouchers' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-200 text-zinc-800'
                }`}>
                  {formatNumber(channelCollections.length, language)}
                </span>
              </button>

              {/* Press Payment Voucher Button in the same pattern */}
              <button
                type="button"
                onClick={() => handleSelectScope('press_vouchers')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'press_vouchers'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>🧾 {tr('প্রেস পেমেন্ট ভাউচার (১০টি/পৃষ্ঠা)', 'Press Payment Vouchers (10/Page)', language)}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  scope === 'press_vouchers' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-200 text-zinc-800'
                }`}>
                  {formatNumber(pressPayments.length, language)}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Voucher Print Toolbar (Shown when press_vouchers or collection_vouchers is selected) */}
          {(scope === 'press_vouchers' || scope === 'collection_vouchers') && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-zinc-700" />
                    <span>
                      {scope === 'press_vouchers'
                        ? tr('প্রেস পেমেন্ট ভাউচার লেআউট:', 'Press Payment Voucher Layout:', language)
                        : tr('অনলাইন ও লাইব্রেরি আদায় ভাউচার লেআউট:', 'Collection Voucher Layout:', language)
                      }
                    </span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-200/80 text-zinc-800 border border-zinc-300">
                    ⚡ {tr('প্রতি পৃষ্ঠায় ঠিক ১০টি ভাউচার (A4 অটো-ব্রেক)', 'Exactly 10 Vouchers per Page (A4 Auto-Break)', language)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Library Filter Dropdown (Exclusive to Collection Vouchers) */}
                  {scope === 'collection_vouchers' && (
                    <div className="flex items-center gap-1.5 bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-xs shadow-xs">
                      <Building2 className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <span className="font-bold text-zinc-700 shrink-0">
                        {tr('লাইব্রেরি ফিল্টার:', 'Library Filter:', language)}
                      </span>
                      <select
                        value={selectedLibraryFilter}
                        onChange={(e) => setSelectedLibraryFilter(e.target.value)}
                        className="bg-transparent font-semibold text-zinc-900 border-none outline-none cursor-pointer text-xs pr-1 max-w-[220px] sm:max-w-none"
                      >
                        <option value="all">
                          {tr('🌐 + 🏪 সকল লাইব্রেরি ও চ্যানেল একসাথে (All Combined)', '🌐 + 🏪 All Libraries & Channels Combined', language)}
                          {` (${channelCollections.length})`}
                        </option>
                        <option value="split_libraries">
                          {tr('📑 প্রতিটি লাইব্রেরি আলাদা পৃষ্ঠা (Separate Page per Library)', '📑 Separate Page per Library (Auto-Break)', language)}
                        </option>
                        <optgroup label={tr('🏪 অফলাইন ও ডিলার লাইব্রেরি (Offline / Dealer)', '🏪 Offline / Dealer Libraries', language)}>
                          {availableLibraries.filter(l => l.type === 'offline').map(l => (
                            <option key={l.key} value={l.key}>
                              {language === 'en' && l.nameEn ? l.nameEn : l.name} — {l.count > 0 ? `${formatNumber(l.count, language)} ${tr('ভাউচার', 'vouchers', language)} (${formatBDT(l.totalAmount, language)})` : tr('০টি ভাউচার', '0 vouchers', language)}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label={tr('🌐 অনলাইন চ্যানেলসমূহ (Online Channels)', '🌐 Online Channels', language)}>
                          {availableLibraries.filter(l => l.type === 'online').map(l => (
                            <option key={l.key} value={l.key}>
                              {language === 'en' && l.nameEn ? l.nameEn : l.name} — {l.count > 0 ? `${formatNumber(l.count, language)} ${tr('ভাউচার', 'vouchers', language)} (${formatBDT(l.totalAmount, language)})` : tr('০টি ভাউচার', '0 vouchers', language)}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}

                  {/* Search Box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={voucherSearchQuery}
                      onChange={(e) => setVoucherSearchQuery(e.target.value)}
                      placeholder={tr('ভাউচার নং বা নাম...', 'Search voucher no or name...', language)}
                      className="pl-8 pr-2.5 py-1 text-xs border border-zinc-300 rounded-lg bg-white w-36 sm:w-44 text-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    {voucherSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setVoucherSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Table vs Slips Toggle */}
                  <div className="inline-flex items-center bg-white p-0.5 rounded-lg border border-zinc-300 text-xs shadow-xs">
                    <button
                      type="button"
                      onClick={() => setVoucherLayoutMode('table')}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        voucherLayoutMode === 'table'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      📊 {tr('রেজিস্টার টেবিল', 'Register Table', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoucherLayoutMode('slips')}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        voucherLayoutMode === 'slips'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      📋 {tr('কাটার উপযোগী স্লিপস', 'Cuttable Slips', language)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Library Filter Chips / Pills (Exclusive to Collection Vouchers) */}
              {scope === 'collection_vouchers' && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-zinc-700" />
                      <span>{tr('লাইব্রেরি ভিত্তিক ফিল্টার:', 'Library Filter Options:', language)}</span>
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {tr('যেকোনো লাইব্রেরিতে ক্লিক করলে শুধু সেই লাইব্রেরির ভাউচার ১০টি করে পৃষ্ঠায় সাজানো হবে', 'Click any library pill to instantly view only its vouchers 10 per page', language)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedLibraryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedLibraryFilter === 'all'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      🌐 + 🏪 {tr('সকল লাইব্রেরি একসাথে', 'All Libraries Combined', language)} ({channelCollections.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedLibraryFilter('split_libraries')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedLibraryFilter === 'split_libraries'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300'
                      }`}
                    >
                      📑 {tr('প্রতিটি লাইব্রেরি আলাদা পৃষ্ঠা (Split Pages)', 'Separate Page per Library (Split)', language)}
                    </button>

                    {availableLibraries.map(lib => (
                      <button
                        key={lib.key}
                        type="button"
                        onClick={() => setSelectedLibraryFilter(lib.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedLibraryFilter === lib.key
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : lib.count > 0
                              ? 'bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-semibold'
                              : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-400 border border-zinc-200'
                        }`}
                      >
                        <span>{lib.type === 'online' ? '🌐' : '🏪'}</span>
                        <span>{language === 'en' && lib.nameEn ? lib.nameEn : lib.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                          selectedLibraryFilter === lib.key 
                            ? 'bg-zinc-700 text-white font-bold' 
                            : lib.count > 0 
                              ? 'bg-zinc-100 text-zinc-800 font-bold border border-zinc-200' 
                              : 'bg-zinc-100 text-zinc-400'
                        }`}>
                          {formatNumber(lib.count, language)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Granular Section Checkboxes (shown when toggled or custom) */}
        {showCustomSettings && (
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-3 animate-in fade-in">
            <span className="font-bold text-zinc-800 block">
              {tr('প্রিন্ট রিপোর্টে কোন কোন সেকশন যুক্ত থাকবে:', 'Select sections to include in the printed report:', language)}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              {/* Sales Mode */}
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                <span className="font-bold block text-zinc-800 mb-1">{tr('বই ভিত্তিক সেলস টেবিল:', 'Book Sales Table:', language)}</span>
                <select
                  value={salesMode}
                  onChange={(e) => {
                    setSalesMode(e.target.value as SalesMode);
                    setScope('custom');
                  }}
                  className="w-full text-xs font-semibold border border-zinc-300 rounded p-1.5 bg-white text-zinc-900"
                >
                  <option value="all">{tr('অনলাইন + অফলাইন মোট সেলস', 'Online + Offline Total Sales', language)}</option>
                  <option value="online">{tr('শুধু অনলাইন সেলস কলাম', 'Online Sales Columns Only', language)}</option>
                  <option value="offline">{tr('শুধু অফলাইন সেলস কলাম', 'Offline Sales Columns Only', language)}</option>
                  <option value="none">{tr('সেলস টেবিল লুকান', 'Hide Sales Table', language)}</option>
                </select>
              </div>

              {/* Press Accounts */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePressAccounts}
                  onChange={(e) => {
                    setIncludePressAccounts(e.target.checked);
                    setScope('custom');
                  }}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('প্রেস হিসাব ও ব্যালেন্স', 'Press Accounts & Balance', language)}</span>
              </label>

              {/* Press Payments History */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePressPayments}
                  onChange={(e) => {
                    setIncludePressPayments(e.target.checked);
                    setScope('custom');
                  }}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('প্রেস পেমেন্ট ভাউচার তালিকা', 'Press Payment Vouchers List', language)}</span>
              </label>

              {/* Online Due */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOnlineDue}
                  onChange={(e) => {
                    setIncludeOnlineDue(e.target.checked);
                    setScope('custom');
                  }}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('অনলাইন চ্যানেল ডিউ খতিয়ান', 'Online Channel Dues Ledger', language)}</span>
              </label>

              {/* Offline Due */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOfflineDue}
                  onChange={(e) => {
                    setIncludeOfflineDue(e.target.checked);
                    setScope('custom');
                  }}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('অফলাইন ও লাইব্রেরি ডিউ খতিয়ান', 'Offline & Library Dues Ledger', language)}</span>
              </label>

              {/* Signatures */}
              <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-zinc-900 focus:ring-0"
                />
                <span className="font-medium text-zinc-800">{tr('কর্মকর্তাদের স্বাক্ষর ও সিল', 'Official Signatures & Seals', language)}</span>
              </label>

            </div>
          </div>
        )}

        {/* 2. BOOK SELECTION CONTROLS (বই নির্বাচন: সব বই / একক বই / একাধিক বই সিলেক্ট) */}
        <div className="pt-3 border-t border-zinc-100 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-700" />
              <span>{tr('বই নির্বাচন (Book Selection):', 'Book Selection:', language)}</span>
            </span>

            {/* Selection Mode Pills */}
            <div className="inline-flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
              <button
                type="button"
                onClick={() => setBookSelectionMode('all')}
                className={`px-3 py-1 font-bold rounded-md transition-all ${
                  bookSelectionMode === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tr(`সব বই (${books.length})`, `All Books (${books.length})`, language)}
              </button>

              <button
                type="button"
                onClick={() => setBookSelectionMode('single')}
                className={`px-3 py-1 font-bold rounded-md transition-all ${
                  bookSelectionMode === 'single'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tr('একক বই', 'Single Book', language)}
              </button>

              <button
                type="button"
                onClick={() => setBookSelectionMode('multiple')}
                className={`px-3 py-1 font-bold rounded-md transition-all ${
                  bookSelectionMode === 'multiple'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tr(`একাধিক বই সিলেক্ট (${selectedMultipleBookIds.length})`, `Select Multiple (${selectedMultipleBookIds.length})`, language)}
              </button>
            </div>
          </div>

          {/* Mode 1: Single Book Dropdown */}
          {bookSelectionMode === 'single' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 bg-zinc-50 rounded-xl border border-zinc-200 animate-in fade-in">
              <span className="text-xs font-semibold text-zinc-700 shrink-0">
                {tr('নির্দিষ্ট বই বাছাই করুন:', 'Select Specific Book:', language)}
              </span>
              <select
                value={selectedSingleBookId}
                onChange={(e) => setSelectedSingleBookId(e.target.value)}
                className="w-full sm:max-w-md text-xs font-bold bg-white border border-zinc-300 rounded-lg p-2 text-zinc-900 focus:ring-2 focus:ring-zinc-900 cursor-pointer"
              >
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.sl}. {b.bookName}{b.edition ? ` [${b.edition}]` : ''} (MRP: {formatBDT(b.perBookAmount, language)})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-zinc-500 font-medium">
                👉 {tr('রিপোর্টে শুধুমাত্র এই একক বইটির সম্পূর্ণ বিক্রয়, প্রেস স্টক ও ব্যালেন্স প্রিন্ট হবে।', 'Only sales, press stock and balances for this single book will be printed in the report.', language)}
              </span>
            </div>
          )}

          {/* Mode 2: Multiple Book Selection (Checkboxes + Select All / Clear All) */}
          {bookSelectionMode === 'multiple' && (
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2.5 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                <span className="text-xs font-bold text-zinc-800">
                  {tr('যেসব বইয়ের রিপোর্ট প্রিন্ট করতে চান সেগুলো টিক দিন:', 'Check the books you want to include in the report:', language)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMultipleBookIds(books.map(b => b.id))}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-700 hover:text-black bg-white px-2.5 py-1 rounded-md border border-zinc-300 shadow-2xs"
                  >
                    <CheckSquare className="w-3 h-3 text-zinc-600" />
                    <span>{tr('সব সিলেক্ট করুন', 'Select All', language)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMultipleBookIds([])}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-700 hover:text-black bg-white px-2.5 py-1 rounded-md border border-zinc-300 shadow-2xs"
                  >
                    <Square className="w-3 h-3 text-zinc-600" />
                    <span>{tr('সব আন-সিলেক্ট', 'Deselect All', language)}</span>
                  </button>
                  <span className="text-[11px] font-bold text-zinc-900 bg-zinc-200 px-2.5 py-0.5 rounded-full font-mono">
                    {tr('নির্বাচিত', 'Selected', language)}: {selectedMultipleBookIds.length} / {books.length}
                  </span>
                </div>
              </div>

              {/* Checkboxes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {books.map(b => {
                  const isChecked = selectedMultipleBookIds.includes(b.id);
                  return (
                    <label
                      key={b.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked 
                          ? 'bg-white border-zinc-900 shadow-2xs font-bold text-zinc-900' 
                          : 'bg-white/60 border-zinc-200 text-zinc-600 hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMultipleBookIds(prev => [...prev, b.id]);
                          } else {
                            setSelectedMultipleBookIds(prev => prev.filter(id => id !== b.id));
                          }
                        }}
                        className="rounded text-zinc-900 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="font-mono text-[10px] text-zinc-400">{b.sl}.</span>
                      <span className="truncate">{b.bookName}{b.edition ? ` [${b.edition}]` : ''}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. REPORT TIME PERIOD SELECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <div className="flex flex-wrap bg-zinc-100 p-1 rounded-xl border border-zinc-200 gap-1">
            {[
              { key: 'monthly', labelBn: 'মাসিক রিপোর্ট', labelEn: 'Monthly', icon: CalendarRange },
              { key: 'daily', labelBn: 'দৈনিক', labelEn: 'Daily', icon: Calendar },
              { key: 'weekly', labelBn: 'সাপ্তাহিক', labelEn: 'Weekly', icon: CalendarDays },
              { key: 'quarterly', labelBn: '৩ মাস (কোয়ার্টার)', labelEn: 'Quarterly', icon: Layers },
              { key: 'half_yearly', labelBn: '৬ মাস (ষান্মাসিক)', labelEn: 'Half-Yearly', icon: Clock },
              { key: 'yearly', labelBn: 'বার্ষিক', labelEn: 'Yearly', icon: TrendingUp },
              { key: 'custom', labelBn: 'তারিখ রেঞ্জ', labelEn: 'Custom Range', icon: Filter },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = reportType === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setReportType(tab.key as ReportType)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? tab.labelBn : tab.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-selectors */}
          {reportType === 'daily' && (
            <div className="flex items-center gap-2">
              <button
                disabled={selectedDay <= 1}
                onClick={() => setSelectedDay(d => Math.max(1, d - 1))}
                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                <span>{tr('তারিখ:', 'Day:', language)}</span>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="font-mono text-xs border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      {language === 'bn' ? `${d} তারিখ (${d}তম দিন)` : `Day ${d}`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                disabled={selectedDay >= daysInMonth}
                onClick={() => setSelectedDay(d => Math.min(daysInMonth, d + 1))}
                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900">{tr('সপ্তাহ:', 'Week:', language)}</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="font-medium text-xs border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
              >
                {weekList.map(w => (
                  <option key={w.weekNumber} value={w.weekNumber}>
                    {language === 'bn' ? w.name : `Week ${w.weekNumber} (Days ${w.startDay}-${w.endDay})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'quarterly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900">{tr('কোয়ার্টার:', 'Quarter:', language)}</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="text-xs font-semibold border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
              >
                {QUARTER_OPTIONS.map(q => (
                  <option key={q.key} value={q.key}>{q.label}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'half_yearly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900">{tr('ষাণ্মাসিক:', 'Half-Year:', language)}</span>
              <select
                value={selectedHalfYear}
                onChange={(e) => setSelectedHalfYear(e.target.value)}
                className="text-xs font-semibold border border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
              >
                {HALF_YEAR_OPTIONS.map(h => (
                  <option key={h.key} value={h.key}>{h.label}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs font-mono border border-zinc-300 rounded-lg px-2 py-1 bg-zinc-50"
              />
              <span className="text-xs text-zinc-500">{tr('থেকে', 'to', language)}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs font-mono border border-zinc-300 rounded-lg px-2 py-1 bg-zinc-50"
              />
            </div>
          )}

        </div>
      </div>

      {/* ======================================================== */}
      {/* Formal Printable Document Body (A4 Calibrated) */}
      {/* ======================================================== */}
      {scope === 'press_vouchers' ? (
        renderPressVoucherPages()
      ) : scope === 'collection_vouchers' ? (
        renderCollectionVoucherPages()
      ) : (
        <div className="print-page-container bg-white p-4 sm:p-8 md:p-10 rounded-2xl border border-zinc-200 shadow-xs w-full max-w-6xl mx-auto space-y-6 print:max-w-none print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Publication Header */}
        <div className="border-b-2 border-zinc-900 pb-5 text-center relative">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            {tr('বিদ্যাবাড়ি পাবলিকেশন', 'Biddabari Publication', language)}
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            {tr(
              'প্রধান কার্যালয়, ঢাকা, বাংলাদেশ • বুক পাবলিকেশন অ্যান্ড ডিস্ট্রিবিউশন ডিপার্টমেন্ট',
              'Head Office, Dhaka, Bangladesh • Book Publication & Distribution Department',
              language
            )}
          </p>
          
          {/* Dynamic Badge */}
          <div className="inline-block mt-2 bg-zinc-100 text-zinc-900 text-xs px-4 py-1.5 rounded-full font-bold border border-zinc-300">
            {getReportScopeTitle()} • ({getReportPeriodTitle()})
          </div>

          <div className="text-[11px] text-zinc-500 mt-2">
            {tr('প্রতিবেদন প্রস্তুতের তারিখ:', 'Report Generation Date:', language)} <b>{currentDate}</b>
          </div>
        </div>

        {/* If Single Book is selected, show an executive Single Book Highlights Showcase Card */}
        {effectiveBooks.length === 1 && (
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-4 sm:p-5 avoid-break space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-3 gap-2">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  {tr('একক বই স্পেশাল রিপোর্ট', 'Single Book Executive Report', language)}
                </span>
                <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                  <span>{effectiveBooks[0].sl}.</span>
                  <span>{effectiveBooks[0].bookName}</span>
                </h2>
                {effectiveBooks[0].remarks && (
                  <p className="text-xs text-zinc-600 mt-0.5">{effectiveBooks[0].remarks}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white px-3 py-1.5 rounded-xl border border-zinc-200 text-right">
                  <span className="text-[10px] text-zinc-400 block">{tr('বিক্রয় মূল্য (MRP)', 'MRP Price', language)}</span>
                  <span className="text-base font-black text-zinc-900 font-mono">{formatBDT(effectiveBooks[0].perBookAmount, language)}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-xl border border-zinc-200 text-right">
                  <span className="text-[10px] text-zinc-400 block">{tr('নিট লাভ/কপি', 'Profit/Copy', language)}</span>
                  <span className="text-base font-black text-emerald-700 font-mono">+{formatBDT(calculateBookMetrics(effectiveBooks[0]).profitPerBook, language)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('মোট প্রেস অর্ডার', 'Total Press Order', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalOrderFaridBhai, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('প্রেস থেকে প্রাপ্ত চালান', 'Received from Press', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).faridBhaiToHeadOffice, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('হেড অফিস বর্তমান স্টক', 'Head Office Stock', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalPresentStockHO, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('প্রেসে অবশিষ্ট স্টক', 'Stock at Press', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).stockToFaridBhai, language)} {tr('কপি', 'copies', language)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('অনলাইন বিক্রয়', 'Online Sales', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalOnlineSell, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('অফলাইন বিক্রয়', 'Offline Sales', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalOfflineSell, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('মোট বিক্রিত কপি', 'Total Sold Copies', language)}</span>
                <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(calculateBookMetrics(effectiveBooks[0]).totalSold, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
                <span className="text-zinc-500 text-[11px] block">{tr('মোট অর্জিত নিট লাভ', 'Total Net Profit', language)}</span>
                <span className="text-base font-black text-emerald-800 font-mono">+{formatBDT(calculateBookMetrics(effectiveBooks[0]).totalNetProfit, language)}</span>
              </div>
            </div>
          </div>
        )}

        {effectiveBooks.length === 0 && (
          <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200">
            <BookOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <h3 className="font-bold text-zinc-800 text-sm">{tr('কোনো বই নির্বাচন করা হয়নি', 'No books selected', language)}</h3>
            <p className="text-xs text-zinc-500 mt-1">{tr('দয়া করে উপরের বই নির্বাচন প্যানেল থেকে অন্তত একটি বই সিলেক্ট করুন।', 'Please select at least one book from the selection panel above.', language)}</p>
          </div>
        )}

        {/* Dynamic Primary KPI Summary Cards based on Selected Scope */}
        {scope === 'press' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('মোট প্রেস বিল (অর্ডার)', 'Total Press Bill (Orders)', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(pressAccounts.totalOrderBill, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('অর্ডার কপি অনুযায়ী', 'Based on order copies', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('প্রাপ্ত চালান মূল্য', 'Received Delivery Value', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(pressAccounts.totalReceivedBill, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('হেড অফিসে গৃহীত', 'Received at Head Office', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('প্রেসে পরিশোধিত টাকা', 'Paid to Press', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(pressAccounts.totalPaidToPress, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{pressPayments.length} {tr('টি ভাউচার', 'vouchers', language)}</span>
            </div>

            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl">
              <span className="text-[11px] text-zinc-600 block font-bold">{tr('প্রেসের বকেয়া ব্যালেন্স', 'Press Due Balance', language)}</span>
              <span className="text-xl font-black text-zinc-900 font-mono">
                {pressAccounts.netDueOnOrder > 0
                  ? formatBDT(pressAccounts.netDueOnOrder, language)
                  : pressAccounts.netDueOnOrder < 0
                  ? `+${formatBDT(Math.abs(pressAccounts.netDueOnOrder), language)}`
                  : formatBDT(0, language)}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {pressAccounts.netDueOnOrder > 0 ? tr('প্রেস পাবে', 'Due to Press', language) : tr('সম্পূর্ণ পরিশোধিত', 'Fully Settled', language)}
              </span>
            </div>
          </div>
        ) : scope === 'online' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অনলাইন বিক্রিত কপি', 'Online Sold Copies', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalOnlineSold, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('বইবাড়ি, রকমারি, ওয়াফিলাইফ', 'Boibari, Rokomari, Wafilife', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অনলাইন মোট রাজস্ব', 'Online Total Revenue', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineBilled, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ইনভয়েস মূল্য', 'Invoice Value', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অনলাইন আদায়কৃত', 'Online Collected', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineCollected, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ব্যাংক ও বিকাশ', 'Bank & bKash', language)}</span>
            </div>

            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl">
              <span className="text-[11px] text-zinc-600 block font-bold">{tr('অনলাইন ডিউ / বকেয়া', 'Online Due / Balance', language)}</span>
              <span className="text-xl font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineDue, language)}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">{tr('অনলাইন বাকি', 'Online Due', language)}</span>
            </div>
          </div>
        ) : scope === 'offline' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অফলাইন বিক্রিত কপি', 'Offline Sold Copies', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalOfflineSold, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('হেড অফিস ও ডিলার লাইব্রেরি', 'Head Office & Dealer Libraries', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('অফলাইন মোট রাজস্ব', 'Offline Total Revenue', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineBilled, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ইনভয়েস মূল্য', 'Invoice Value', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('লাইব্রেরি আদায়কৃত', 'Libraries Collected', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineCollected, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ক্যাশ ও চেক', 'Cash & Cheque', language)}</span>
            </div>

            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl">
              <span className="text-[11px] text-zinc-600 block font-bold">{tr('অফলাইন ডিউ / বকেয়া', 'Offline Due / Balance', language)}</span>
              <span className="text-xl font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineDue, language)}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">{tr('লাইব্রেরির নিকট বাকি', 'Due from Libraries', language)}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('মোট বিক্রিত কপি', 'Total Sold Copies', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatNumber(monthlyTotals.totalSold, language)} {tr('কপি', 'copies', language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {tr(`অনলাইন ${monthlyTotals.totalOnlineSold} • অফলাইন ${monthlyTotals.totalOfflineSold}`, `Online ${monthlyTotals.totalOnlineSold} • Offline ${monthlyTotals.totalOfflineSold}`, language)}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('মোট রাজস্ব (Revenue)', 'Total Revenue', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(monthlyTotals.totalRevenue, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('মোট বিক্রয়মূল্য', 'Total Sales Amount', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('প্রেসের বকেয়া ব্যালেন্স', 'Press Due Balance', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">
                {pressAccounts.netDueOnOrder > 0 ? formatBDT(pressAccounts.netDueOnOrder, language) : tr('পরিশোধিত', 'Settled', language)}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{tr('ফরিদ ভাই প্রেস', 'Farid Bhai Press', language)}</span>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 block">{tr('মোট চ্যানেল ডিউ', 'Total Channel Dues', language)}</span>
              <span className="text-xl font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.totalDue, language)}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {tr(`অনলাইন ${formatBDT(channelAccounts.onlineDue, language)} • অফলাইন ${formatBDT(channelAccounts.offlineDue, language)}`, `Online ${formatBDT(channelAccounts.onlineDue, language)} • Offline ${formatBDT(channelAccounts.offlineDue, language)}`, language)}
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 1: BOOKS TABLE (Full / Online Only / Offline Only) */}
        {/* ======================================================== */}
        {salesMode !== 'none' && effectiveBooks.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>
                {salesMode === 'online' 
                  ? tr('১. বই ভিত্তিক অনলাইন বিক্রয় ও রাজস্ব খতিয়ান', '1. Book-wise Online Sales & Revenue Ledger', language)
                  : salesMode === 'offline' 
                  ? tr('১. বই ভিত্তিক অফলাইন ও লাইব্রেরি বিক্রয় ও রাজস্ব খতিয়ান', '1. Book-wise Offline & Library Sales & Revenue Ledger', language)
                  : tr('১. বই ভিত্তিক পূর্ণাঙ্গ বিক্রয় ও রাজস্ব খতিয়ান', '1. Book-wise Comprehensive Sales & Revenue Ledger', language)
                }
              </span>
              <span className="text-[11px] font-normal text-zinc-500">
                {effectiveBooks.length} {tr('টি বই', 'books', language)}
              </span>
            </h3>

            {/* A: Online-Only Books Table */}
            {salesMode === 'online' && (
              <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
                <table className="w-full min-w-[750px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-900 font-bold">
                      <th className="py-2.5 px-3 text-center w-12">{tr('SL', 'SL', language)}</th>
                      <th className="py-2.5 px-3 min-w-[180px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('MRP', 'MRP', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('বইবাড়ি', 'Boibari', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('রকমারি', 'Rokomari', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('ওয়াফিলাইফ', 'Wafilife', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('অন্যান্য', 'Others', language)}</th>
                      <th className="py-2.5 px-3 text-center bg-zinc-200 font-bold text-zinc-900">{tr('অনলাইন মোট বিক্রি', 'Online Total Sales', language)}</th>
                      <th className="py-2.5 px-3 text-right bg-zinc-200/60 font-bold text-zinc-900">{tr('অনলাইন রাজস্ব', 'Online Revenue', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {effectiveBooks.map(b => {
                      const m = calculateBookMetrics(b);
                      const onlineRev = m.totalOnlineSell * m.perBookAmount;
                      return (
                        <tr key={b.id}>
                          <td className="py-2 px-3 text-center font-mono">{b.sl}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{b.bookName}</span>
                              {b.edition && (
                                <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-zinc-100 text-zinc-800 border border-zinc-300">
                                  {b.edition}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.perBookAmount, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.boibariTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.rokomariTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.wafilifeTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.othersOnlineTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono bg-zinc-50">{formatNumber(m.totalOnlineSell, language)} {tr('কপি', 'cps', language)}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 font-mono bg-zinc-50">{formatBDT(onlineRev, language)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                      <td colSpan={3} className="py-2.5 px-3 text-right">{tr('অনলাইন সর্বমোট যোগফল:', 'Online Total Sum:', language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.boibari, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.rokomari, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.wafilife, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.othersOnline, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono bg-zinc-200">{formatNumber(monthlyTotals.totalOnlineSold, language)} {tr('কপি', 'copies', language)}</td>
                      <td className="py-2.5 px-3 text-right font-mono bg-zinc-200">{formatBDT(channelAccounts.onlineBilled, language)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* B: Offline-Only Books Table */}
            {salesMode === 'offline' && (
              <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
                <table className="w-full min-w-[800px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-900 font-bold">
                      <th className="py-2.5 px-3 text-center w-12">{tr('SL', 'SL', language)}</th>
                      <th className="py-2.5 px-3 min-w-[180px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('MRP', 'MRP', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('হেড অফিস সেল', 'Head Office Sales', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('নীলক্ষেত', 'Nilkhet', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('সুমনা (প্রেস)', 'Sumona (Press)', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('প্রমিজ (প্রেস)', 'Promise (Press)', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('জয়স্টার (প্রেস)', 'Joystar (Press)', language)}</th>
                      <th className="py-2.5 px-3 text-center bg-zinc-200 font-bold text-zinc-900">{tr('অফলাইন মোট বিক্রি', 'Offline Total Sales', language)}</th>
                      <th className="py-2.5 px-3 text-right bg-zinc-200/60 font-bold text-zinc-900">{tr('অফলাইন রাজস্ব', 'Offline Revenue', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {effectiveBooks.map(b => {
                      const m = calculateBookMetrics(b);
                      const offlineRev = m.totalOfflineSell * m.perBookAmount;
                      return (
                        <tr key={b.id}>
                          <td className="py-2 px-3 text-center font-mono">{b.sl}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{b.bookName}</span>
                              {b.edition && (
                                <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-zinc-100 text-zinc-800 border border-zinc-300">
                                  {b.edition}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.perBookAmount, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.headOfficeOfflineTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.nilkhetTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.sumonaTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.promiseTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.joystarTotal, language)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono bg-zinc-50">{formatNumber(m.totalOfflineSell, language)} {tr('কপি', 'cps', language)}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 font-mono bg-zinc-50">{formatBDT(offlineRev, language)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                      <td colSpan={3} className="py-2.5 px-3 text-right">{tr('অফলাইন সর্বমোট যোগফল:', 'Offline Total Sum:', language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.hoOffline, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.nilkhet, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.sumona, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.promise, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.joystar, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono bg-zinc-200">{formatNumber(monthlyTotals.totalOfflineSold, language)} {tr('কপি', 'copies', language)}</td>
                      <td className="py-2.5 px-3 text-right font-mono bg-zinc-200">{formatBDT(channelAccounts.offlineBilled, language)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* C: Full Books Table (Combined) */}
            {salesMode === 'all' && (
              <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
                <table className="w-full min-w-[850px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-900 font-bold">
                      <th className="py-2.5 px-3 text-center w-12">{tr('SL', 'SL', language)}</th>
                      <th className="py-2.5 px-3 min-w-[180px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('MRP', 'MRP', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('লাভ/কপি', 'Profit/Copy', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('প্রেস অর্ডার', 'Press Order', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('HO স্টক', 'HO Stock', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('প্রেস স্টক', 'Press Stock', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('অনলাইন', 'Online', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('অফলাইন', 'Offline', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('মোট বিক্রি', 'Total Sold', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('রাজস্ব', 'Revenue', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('নিট লাভ', 'Net Profit', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {effectiveBooks.map(b => {
                      const m = calculateBookMetrics(b);
                      return (
                        <tr key={b.id}>
                          <td className="py-2 px-3 text-center font-mono">{b.sl}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{b.bookName}</span>
                              {b.edition && (
                                <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-zinc-100 text-zinc-800 border border-zinc-300">
                                  {b.edition}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.perBookAmount, language)}</td>
                          <td className="py-2 px-3 text-right font-mono">+{formatBDT(m.profitPerBook, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.totalOrderFaridBhai, language)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono">{formatNumber(m.totalPresentStockHO, language)}</td>
                          <td className="py-2 px-3 text-center font-mono text-zinc-700">{formatNumber(m.stockToFaridBhai, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.totalOnlineSell, language)}</td>
                          <td className="py-2 px-3 text-center font-mono">{formatNumber(m.totalOfflineSell, language)}</td>
                          <td className="py-2 px-3 text-center font-bold text-zinc-900 font-mono">{formatNumber(m.totalSold, language)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatBDT(m.totalRevenue, language)}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 font-mono">+{formatBDT(m.totalNetProfit, language)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black border-t-2 border-zinc-900 text-zinc-900">
                      <td colSpan={4} className="py-2.5 px-3 text-right">{tr(`সর্বমোট যোগফল (${effectiveBooks.length} টি বই):`, `Total Sum (${effectiveBooks.length} books):`, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(effectiveBooks.reduce((s, b) => s + (Number(b.totalOrderFaridBhai) || 0), 0), language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalHOStock, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalPressStock, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalOnlineSold, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalOfflineSold, language)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{formatNumber(monthlyTotals.totalSold, language)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatBDT(monthlyTotals.totalRevenue, language)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">+{formatBDT(monthlyTotals.totalProfit, language)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: PRESS ACCOUNTS & PAYMENT LEDGER */}
        {/* ======================================================== */}
        {includePressAccounts && (
          <div className="avoid-break">
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>{tr('২. ফরিদ ভাই প্রেস হিসাব ও পরিশোধিত পেমেন্ট বিবরণী', '2. Farid Bhai Press Accounts & Payment Statement', language)}</span>
              <span className="text-[11px] font-semibold text-zinc-600">
                {pressAccounts.netDueOnOrder > 0 ? `${tr('প্রেসের বকেয়া:', 'Press Due:', language)} ${formatBDT(pressAccounts.netDueOnOrder, language)}` : tr('সম্পূর্ণ পরিশোধিত', 'Fully Settled', language)}
              </span>
            </h3>

            <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
                    <th className="py-2 px-3">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('অর্ডার কপি', 'Order Copies', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('ছাপার খরচ', 'Printing Cost', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('মোট প্রেস বিল', 'Total Press Bill', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('প্রাপ্ত চালান', 'Received Copies', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('পরিশোধিত টাকা', 'Paid Amount', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('বাকি / ব্যালেন্স', 'Due / Balance', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('স্ট্যাটাস', 'Status', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pressAccounts.bookAccounts.map(b => (
                    <tr key={b.bookId}>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-zinc-900">{b.bookName}</div>
                        {b.lots && b.lots.length > 0 && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {b.lots.map((l) => `${l.lotName}: ${formatNumber(l.quantity, language)} ${tr('কপি', 'cps', language)} (${l.date})`).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{formatNumber(b.orderQuantity, language)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatBDT(b.makingCost, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatBDT(b.totalOrderBill, language)}</td>
                      <td className="py-2 px-3 text-center font-mono">{formatNumber(b.receivedCopies, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(b.totalPaid, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {b.dueOnOrder > 0 ? formatBDT(b.dueOnOrder, language) : b.dueOnOrder < 0 ? `+${formatBDT(Math.abs(b.dueOnOrder), language)}` : formatBDT(0, language)}
                      </td>
                      <td className="py-2 px-3 text-center font-semibold text-[11px]">{b.statusText}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-300 text-zinc-900">
                    <td className="py-2.5 px-3 text-right">{tr('প্রেস সর্বমোট:', 'Press Total:', language)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.orderQuantity, 0), language)}</td>
                    <td></td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(pressAccounts.totalOrderBill, language)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.receivedCopies, 0), language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(pressAccounts.totalPaidToPress, language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {pressAccounts.netDueOnOrder > 0 ? formatBDT(pressAccounts.netDueOnOrder, language) : formatBDT(0, language)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-zinc-600 font-normal">
                      {pressAccounts.netDueOnOrder > 0 ? tr('প্রেস পাবে', 'Due to Press', language) : tr('পরিশোধিত', 'Settled', language)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Press Payment Voucher History Table */}
        {includePressPayments && filteredPressPayments.length > 0 && (
          <div className="avoid-break">
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>
                {tr(
                  `ফরিদ ভাই প্রেসে পরিশোধিত পেমেন্ট ভাউচার হিস্ট্রি (${filteredPressPayments.length} টি ভাউচার)`,
                  `Farid Bhai Press Payment Voucher History (${filteredPressPayments.length} vouchers)`,
                  language
                )}
              </span>
              <span className="text-[11px] font-bold text-zinc-900 font-mono">
                {tr('মোট পরিশোধ:', 'Total Paid:', language)} {formatBDT(pressAccounts.totalPaidToPress, language)}
              </span>
            </h3>

            <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
                    <th className="py-2 px-3">{tr('তারিখ', 'Date', language)}</th>
                    <th className="py-2 px-3">{tr('খাত / বইয়ের নাম', 'Category / Book Name', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('পরিশোধিত টাকা', 'Paid Amount', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('মাধ্যম', 'Method', language)}</th>
                    <th className="py-2 px-3">{tr('ভাউচার / চেক নং', 'Voucher / Cheque No', language)}</th>
                    <th className="py-2 px-3">{tr('বিবরণ / নোট', 'Notes', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredPressPayments.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-medium text-zinc-900">{p.date}</td>
                      <td className="py-2 px-3 font-semibold text-zinc-900">{p.bookName || tr('সার্বিক প্রেস অর্ডার', 'General Press Order', language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(p.amount, language)}</td>
                      <td className="py-2 px-3 text-center uppercase font-mono text-[10px]">{p.paymentMethod}</td>
                      <td className="py-2 px-3 font-mono text-zinc-600">{p.voucherNo || '—'}</td>
                      <td className="py-2 px-3 text-zinc-500">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 3: CHANNEL DUE & COLLECTION (Online / Offline / Both) */}
        {/* ======================================================== */}
        {(includeOnlineDue || includeOfflineDue) && filteredChannels.length > 0 && (
          <div className="avoid-break">
            <h3 className="text-xs font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-1 flex items-center justify-between">
              <span>
                {includeOnlineDue && !includeOfflineDue 
                  ? tr('৩. অনলাইন চ্যানেল ডিউ ও কালেকশন খতিয়ান', '3. Online Channel Dues & Collections Ledger', language)
                  : !includeOnlineDue && includeOfflineDue 
                  ? tr('৩. অফলাইন ও লাইব্রেরি ডিউ ও কালেকশন খতিয়ান', '3. Offline & Library Dues & Collections Ledger', language)
                  : tr('৩. অনলাইন ও অফলাইন চ্যানেল ডিউ ও কালেকশন খতিয়ান', '3. Online & Offline Channel Dues & Collections Ledger', language)
                }
              </span>
              <span className="text-[11px] font-semibold text-zinc-600">
                {tr('মোট ডিউ:', 'Total Due:', language)} {formatBDT(filteredChannels.reduce((s, c) => s + c.dueAmount, 0), language)} • {tr('মোট আদায়:', 'Total Collected:', language)} {formatBDT(filteredChannels.reduce((s, c) => s + c.totalCollected, 0), language)}
              </span>
            </h3>

            <div className="overflow-x-auto w-full border border-zinc-200 rounded-xl">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-800">
                    <th className="py-2 px-3">{tr('চ্যানেল / লাইব্রেরি', 'Channel / Library', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('ধরন', 'Type', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('বিক্রিত কপি', 'Sold Copies', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('ইনভয়েস বিক্রয়মূল্য', 'Invoiced Amount', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('আদায়কৃত টাকা', 'Collected Amount', language)}</th>
                    <th className="py-2 px-3 text-right">{tr('বাকি / ডিউ', 'Due Balance', language)}</th>
                    <th className="py-2 px-3 text-center">{tr('আদায় হার (%)', 'Collection Rate (%)', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredChannels.map(ch => (
                    <tr key={ch.key}>
                      <td className="py-2 px-3 font-semibold text-zinc-900">{ch.name}</td>
                      <td className="py-2 px-3 text-center uppercase text-[10px] font-mono">
                        {ch.type === 'online' ? tr('অনলাইন', 'Online', language) : tr('অফলাইন', 'Offline', language)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{formatNumber(ch.totalCopies, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatBDT(ch.totalBilled, language)}</td>
                      <td className="py-2 px-3 text-right font-mono text-zinc-900">{formatBDT(ch.totalCollected, language)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {ch.dueAmount > 0 ? formatBDT(ch.dueAmount, language) : formatBDT(0, language)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{ch.collectionRate.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black border-t-2 border-zinc-300 text-zinc-900">
                    <td colSpan={2} className="py-2.5 px-3 text-right">{tr('চ্যানেল সর্বমোট:', 'Channel Total Sum:', language)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{formatNumber(filteredChannels.reduce((s, c) => s + c.totalCopies, 0), language)} {tr('কপি', 'copies', language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(filteredChannels.reduce((s, c) => s + c.totalBilled, 0), language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(filteredChannels.reduce((s, c) => s + c.totalCollected, 0), language)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatBDT(filteredChannels.reduce((s, c) => s + c.dueAmount, 0), language)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {filteredChannels.reduce((s, c) => s + c.totalBilled, 0) > 0
                        ? ((filteredChannels.reduce((s, c) => s + c.totalCollected, 0) / filteredChannels.reduce((s, c) => s + c.totalBilled, 0)) * 100).toFixed(1)
                        : 100}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* Signatures block (Auto avoid cut across pages) */}
        {/* ======================================================== */}
        {includeSignatures && (
          <div className="signature-block avoid-break pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-zinc-600 border-t border-zinc-200">
            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1 mb-1"></div>
              <span className="font-semibold block text-zinc-800">{tr('ইনভেন্টরি অফিসার', 'Inventory Officer', language)}</span>
              <span className="text-[10px] text-zinc-400">{tr('ওয়্যারহাউজ ও স্টক বিভাগ', 'Warehouse & Stock Dept.', language)}</span>
            </div>

            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1 mb-1"></div>
              <span className="font-semibold block text-zinc-800">{tr('হিসাবরক্ষণ কর্মকর্তা', 'Accounts Officer', language)}</span>
              <span className="text-[10px] text-zinc-400">{tr('অ্যাকাউন্টিং অ্যান্ড ফিন্যান্স', 'Accounting & Finance', language)}</span>
            </div>

            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1 mb-1"></div>
              <span className="font-semibold block text-zinc-800">{tr('প্রকাশনা পরিচালক', 'Publication Director', language)}</span>
              <span className="text-[10px] text-zinc-400">{tr('বিদ্যাবাড়ি পাবলিকেশন', 'Biddabari Publication', language)}</span>
            </div>
          </div>
        )}

      </div>
      )}

      {/* Fullscreen Image Preview Lightbox */}
      <ImageViewerModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        language={language}
      />

    </div>
  );
};
