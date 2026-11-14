import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  CalendarPlus, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Printer,
  Layers,
  X
} from 'lucide-react';
import { BookRecord, DEFAULT_BOOK_CATEGORIES, getBookDisplayEdition } from '../types/book';
import { calculateBookMetrics, formatBDT, formatNumber } from '../utils/calculations';
import { Language, tr } from '../utils/i18n';

interface BooksTableProps {
  books: BookRecord[];
  onSelectBookForMatrix: (bookId: string) => void;
  onOpenDailyEntryForBook: (bookId: string) => void;
  onOpenEditBook: (book: BookRecord) => void;
  onDeleteBook: (bookId: string) => void;
  onOpenAddBook: () => void;
  onPrintSingleBook?: (bookId: string) => void;
  language?: Language;
  categories?: string[];
  onAddCategory?: (categoryName: string) => void;
  onDeleteCategory?: (categoryName: string) => void;
}

export const BooksTable: React.FC<BooksTableProps> = ({
  books,
  onSelectBookForMatrix,
  onOpenDailyEntryForBook,
  onOpenEditBook,
  onDeleteBook,
  onOpenAddBook,
  onPrintSingleBook,
  language = 'en',
  categories = DEFAULT_BOOK_CATEGORIES,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'sl' | 'name' | 'stock' | 'sold' | 'profit'>('sl');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  const bookMatchesCategory = (book: BookRecord, cat: string): boolean => {
    if (cat === 'all') return true;
    if (book.category && book.category.trim()) {
      return book.category.trim().toLowerCase() === cat.trim().toLowerCase();
    }
    // Fallback if not explicitly set: check if bookName contains category name
    return book.bookName.toLowerCase().includes(cat.toLowerCase());
  };

  const filteredBooks = books.filter(b => {
    const matchesSearch = 
      b.bookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.edition && b.edition.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.publishMonth && b.publishMonth.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.category && b.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.remarks && b.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = bookMatchesCategory(b, selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const ma = calculateBookMetrics(a);
    const mb = calculateBookMetrics(b);
    if (sortBy === 'name') return a.bookName.localeCompare(b.bookName, language === 'bn' ? 'bn' : 'en');
    if (sortBy === 'stock') return mb.totalPresentStockHO - ma.totalPresentStockHO;
    if (sortBy === 'sold') return mb.totalSold - ma.totalSold;
    if (sortBy === 'profit') return mb.totalNetProfit - ma.totalNetProfit;
    return a.sl - b.sl;
  });

  return (
    <div className="space-y-4">
      
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={tr('বইয়ের নাম দিয়ে খুঁজুন...', 'Search by book name...', language)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-zinc-900 bg-zinc-50/50"
          />
        </div>

        {/* Sort & Add Button */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold border border-zinc-300 rounded-xl px-3 py-2 bg-white text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
          >
            <option value="sl">{tr('ক্রমিক নং (ডিফল্ট)', 'Serial No (Default)', language)}</option>
            <option value="name">{tr('নাম অনুযায়ী', 'By Name', language)}</option>
            <option value="stock">{tr('সর্বোচ্চ স্টক', 'Highest Stock', language)}</option>
            <option value="sold">{tr('সর্বোচ্চ বিক্রি', 'Highest Sold', language)}</option>
            <option value="profit">{tr('সর্বোচ্চ নিট লাভ', 'Highest Net Profit', language)}</option>
          </select>

          <button
            onClick={onOpenAddBook}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('নতুন বই', 'New Book', language)}</span>
          </button>
        </div>
      </div>

      {/* Book Category Tab Bar (Directly below Search & Controls Bar) */}
      <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          <span className="text-xs font-bold text-zinc-600 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            {tr('বইয়ের ক্যাটেগরি:', 'Book Category:', language)}
          </span>

          {/* All Books Tab */}
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            <span>{tr('সকল বই (All Books)', 'All Books', language)}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
            }`}>
              {formatNumber(books.length, language)}
            </span>
          </button>

          {/* Dynamic Categories (NTRCA, Digest, custom categories) */}
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const count = books.filter(b => bookMatchesCategory(b, cat)).length;

            return (
              <div
                key={cat}
                className={`inline-flex items-center rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="px-3 py-1.5 flex items-center gap-1.5"
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {formatNumber(count, language)}
                  </span>
                </button>

                {/* Delete Category Button */}
                {onDeleteCategory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(tr(`আপনি কি নিশ্চিত যে "${cat}" ক্যাটেগরি মুছে ফেলতে চান? (বইগুলো মুছে যাবে না)`, `Are you sure you want to delete category "${cat}"? (Books will not be deleted)`, language))) {
                        onDeleteCategory(cat);
                        if (selectedCategory.toLowerCase() === cat.toLowerCase()) {
                          setSelectedCategory('all');
                        }
                      }
                    }}
                    title={tr(`"${cat}" ক্যাটেগরি মুছুন`, `Delete "${cat}" category`, language)}
                    className={`p-1 pr-2 rounded-r-xl transition-colors ${
                      isSelected ? 'text-blue-200 hover:text-white' : 'text-zinc-400 hover:text-red-600'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* + Custom Category Button / Inline Input */}
          {onAddCategory && (
            isAddingCategory ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = newCategoryInput.trim();
                  if (trimmed) {
                    onAddCategory(trimmed);
                    setSelectedCategory(trimmed);
                    setNewCategoryInput('');
                    setIsAddingCategory(false);
                  }
                }}
                className="inline-flex items-center gap-1 bg-zinc-100 border border-zinc-300 rounded-xl p-1 shadow-inner"
              >
                <input
                  type="text"
                  autoFocus
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder={tr('নতুন ক্যাটেগরির নাম...', 'New category name...', language)}
                  className="text-xs px-2.5 py-1 bg-white border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600 font-medium"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
                >
                  {tr('যোগ করুন', 'Add', language)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryInput('');
                  }}
                  className="p-1 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors shadow-xs"
                title={tr('নতুন কাস্টম ক্যাটেগরি যুক্ত করুন', 'Add custom book category', language)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tr('+ নতুন ক্যাটেগরি', '+ Custom Category', language)}</span>
              </button>
            )
          )}
        </div>

        {/* Active Category Filter Status */}
        {selectedCategory !== 'all' && (
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 font-medium shrink-0">
            <span>{tr('ফিল্টার:', 'Filter:', language)} <strong className="font-bold">{selectedCategory}</strong> ({formatNumber(filteredBooks.length, language)})</span>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-[11px] underline hover:text-blue-900 ml-1 font-semibold"
            >
              {tr('সকল বই দেখুন', 'View All', language)}
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <span>👉 {tr('সম্পূর্ণ তালিকা দেখতে ডানে স্ক্রোল করুন', 'Scroll right to view full table', language)}</span>
          <span className="font-mono text-[10px]">{formatNumber(sortedBooks.length, language)} {tr('টি বই', 'Books', language)}</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr className="bg-zinc-100 text-zinc-800 border-b border-zinc-200 font-bold">
                <th className="py-3 px-3 w-12 text-center">SL</th>
                <th className="py-3 px-4 min-w-[200px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                <th className="py-3 px-3 text-right">{tr('মূল্য (MRP)', 'Price (MRP)', language)}</th>
                <th className="py-3 px-3 text-right">{tr('উৎপাদন খরচ', 'Printing Cost', language)}</th>
                <th className="py-3 px-3 text-right">{tr('লাভ / কপি', 'Profit / Copy', language)}</th>
                <th className="py-3 px-3 text-center">{tr('প্রেস অর্ডার', 'Press Order', language)}</th>
                <th className="py-3 px-3 text-center">{tr('প্রেস স্টক', 'Press Stock', language)}</th>
                <th className="py-3 px-3 text-center bg-zinc-200/60 text-zinc-900">{tr('হেড অফিস স্টক', 'Head Office Stock', language)}</th>
                <th className="py-3 px-3 text-center">{tr('অনলাইন বিক্রি', 'Online Sold', language)}</th>
                <th className="py-3 px-3 text-center">{tr('অফলাইন বিক্রি', 'Offline Sold', language)}</th>
                <th className="py-3 px-3 text-center font-bold">{tr('মোট বিক্রি', 'Total Sold', language)}</th>
                <th className="py-3 px-3 text-right">{tr('মোট রাজস্ব', 'Total Revenue', language)}</th>
                <th className="py-3 px-3 text-right text-zinc-900 font-bold bg-zinc-100">{tr('নিট লাভ', 'Net Profit', language)}</th>
                <th className="py-3 px-4 text-center min-w-[170px]">{tr('অ্যাকশন', 'Actions', language)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sortedBooks.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-zinc-500">
                    {tr('কোনো বইয়ের রেকর্ড পাওয়া যায়নি।', 'No book records found.', language)}
                  </td>
                </tr>
              ) : (
                sortedBooks.map((book) => {
                  const m = calculateBookMetrics(book);
                  const isLowStock = m.totalPresentStockHO < 300;

                  return (
                    <tr key={book.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-medium text-zinc-600">
                        {book.sl}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 text-sm flex items-center gap-1.5 flex-wrap">
                          <span>{book.bookName}</span>
                          {book.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              📚 {book.category}
                            </span>
                          )}
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                            {getBookDisplayEdition(book, books)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5 flex-wrap">
                          {book.publishMonth && (
                            <span className="inline-flex items-center gap-1 text-zinc-600 font-semibold bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                              📅 {book.publishMonth}
                            </span>
                          )}
                          {book.remarks && (
                            <span className="text-zinc-400 truncate max-w-xs">
                              {book.remarks}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-zinc-900 font-mono">
                        {formatBDT(m.perBookAmount, language)}
                      </td>

                      <td className="py-3 px-3 text-right text-zinc-700">
                        <span className="font-mono">{formatBDT(m.makingCost, language)}</span>
                        <span className="block text-[10px] text-zinc-400">{tr('অ্যাড:', 'Ad:', language)} {m.adCost}৳</span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-zinc-100 text-zinc-900 border border-zinc-200 font-mono">
                          +{formatBDT(m.profitPerBook, language)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-medium text-zinc-700 font-mono">
                        {formatNumber(m.totalOrderFaridBhai, language)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-zinc-900 font-mono">
                          {formatNumber(m.stockToFaridBhai, language)}
                        </span>
                        <span className="block text-[10px] text-zinc-400 font-mono">{tr('প্রাপ্ত:', 'Rcvd:', language)} {formatNumber(m.faridBhaiToHeadOffice, language)}</span>
                      </td>

                      <td className="py-3 px-3 text-center bg-zinc-50">
                        <span className="font-bold text-zinc-900 text-sm font-mono">
                          {formatNumber(m.totalPresentStockHO, language)}
                        </span>
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-700 font-bold block">
                            <AlertTriangle className="w-2.5 h-2.5" /> {tr('লো স্টক', 'Low Stock', language)}
                          </span>
                        ) : (
                          <span className="block text-[10px] text-zinc-500">{tr('উপলব্ধ', 'Available', language)}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-medium text-zinc-800 font-mono">
                        {formatNumber(m.totalOnlineSell, language)}
                      </td>

                      <td className="py-3 px-3 text-center font-medium text-zinc-800 font-mono">
                        {formatNumber(m.totalOfflineSell, language)}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-zinc-900 text-sm font-mono">
                        {formatNumber(m.totalSold, language)}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-zinc-800 font-mono">
                        {formatBDT(m.totalRevenue, language)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-zinc-900 bg-zinc-50 text-sm font-mono">
                        +{formatBDT(m.totalNetProfit, language)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenDailyEntryForBook(book.id)}
                            className="p-1.5 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
                            title={tr('দৈনিক বিক্রয় ও স্টক এন্ট্রি দিন', 'Daily Sales & Stock Entry', language)}
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onSelectBookForMatrix(book.id)}
                            className="p-1.5 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
                            title={tr('৩১ দিনের সম্পূর্ণ ম্যাট্রিক্স দেখুন', 'View 31-Day Matrix', language)}
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>

                          {onPrintSingleBook && (
                            <button
                              onClick={() => onPrintSingleBook(book.id)}
                              className="p-1.5 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
                              title={tr('এই একক বইটির সম্পূর্ণ রিপোর্ট প্রিন্ট করুন', 'Print Single Book Report', language)}
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenEditBook(book)}
                            className="p-1.5 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
                            title={tr('বইয়ের তথ্য এডিট করুন', 'Edit Book Details', language)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(tr(`আপনি কি নিশ্চিত যে "${book.bookName}" বইটি মুছে ফেলতে চান?`, `Are you sure you want to delete "${book.bookName}"?`, language))) {
                                onDeleteBook(book.id);
                              }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-zinc-200"
                            title={tr('মুছে ফেলুন', 'Delete', language)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
