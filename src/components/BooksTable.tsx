import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  CalendarPlus, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';
import { BookRecord } from '../types/book';
import { calculateBookMetrics, formatBDT, formatNumber } from '../utils/calculations';

interface BooksTableProps {
  books: BookRecord[];
  onSelectBookForMatrix: (bookId: string) => void;
  onOpenDailyEntryForBook: (bookId: string) => void;
  onOpenEditBook: (book: BookRecord) => void;
  onDeleteBook: (bookId: string) => void;
  onOpenAddBook: () => void;
}

export const BooksTable: React.FC<BooksTableProps> = ({
  books,
  onSelectBookForMatrix,
  onOpenDailyEntryForBook,
  onOpenEditBook,
  onDeleteBook,
  onOpenAddBook,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'sl' | 'name' | 'stock' | 'sold' | 'profit'>('sl');

  const filteredBooks = books.filter(b => 
    b.bookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.remarks && b.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const ma = calculateBookMetrics(a);
    const mb = calculateBookMetrics(b);
    if (sortBy === 'name') return a.bookName.localeCompare(b.bookName, 'bn');
    if (sortBy === 'stock') return mb.totalPresentStockHO - ma.totalPresentStockHO;
    if (sortBy === 'sold') return mb.totalSold - ma.totalSold;
    if (sortBy === 'profit') return mb.totalNetProfit - ma.totalNetProfit;
    return a.sl - b.sl;
  });

  return (
    <div className="space-y-4">
      
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="বইয়ের নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-slate-50/50"
          />
        </div>

        {/* Sort & Add Button */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          >
            <option value="sl">ক্রমিক নং (ডিফল্ট)</option>
            <option value="name">নাম অনুযায়ী</option>
            <option value="stock">সর্বোচ্চ স্টক</option>
            <option value="sold">সর্বোচ্চ বিক্রি</option>
            <option value="profit">সর্বোচ্চ নিট লাভ</option>
          </select>

          <button
            onClick={onOpenAddBook}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বই</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-3 px-3 w-12 text-center">SL</th>
                <th className="py-3 px-4 min-w-[200px]">বইয়ের নাম</th>
                <th className="py-3 px-3 text-right">মূল্য (MRP)</th>
                <th className="py-3 px-3 text-right">উৎপাদন খরচ</th>
                <th className="py-3 px-3 text-right">লাভ / কপি</th>
                <th className="py-3 px-3 text-center">প্রেস অর্ডার</th>
                <th className="py-3 px-3 text-center">প্রেস স্টক</th>
                <th className="py-3 px-3 text-center bg-rose-50/60 text-rose-900">হেড অফিস স্টক</th>
                <th className="py-3 px-3 text-center">অনলাইন বিক্রি</th>
                <th className="py-3 px-3 text-center">অফলাইন বিক্রি</th>
                <th className="py-3 px-3 text-center font-bold">মোট বিক্রি</th>
                <th className="py-3 px-3 text-right">মোট রাজস্ব</th>
                <th className="py-3 px-3 text-right text-emerald-800 font-bold bg-emerald-50/60">নিট লাভ</th>
                <th className="py-3 px-4 text-center min-w-[170px]">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedBooks.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500">
                    কোনো বইয়ের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                sortedBooks.map((book) => {
                  const m = calculateBookMetrics(book);
                  const isLowStock = m.totalPresentStockHO < 300;

                  return (
                    <tr key={book.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-600">
                        {book.sl}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {book.bookName}
                        </div>
                        {book.remarks && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                            {book.remarks}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-800">
                        {formatBDT(m.perBookAmount)}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatBDT(m.makingCost)}
                        <span className="block text-[10px] text-slate-400">অ্যাড: {m.adCost}৳</span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          +{formatBDT(m.profitPerBook)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {formatNumber(m.totalOrderFaridBhai)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-amber-700">
                          {formatNumber(m.stockToFaridBhai)}
                        </span>
                        <span className="block text-[10px] text-slate-400">প্রাপ্ত: {formatNumber(m.faridBhaiToHeadOffice)}</span>
                      </td>

                      <td className="py-3 px-3 text-center bg-rose-50/50">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatNumber(m.totalPresentStockHO)}
                        </span>
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-medium">
                            <AlertTriangle className="w-2.5 h-2.5" /> লো স্টক
                          </span>
                        ) : (
                          <span className="block text-[10px] text-emerald-600 font-medium">উপলব্ধ</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center text-sky-700 font-medium">
                        {formatNumber(m.totalOnlineSell)}
                      </td>

                      <td className="py-3 px-3 text-center text-purple-700 font-medium">
                        {formatNumber(m.totalOfflineSell)}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-blue-700 text-sm">
                        {formatNumber(m.totalSold)}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-800">
                        {formatBDT(m.totalRevenue)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-700 bg-emerald-50/40 text-sm">
                        {formatBDT(m.totalNetProfit)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenDailyEntryForBook(book.id)}
                            className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-md transition-colors"
                            title="দৈনিক বিক্রয় ও স্টক এন্ট্রি দিন"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onSelectBookForMatrix(book.id)}
                            className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                            title="৩১ দিনের সম্পূর্ণ ম্যাট্রিক্স দেখুন"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenEditBook(book)}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                            title="বইয়ের তথ্য এডিট করুন"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeleteBook(book.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                            title="মুছে ফেলুন"
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
