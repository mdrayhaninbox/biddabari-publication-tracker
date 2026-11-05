import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Calendar, 
  Check, 
  Edit2, 
  TrendingUp, 
  Boxes, 
  Warehouse, 
  ShoppingBag, 
  ArrowLeft 
} from 'lucide-react';
import { BookRecord, DailyChannelSales } from '../types/book';
import { calculateBookMetrics, formatBDT, formatNumber, sumDaily } from '../utils/calculations';

interface BookDetailMatrixProps {
  books: BookRecord[];
  selectedBookId: string;
  onSelectBook: (bookId: string) => void;
  onUpdateDailyCell: (bookId: string, channelKey: string, day: number, value: number) => void;
  onBackToDashboard: () => void;
}

export const BookDetailMatrix: React.FC<BookDetailMatrixProps> = ({
  books,
  selectedBookId,
  onSelectBook,
  onUpdateDailyCell,
  onBackToDashboard,
}) => {
  const currentBook = books.find(b => b.id === selectedBookId) || books[0];

  // Inline edit state
  const [editingCell, setEditingCell] = useState<{ channelKey: string; day: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (!currentBook) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        কোনো বই পাওয়া যায়নি।
      </div>
    );
  }

  const m = calculateBookMetrics(currentBook);

  const startEdit = (channelKey: string, day: number, currentValue: number) => {
    setEditingCell({ channelKey, day });
    setEditValue(currentValue ? String(currentValue) : '');
  };

  const saveEdit = () => {
    if (editingCell) {
      const val = Math.max(0, parseInt(editValue) || 0);
      onUpdateDailyCell(currentBook.id, editingCell.channelKey, editingCell.day, val);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Channels to render in matrix
  const matrixRows = [
    {
      key: 'pressDailyReceipts',
      title: 'ফরিদ ভাই থেকে হেড অফিসে প্রাপ্ত (Press)',
      salesMap: currentBook.pressDailyReceipts,
      category: 'press',
      bgHeader: 'bg-amber-100 text-amber-900',
    },
    {
      key: 'boibari',
      title: 'বইবাড়ি (Boibari Online)',
      salesMap: currentBook.boibari,
      category: 'online',
      bgHeader: 'bg-sky-50 text-sky-900',
    },
    {
      key: 'rokomari',
      title: 'রকমারি (Rokomari Online)',
      salesMap: currentBook.rokomari,
      category: 'online',
      bgHeader: 'bg-sky-50 text-sky-900',
    },
    {
      key: 'wafilife',
      title: 'ওয়াফিলাইফ (Wafilife Online)',
      salesMap: currentBook.wafilife,
      category: 'online',
      bgHeader: 'bg-sky-50 text-sky-900',
    },
    {
      key: 'othersOnline',
      title: 'অন্যান্য অনলাইন লাইব্রেরি',
      salesMap: currentBook.othersOnline,
      category: 'online',
      bgHeader: 'bg-sky-50 text-sky-900',
    },
    {
      key: 'headOfficeSellOffline',
      title: 'হেড অফিস সেল অফলাইন (HO)',
      salesMap: currentBook.headOfficeSellOffline,
      category: 'offline',
      bgHeader: 'bg-purple-50 text-purple-900',
    },
    {
      key: 'nilkhetLibrary',
      title: 'নীলক্ষেত লাইব্রেরি (Nilkhet)',
      salesMap: currentBook.nilkhetLibrary,
      category: 'offline',
      bgHeader: 'bg-purple-50 text-purple-900',
    },
    {
      key: 'sumonaLibrary',
      title: 'সুমনা লাইব্রেরি (Sumona - প্রেস)',
      salesMap: currentBook.sumonaLibrary,
      category: 'offline-press',
      bgHeader: 'bg-purple-50 text-purple-900',
    },
    {
      key: 'promiseLibrary',
      title: 'প্রমিজ লাইব্রেরি (Promise - প্রেস)',
      salesMap: currentBook.promiseLibrary,
      category: 'offline-press',
      bgHeader: 'bg-purple-50 text-purple-900',
    },
    {
      key: 'joystarLibrary',
      title: 'জয়স্টার লাইব্রেরি (Joystar - প্রেস)',
      salesMap: currentBook.joystarLibrary,
      category: 'offline-press',
      bgHeader: 'bg-purple-50 text-purple-900',
    },
    {
      key: 'dailyReturns',
      title: 'দৈনিক রিটার্ন (Daily Return to HO)',
      salesMap: currentBook.dailyReturns,
      category: 'returns',
      bgHeader: 'bg-rose-100 text-rose-900',
    },
  ];

  return (
    <div className="space-y-5">
      
      {/* Top Navigation & Book Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="ড্যাশবোর্ডে ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-rose-700" />
              <h2 className="text-lg font-bold text-slate-900">
                ৩১ দিনের সম্পূর্ণ সেলস ও প্রেস খতিয়ান ম্যাট্রিক্স
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              যেকোনো ঘরে ক্লিক করে সরাসরি মান এডিট করা যাবে
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">বই নির্বাচন:</span>
          <select
            value={currentBook.id}
            onChange={(e) => onSelectBook(e.target.value)}
            className="text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-rose-500"
          >
            {books.map(b => (
              <option key={b.id} value={b.id}>
                {b.sl}. {b.bookName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Book Quick Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block">বিক্রয় মূল্য (MRP)</span>
          <span className="text-base font-bold text-slate-800">{formatBDT(m.perBookAmount)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block">কপি প্রতি নিট লাভ</span>
          <span className="text-base font-bold text-emerald-700">+{formatBDT(m.profitPerBook)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block">প্রেস অর্ডার</span>
          <span className="text-base font-bold text-slate-800">{formatNumber(m.totalOrderFaridBhai)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block">হেড অফিস স্টক</span>
          <span className="text-base font-bold text-rose-700">{formatNumber(m.totalPresentStockHO)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block">প্রেস স্টক (Farid Bhai)</span>
          <span className="text-base font-bold text-amber-700">{formatNumber(m.stockToFaridBhai)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block">সর্বমোট বিক্রি</span>
          <span className="text-base font-bold text-blue-700">{formatNumber(m.totalSold)}</span>
        </div>
      </div>

      {/* 31-Day Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3 sticky left-0 z-20 bg-slate-100 min-w-[220px] shadow-sm">
                  চ্যানেল / খাত
                </th>
                <th className="py-2.5 px-3 text-center bg-slate-200/80 font-bold min-w-[70px]">
                  মোট
                </th>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <th key={day} className="py-2 px-1 text-center min-w-[42px] font-mono text-[11px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixRows.map(row => {
                const total = sumDaily(row.salesMap);
                return (
                  <tr key={row.key} className="hover:bg-slate-50 transition-colors">
                    {/* Sticky Channel Title */}
                    <td className={`py-2.5 px-3 font-medium sticky left-0 z-10 shadow-xs border-r border-slate-200 bg-white ${row.bgHeader}`}>
                      {row.title}
                    </td>

                    {/* Channel Total */}
                    <td className="py-2 px-3 text-center font-bold bg-slate-50/80 border-r border-slate-200 text-slate-900">
                      {total ? formatNumber(total) : '-'}
                    </td>

                    {/* Days 1 to 31 */}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                      const val = row.salesMap?.[day] || 0;
                      const isEditing = editingCell?.channelKey === row.key && editingCell?.day === day;

                      return (
                        <td
                          key={day}
                          onClick={() => !isEditing && startEdit(row.key, day, val)}
                          className={`py-1.5 px-1 text-center border-r border-slate-100 font-mono cursor-pointer transition-colors ${
                            val > 0
                              ? 'bg-rose-50/50 text-slate-900 font-semibold hover:bg-rose-100/60'
                              : 'text-slate-300 hover:bg-slate-100/80'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center justify-center">
                              <input
                                autoFocus
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={handleKeyDown}
                                className="w-10 text-center text-xs font-bold bg-white border border-rose-500 rounded p-0.5 focus:outline-hidden"
                              />
                            </div>
                          ) : (
                            <span>{val > 0 ? val : '·'}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Aggregates Row: Daily Total Sales (Online + Offline) */}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-2.5 px-3 sticky left-0 z-10 bg-slate-100 shadow-xs border-r border-slate-200">
                  সর্বমোট দৈনিক বিক্রয় (Online+Offline)
                </td>
                <td className="py-2.5 px-3 text-center bg-slate-200 border-r border-slate-200 text-blue-800 text-sm">
                  {formatNumber(m.totalSold)}
                </td>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                  const dayTotal = 
                    (currentBook.boibari[day] || 0) +
                    (currentBook.rokomari[day] || 0) +
                    (currentBook.wafilife[day] || 0) +
                    (currentBook.othersOnline[day] || 0) +
                    (currentBook.headOfficeSellOffline[day] || 0) +
                    (currentBook.nilkhetLibrary[day] || 0) +
                    (currentBook.sumonaLibrary[day] || 0) +
                    (currentBook.promiseLibrary[day] || 0) +
                    (currentBook.joystarLibrary[day] || 0);

                  return (
                    <td key={day} className="py-2 px-1 text-center font-mono border-r border-slate-200 text-blue-700">
                      {dayTotal > 0 ? dayTotal : '-'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>💡 টিপস: যেকোনো দিনের ঘরে ক্লিক করে সরাসরি সংখ্যা পরিবর্তন ও সেভ করতে পারেন।</span>
        <span>মার্কেটিং ও উপহার কপি: {m.totalPromo} কপি</span>
      </div>

    </div>
  );
};
