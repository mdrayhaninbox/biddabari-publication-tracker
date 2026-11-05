import React, { useState, useEffect } from 'react';
import { BookRecord, ActiveTab } from './types/book';
import { INITIAL_BOOKS } from './data/initialBooks';
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
import { exportBooksToExcel } from './utils/excelHandler';

const STORAGE_KEY = 'biddabari_books_data_v1';
const ZOOM_STORAGE_KEY = 'biddabari_ui_zoom_v1';

export const App: React.FC = () => {
  // Load initial books from localStorage if available
  const [books, setBooks] = useState<BookRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved books:', e);
    }
    return INITIAL_BOOKS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMatrixBookId, setSelectedMatrixBookId] = useState<string>(books[0]?.id || 'book-1');

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

  // Input states
  const [entrySelectedDay, setEntrySelectedDay] = useState<number>(1);
  const [entrySelectedBookId, setEntrySelectedBookId] = useState<string>(books[0]?.id || 'book-1');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRecord | null>(null);

  const [isDailyEntryModalOpen, setIsDailyEntryModalOpen] = useState(false);
  const [modalBookId, setModalBookId] = useState<string>(books[0]?.id || 'book-1');

  const [isExcelSyncOpen, setIsExcelSyncOpen] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [books]);

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

  // Handle restoring initial Excel data
  const handleResetData = () => {
    if (
      window.confirm(
        'আপনি কি মূল এক্সেল ফাইলের ডাটাতে ফিরে যেতে চান? আপনার তৈরি নতুন পরিবর্তন রিসেট হবে।'
      )
    ) {
      setBooks(INITIAL_BOOKS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKS));
    }
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
        onExportExcel={() => exportBooksToExcel(books)}
        onOpenImport={() => setIsExcelSyncOpen(true)}
        onResetData={handleResetData}
        onPrint={() => setActiveTab('reports')}
        bookCount={books.length}
        zoom={uiZoom}
        onSetZoom={setUiZoom}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 1. Main Dashboard */}
        {activeTab === 'dashboard' && (
          <Dashboard
            books={books}
            onSelectBookForMatrix={handleSelectBookForMatrix}
            onOpenDailyEntryForBook={handleOpenDailyEntryForBook}
          />
        )}

        {/* 2. Daily / Weekly / Monthly Period View System */}
        {activeTab === 'period' && (
          <PeriodViewSystem
            books={books}
            onOpenDailyEntryForDay={handleOpenDailyEntryForDay}
            onOpenDailyEntryForBookAndDay={handleOpenDailyEntryForBookAndDay}
          />
        )}

        {/* 3. Simple Data Input System */}
        {activeTab === 'entry' && (
          <QuickDataEntry
            books={books}
            initialBookId={entrySelectedBookId}
            initialDay={entrySelectedDay}
            onSaveDailyEntry={handleSaveDailyEntry}
          />
        )}

        {/* 4. Books Master Table */}
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

        {/* 5. 31-Day Matrix View */}
        {activeTab === 'matrix' && (
          <BookDetailMatrix
            books={books}
            selectedBookId={selectedMatrixBookId}
            onSelectBook={setSelectedMatrixBookId}
            onUpdateDailyCell={handleUpdateDailyCell}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* 6. Executive Reports & Print */}
        {activeTab === 'reports' && <PrintableReport books={books} />}
      </main>

      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-zinc-200/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <div>
            © {new Date().getFullYear()} <b>বিদ্যাবাড়ি পাবলিকেশন (Biddabari Publication)</b>. সর্বস্বত্ব সংরক্ষিত।
          </div>
          <div className="flex items-center gap-3">
            <span>অরিজিনাল এক্সেল ডাটাবেস ইন্টিগ্রেটেড</span>
            <span>•</span>
            <button
              onClick={() => exportBooksToExcel(books)}
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

    </div>
  );
};

export default App;
