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
import { exportBooksToExcel } from './utils/excelHandler';

const STORAGE_KEY = 'biddabari_books_data_v1';

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

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRecord | null>(null);

  const [isDailyEntryOpen, setIsDailyEntryOpen] = useState(false);
  const [dailyEntryBookId, setDailyEntryBookId] = useState<string>(books[0]?.id || 'book-1');

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

  // Open modal triggers
  const handleOpenDailyEntryForBook = (bookId: string) => {
    setDailyEntryBookId(bookId);
    setIsDailyEntryOpen(true);
  };

  const handleSelectBookForMatrix = (bookId: string) => {
    setSelectedMatrixBookId(bookId);
    setActiveTab('matrix');
  };

  const handleOpenEditBook = (book: BookRecord) => {
    setEditingBook(book);
    setIsAddEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddBook={() => {
          setEditingBook(null);
          setIsAddEditOpen(true);
        }}
        onOpenDailyEntry={() => {
          setDailyEntryBookId(books[0]?.id || '');
          setIsDailyEntryOpen(true);
        }}
        onExportExcel={() => exportBooksToExcel(books)}
        onOpenImport={() => setIsExcelSyncOpen(true)}
        onResetData={handleResetData}
        onPrint={() => setActiveTab('reports')}
        bookCount={books.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            books={books}
            onSelectBookForMatrix={handleSelectBookForMatrix}
            onOpenDailyEntryForBook={handleOpenDailyEntryForBook}
          />
        )}

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

        {activeTab === 'entry' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              দৈনিক এন্ট্রি ফরম (Daily Input Form)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              নিচের বোতামে ক্লিক করে যেকোনো বই এবং দিনের সেলস বা প্রেস ডাটা এন্ট্রি দিন
            </p>
            <button
              onClick={() => setIsDailyEntryOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-sm transition-all"
            >
              <span>এন্ট্রি উইন্ডো খুলুন</span>
            </button>
          </div>
        )}

        {activeTab === 'matrix' && (
          <BookDetailMatrix
            books={books}
            selectedBookId={selectedMatrixBookId}
            onSelectBook={setSelectedMatrixBookId}
            onUpdateDailyCell={handleUpdateDailyCell}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'reports' && <PrintableReport books={books} />}
      </main>

      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            © {new Date().getFullYear()} <b>বিদ্যাবাড়ি পাবলিকেশন (Biddabari Publication)</b>. সর্বস্বত্ব সংরক্ষিত।
          </div>
          <div className="flex items-center gap-3">
            <span>অরিজিনাল এক্সেল ডাটাবেস ইন্টিগ্রেটেড</span>
            <span>•</span>
            <button
              onClick={() => exportBooksToExcel(books)}
              className="text-rose-700 hover:underline font-medium"
            >
              এক্সেল এক্সপোর্ট
            </button>
            <span>•</span>
            <a
              href="/biddabari_publication_books_data.xlsx"
              download="biddabari publication all books data.xlsx"
              className="text-slate-600 hover:underline"
            >
              মূল ফাইল ডাউনলোড
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DailyEntryModal
        isOpen={isDailyEntryOpen || activeTab === 'entry'}
        onClose={() => {
          setIsDailyEntryOpen(false);
          if (activeTab === 'entry') setActiveTab('dashboard');
        }}
        books={books}
        initialBookId={dailyEntryBookId}
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
