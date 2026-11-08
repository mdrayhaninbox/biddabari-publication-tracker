import React, { useState, useEffect } from 'react';
import { BookRecord, ActiveTab, PressPaymentRecord, ChannelCollectionRecord } from './types/book';
import { INITIAL_BOOKS } from './data/initialBooks';
import { INITIAL_PRESS_PAYMENTS, INITIAL_CHANNEL_COLLECTIONS } from './data/initialAccountsData';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BooksTable } from './components/BooksTable';
import { DailyEntryModal } from './components/DailyEntryModal';
import { BookDetailMatrix } from './components/BookDetailMatrix';
import { AddEditBookModal } from './components/AddEditBookModal';
import { ExcelSyncModal } from './components/ExcelSyncModal';
import { PrintableReport } from './components/PrintableReport';
import { PeriodViewSystem } from './components/PeriodViewSystem';
import { QuickDataEntry } from './components/QuickDataEntry';
import { AccountsDueLedger } from './components/AccountsDueLedger';
import { AddPressPaymentModal } from './components/AddPressPaymentModal';
import { AddChannelCollectionModal } from './components/AddChannelCollectionModal';
import { exportBooksToExcel } from './utils/excelHandler';
import { 
  getDaysInMonth, 
  createFreshMonthBooks, 
  formatMonthYearBengali 
} from './utils/calculations';

const LEGACY_STORAGE_KEY = 'biddabari_books_data_v1';
const ZOOM_STORAGE_KEY = 'biddabari_ui_zoom_v1';
const MONTH_STORAGE_KEY = 'biddabari_selected_month_v1';
const YEAR_STORAGE_KEY = 'biddabari_selected_year_v1';
const PRESS_PAYMENTS_STORAGE_KEY = 'biddabari_press_payments_v1';
const CHANNEL_COLLECTIONS_STORAGE_KEY = 'biddabari_channel_collections_v1';

const getMonthlyStorageKey = (year: number, month: number) => 
  `biddabari_books_data_v2_${year}-${String(month).padStart(2, '0')}`;

export const App: React.FC = () => {
  // UI Zoom state: default 75% compact view as requested
  const [uiZoom, setUiZoom] = useState<'75' | '100'>(() => {
    try {
      const savedZoom = localStorage.getItem(ZOOM_STORAGE_KEY);
      if (savedZoom === '100') return '100';
    } catch (e) {
      // fallback
    }
    return '75';
  });

  useEffect(() => {
    try {
      localStorage.setItem(ZOOM_STORAGE_KEY, uiZoom);
      document.body.style.zoom = uiZoom === '75' ? '0.75' : '1';
    } catch (e) {
      console.error(e);
    }
  }, [uiZoom]);

  // Selected Month & Year (Default to current active month: Nov 2026)
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    try {
      const savedYear = localStorage.getItem(YEAR_STORAGE_KEY);
      if (savedYear) {
        const parsed = Number(savedYear);
        if (!isNaN(parsed) && parsed >= 2020 && parsed <= 2040) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return 2026;
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    try {
      const savedMonth = localStorage.getItem(MONTH_STORAGE_KEY);
      if (savedMonth) {
        const parsed = Number(savedMonth);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return 11; // November
  });

  // Calculate dynamic days in the selected month
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  // Helper to load books for specific month & year
  const loadBooksForPeriod = (year: number, month: number): BookRecord[] => {
    try {
      const currentKey = getMonthlyStorageKey(year, month);
      const saved = localStorage.getItem(currentKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // If it's November 2026 and legacy key exists, migrate seamlessly
      if (year === 2026 && month === 11) {
        const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacySaved) {
          const parsedLegacy = JSON.parse(legacySaved);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            localStorage.setItem(currentKey, legacySaved);
            return parsedLegacy;
          }
        }
        return INITIAL_BOOKS;
      }

      // For any other month/year that has no saved data yet:
      // Inherit book catalog definitions (names, prices, costs) with clean 0 sales/receipts
      const fallbackSource = localStorage.getItem(getMonthlyStorageKey(2026, 11))
        || localStorage.getItem(LEGACY_STORAGE_KEY);
      const baseCatalog = fallbackSource ? JSON.parse(fallbackSource) : INITIAL_BOOKS;
      return createFreshMonthBooks(baseCatalog);
    } catch (e) {
      console.error('Failed to load books for period:', e);
      return INITIAL_BOOKS;
    }
  };

  // State: books for the active month/year
  const [books, setBooks] = useState<BookRecord[]>(() => {
    return loadBooksForPeriod(selectedYear, selectedMonth);
  });

  // State: Press Payments Ledger
  const [pressPayments, setPressPayments] = useState<PressPaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(PRESS_PAYMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRESS_PAYMENTS;
  });

  // State: Channel Collections Ledger
  const [channelCollections, setChannelCollections] = useState<ChannelCollectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(CHANNEL_COLLECTIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CHANNEL_COLLECTIONS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMatrixBookId, setSelectedMatrixBookId] = useState<string>(books[0]?.id || 'book-1');

  // Input states
  const [entrySelectedDay, setEntrySelectedDay] = useState<number>(1);
  const [entrySelectedBookId, setEntrySelectedBookId] = useState<string>(books[0]?.id || 'book-1');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRecord | null>(null);

  const [isDailyEntryModalOpen, setIsDailyEntryModalOpen] = useState(false);
  const [modalBookId, setModalBookId] = useState<string>(books[0]?.id || 'book-1');

  const [isExcelSyncOpen, setIsExcelSyncOpen] = useState(false);

  // Accounts Modals
  const [isPressPaymentModalOpen, setIsPressPaymentModalOpen] = useState(false);
  const [isChannelCollectionModalOpen, setIsChannelCollectionModalOpen] = useState(false);
  const [selectedChannelForCollection, setSelectedChannelForCollection] = useState<string | undefined>(undefined);

  // Auto-save month & year selection
  useEffect(() => {
    try {
      localStorage.setItem(YEAR_STORAGE_KEY, String(selectedYear));
      localStorage.setItem(MONTH_STORAGE_KEY, String(selectedMonth));
    } catch (e) {
      console.error(e);
    }
  }, [selectedYear, selectedMonth]);

  // Auto-save active month's books to its dedicated localStorage key
  useEffect(() => {
    try {
      const key = getMonthlyStorageKey(selectedYear, selectedMonth);
      localStorage.setItem(key, JSON.stringify(books));
    } catch (e) {
      console.error('Failed to save books to localStorage:', e);
    }
  }, [books, selectedYear, selectedMonth]);

  // Auto-save Press Payments
  useEffect(() => {
    try {
      localStorage.setItem(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(pressPayments));
    } catch (e) {
      console.error(e);
    }
  }, [pressPayments]);

  // Auto-save Channel Collections
  useEffect(() => {
    try {
      localStorage.setItem(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(channelCollections));
    } catch (e) {
      console.error(e);
    }
  }, [channelCollections]);

  // Switch month and year safely
  const handleSelectPeriod = (newMonth: number, newYear: number) => {
    try {
      const currentKey = getMonthlyStorageKey(selectedYear, selectedMonth);
      localStorage.setItem(currentKey, JSON.stringify(books));
    } catch (e) {
      console.error(e);
    }

    const newBooks = loadBooksForPeriod(newYear, newMonth);
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setBooks(newBooks);

    const maxDays = getDaysInMonth(newYear, newMonth);
    setEntrySelectedDay(prev => Math.min(prev, maxDays));
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      handleSelectPeriod(12, selectedYear - 1);
    } else {
      handleSelectPeriod(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      handleSelectPeriod(1, selectedYear + 1);
    } else {
      handleSelectPeriod(selectedMonth + 1, selectedYear);
    }
  };

  // Handle saving daily entry
  const handleSaveDailyEntry = (
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
  ) => {
    setBooks(prev =>
      prev.map(b => {
        if (b.id !== bookId) return b;

        return {
          ...b,
          pressDailyReceipts: { ...b.pressDailyReceipts, [day]: data.pressReceipt },
          boibari: { ...b.boibari, [day]: data.boibari },
          rokomari: { ...b.rokomari, [day]: data.rokomari },
          wafilife: { ...b.wafilife, [day]: data.wafilife },
          othersOnline: { ...b.othersOnline, [day]: data.othersOnline },
          headOfficeSellOffline: { ...b.headOfficeSellOffline, [day]: data.headOfficeOffline },
          nilkhetLibrary: { ...b.nilkhetLibrary, [day]: data.nilkhet },
          sumonaLibrary: { ...b.sumonaLibrary, [day]: data.sumona },
          promiseLibrary: { ...b.promiseLibrary, [day]: data.promise },
          joystarLibrary: { ...b.joystarLibrary, [day]: data.joystar },
          dailyReturns: { ...b.dailyReturns, [day]: data.returns },
          marketing: data.marketing,
          service: data.service,
          adVideoMaking: data.adVideoMaking,
          rd: data.rd,
          gift: data.gift,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Handle inline cell update from Matrix view
  const handleUpdateDailyCell = (bookId: string, channelKey: string, day: number, value: number) => {
    setBooks(prev =>
      prev.map(b => {
        if (b.id !== bookId) return b;
        const currentChannelMap = (b as any)[channelKey] || {};
        return {
          ...b,
          [channelKey]: {
            ...currentChannelMap,
            [day]: value,
          },
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Handle adding or editing a book
  const handleSaveBook = (bookData: Partial<BookRecord>) => {
    if (editingBook) {
      setBooks(prev =>
        prev.map(b => (b.id === editingBook.id ? ({ ...b, ...bookData } as BookRecord) : b))
      );
    } else {
      const newBook: BookRecord = {
        id: `book-${Date.now()}`,
        sl: books.length + 1,
        bookName: bookData.bookName || 'নতুন বই',
        adCost: Number(bookData.adCost) || 0,
        makingCost: Number(bookData.makingCost) || 0,
        perBookAmount: Number(bookData.perBookAmount) || 0,
        profitPerBook:
          (Number(bookData.perBookAmount) || 0) -
          ((Number(bookData.adCost) || 0) + (Number(bookData.makingCost) || 0)),
        totalOrderFaridBhai: Number(bookData.totalOrderFaridBhai) || 0,
        pressDailyReceipts: {},
        boibari: {},
        rokomari: {},
        wafilife: {},
        othersOnline: {},
        headOfficeSellOffline: {},
        nilkhetLibrary: {},
        sumonaLibrary: {},
        promiseLibrary: {},
        joystarLibrary: {},
        dailyReturns: {},
        marketing: 0,
        service: 0,
        adVideoMaking: 0,
        rd: 0,
        gift: 0,
        remarks: bookData.remarks || '',
        updatedAt: new Date().toISOString(),
      };
      setBooks(prev => [...prev, newBook]);
    }
    setEditingBook(null);
  };

  // Handle deleting a book
  const handleDeleteBook = (bookId: string) => {
    const target = books.find(b => b.id === bookId);
    if (!target) return;
    if (window.confirm(`আপনি কি নিশ্চিত যে "${target.bookName}" তালিকা থেকে মুছে ফেলতে চান?`)) {
      setBooks(prev => prev.filter(b => b.id !== bookId));
    }
  };

  // Press Payment Actions
  const handleAddPressPayment = (payment: Omit<PressPaymentRecord, 'id' | 'createdAt'>) => {
    const newRecord: PressPaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPressPayments(prev => [newRecord, ...prev]);
  };

  const handleDeletePressPayment = (id: string) => {
    setPressPayments(prev => prev.filter(p => p.id !== id));
  };

  // Channel Collection Actions
  const handleAddChannelCollection = (collection: Omit<ChannelCollectionRecord, 'id' | 'createdAt'>) => {
    const newRecord: ChannelCollectionRecord = {
      ...collection,
      id: `col-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setChannelCollections(prev => [newRecord, ...prev]);
  };

  const handleDeleteChannelCollection = (id: string) => {
    setChannelCollections(prev => prev.filter(c => c.id !== id));
  };

  const handleOpenAddChannelCollection = (channelKey?: string) => {
    setSelectedChannelForCollection(channelKey);
    setIsChannelCollectionModalOpen(true);
  };

  // Open triggers
  const handleOpenDailyEntryForBook = (bookId: string) => {
    setModalBookId(bookId);
    setIsDailyEntryModalOpen(true);
  };

  const handleSelectBookForMatrix = (bookId: string) => {
    setSelectedMatrixBookId(bookId);
    setActiveTab('matrix');
  };

  const handleOpenEditBook = (book: BookRecord) => {
    setEditingBook(book);
    setIsAddEditOpen(true);
  };

  // Navigation handlers from Period View to Quick Data Entry
  const handleOpenDailyEntryForDay = (day: number) => {
    setEntrySelectedDay(day);
    setActiveTab('entry');
  };

  const handleOpenDailyEntryForBookAndDay = (bookId: string, day: number) => {
    setEntrySelectedBookId(bookId);
    setEntrySelectedDay(day);
    setActiveTab('entry');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-zinc-900">
      
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddBook={() => {
          setEditingBook(null);
          setIsAddEditOpen(true);
        }}
        onOpenDailyEntry={() => {
          setActiveTab('entry');
        }}
        onExportExcel={() => exportBooksToExcel(books, selectedMonth, selectedYear)}
        onOpenImport={() => setIsExcelSyncOpen(true)}
        onPrint={() => setActiveTab('reports')}
        bookCount={books.length}
        zoom={uiZoom}
        onSetZoom={setUiZoom}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onSelectPeriod={handleSelectPeriod}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 1. Main Dashboard */}
        {activeTab === 'dashboard' && (
          <Dashboard
            books={books}
            onSelectBookForMatrix={handleSelectBookForMatrix}
            onOpenDailyEntryForBook={handleOpenDailyEntryForBook}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
          />
        )}

        {/* 2. Daily / Weekly / Monthly / 3-Month / 6-Month / Yearly / Custom Period View */}
        {activeTab === 'period' && (
          <PeriodViewSystem
            books={books}
            onOpenDailyEntryForDay={handleOpenDailyEntryForDay}
            onOpenDailyEntryForBookAndDay={handleOpenDailyEntryForBookAndDay}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
            pressPayments={pressPayments}
            channelCollections={channelCollections}
          />
        )}

        {/* 3. Accounts & Due Ledger (প্রেস হিসাব ও অনলাইন-অফলাইন ডিউ খতিয়ান) */}
        {activeTab === 'accounts' && (
          <AccountsDueLedger
            books={books}
            pressPayments={pressPayments}
            channelCollections={channelCollections}
            onAddPressPayment={() => setIsPressPaymentModalOpen(true)}
            onDeletePressPayment={handleDeletePressPayment}
            onAddChannelCollection={handleOpenAddChannelCollection}
            onDeleteChannelCollection={handleDeleteChannelCollection}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        )}

        {/* 4. Simple Data Input System */}
        {activeTab === 'entry' && (
          <QuickDataEntry
            books={books}
            initialBookId={entrySelectedBookId}
            initialDay={entrySelectedDay}
            onSaveDailyEntry={handleSaveDailyEntry}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
          />
        )}

        {/* 5. Books Master Table */}
        {activeTab === 'books' && (
          <BooksTable
            books={books}
            onSelectBookForMatrix={handleSelectBookForMatrix}
            onOpenDailyEntryForBook={handleOpenDailyEntryForBook}
            onOpenEditBook={handleOpenEditBook}
            onDeleteBook={handleDeleteBook}
            onOpenAddBook={() => {
              setEditingBook(null);
              setIsAddEditOpen(true);
            }}
          />
        )}

        {/* 6. 31-Day Matrix View */}
        {activeTab === 'matrix' && (
          <BookDetailMatrix
            books={books}
            selectedBookId={selectedMatrixBookId}
            onSelectBook={setSelectedMatrixBookId}
            onUpdateDailyCell={handleUpdateDailyCell}
            onBackToDashboard={() => setActiveTab('dashboard')}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
          />
        )}

        {/* 7. Executive Reports & Print */}
        {activeTab === 'reports' && (
          <PrintableReport 
            books={books} 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
            pressPayments={pressPayments}
            channelCollections={channelCollections}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-zinc-200/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <div>
            © {selectedYear} <b>বিদ্যাবাড়ি পাবলিকেশন (Biddabari Publication)</b>. সর্বস্বত্ব সংরক্ষিত। ({formatMonthYearBengali(selectedMonth, selectedYear)})
          </div>
          <div className="flex items-center gap-3">
            <span>প্রেস পেমেন্ট ও চ্যানেল ডিউ ট্র্যাকিং সক্রিয়</span>
            <span>•</span>
            <button
              onClick={() => exportBooksToExcel(books, selectedMonth, selectedYear)}
              className="text-zinc-900 hover:underline font-semibold"
            >
              এক্সেল এক্সপোর্ট
            </button>
            <span>•</span>
            <a
              href="/biddabari_publication_books_data.xlsx"
              download="biddabari publication all books data.xlsx"
              className="text-zinc-600 hover:underline"
            >
              মূল ফাইল ডাউনলোড
            </a>
          </div>
        </div>
      </footer>

      {/* Popups / Modals */}
      <DailyEntryModal
        isOpen={isDailyEntryModalOpen}
        onClose={() => setIsDailyEntryModalOpen(false)}
        books={books}
        initialBookId={modalBookId}
        onSaveDailyEntry={handleSaveDailyEntry}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        daysInMonth={daysInMonth}
      />

      <AddEditBookModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingBook(null);
        }}
        editingBook={editingBook}
        onSaveBook={handleSaveBook}
        nextSl={books.length + 1}
      />

      <ExcelSyncModal
        isOpen={isExcelSyncOpen}
        onClose={() => setIsExcelSyncOpen(false)}
        books={books}
        onImportSuccess={(newBooks) => setBooks(newBooks)}
      />

      {/* Press Payment Voucher Modal */}
      <AddPressPaymentModal
        isOpen={isPressPaymentModalOpen}
        onClose={() => setIsPressPaymentModalOpen(false)}
        books={books}
        onSavePayment={handleAddPressPayment}
      />

      {/* Channel Collection Receipt Modal */}
      <AddChannelCollectionModal
        isOpen={isChannelCollectionModalOpen}
        onClose={() => setIsChannelCollectionModalOpen(false)}
        onSaveCollection={handleAddChannelCollection}
        initialChannelKey={selectedChannelForCollection}
      />

    </div>
  );
};

export default App;
