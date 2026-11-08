import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ArrowLeft 
} from 'lucide-react';
import { BookRecord } from '../types/book';
import { calculateBookMetrics, formatBDT, formatNumber, sumDaily, formatMonthYearBengali } from '../utils/calculations';

interface BookDetailMatrixProps {
  books: BookRecord[];
  selectedBookId: string;
  onSelectBook: (bookId: string) => void;
  onUpdateDailyCell: (bookId: string, channelKey: string, day: number, value: number) => void;
  onBackToDashboard: () => void;
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
}

export const BookDetailMatrix: React.FC<BookDetailMatrixProps> = ({
  books,
  selectedBookId,
  onSelectBook,
  onUpdateDailyCell,
  onBackToDashboard,
  selectedMonth = 11,
  selectedYear = 2026,
  daysInMonth = 30,
}) => {
  const currentBook = books.find(b => b.id === selectedBookId) || books[0];

  // Inline edit state
  const [editingCell, setEditingCell] = useState<{ channelKey: string; day: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (!currentBook) {
    return (
      <div className="p-8 text-center text-zinc-500 bg-white rounded-xl border border-zinc-200">
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
      bgHeader: 'bg-zinc-100 text-zinc-900',
    },
    {
      key: 'boibari',
      title: 'বইবাড়ি (Boibari Online)',
      salesMap: currentBook.boibari,
      bgHeader: 'bg-white text-zinc-800',
    },
    {
      key: 'rokomari',
      title: 'রকমারি (Rokomari Online)',
      salesMap: currentBook.rokomari,
      bgHeader: 'bg-white text-zinc-800',
    },
    {
      key: 'wafilife',
      title: 'ওয়াফিলাইফ (Wafilife Online)',
      salesMap: currentBook.wafilife,
      bgHeader: 'bg-white text-zinc-800',
    },
    {
      key: 'othersOnline',
      title: 'অন্যান্য অনলাইন লাইব্রেরি',
      salesMap: currentBook.othersOnline,
      bgHeader: 'bg-white text-zinc-800',
    },
    {
      key: 'headOfficeSellOffline',
      title: 'হেড অফিস সেল অফলাইন (HO)',
      salesMap: currentBook.headOfficeSellOffline,
      bgHeader: 'bg-white text-zinc-800',
    },
    {
      key: 'nilkhetLibrary',
      title: 'নীলক্ষেত লাইব্রেরি (Nilkhet)',
      salesMap: currentBook.nilkhetLibrary,
      bgHeader: 'bg-white text-zinc-800',
    },
    {
      key: 'sumonaLibrary',
      title: 'সুমনা লাইব্রেরি (Sumona - প্রেস)',
      salesMap: currentBook.sumonaLibrary,
      bgHeader: 'bg-white text-zinc-800',
    },
    {
      key: 'promiseLibrary',
      title: 'প্রমিজ লাইব্রেরি (Promise - প্রেস)',
      salesMap: currentBook.promiseLibrary,
      bgHeader: 'bg-white text-zinc-800',
    },
    {
      key: 'joystarLibrary',
      title: 'জয়স্টার লাইব্রেরি (Joystar - প্রেস)',
      salesMap: currentBook.joystarLibrary,
      bgHeader: 'bg-white text-zinc-800',
    },
    {
      key: 'dailyReturns',
      title: 'দৈনিক রিটার্ন (Daily Return to HO)',
      salesMap: currentBook.dailyReturns,
      bgHeader: 'bg-zinc-100 text-zinc-900',
    },
  ];

  return (
    <div className="space-y-5">
      
      {/* Top Navigation & Book Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
            title="ড্যাশবোর্ডে ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-zinc-900" />
              <h2 className="text-lg font-bold text-zinc-900">
                ১ থেকে {formatNumber(daysInMonth)} তারিখের সম্পূর্ণ ম্যাট্রিক্স ভিউ ({formatMonthYearBengali(selectedMonth, selectedYear)})
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              ক্যালেন্ডার তারিখের যেকোনো ঘরে ক্লিক করে সরাসরি মান পরিবর্তন করতে পারেন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-700">বই নির্বাচন:</span>
          <select
            value={currentBook.id}
            onChange={(e) => onSelectBook(e.target.value)}
            className="text-xs font-bold border border-zinc-300 rounded-xl px-3 py-2 bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-zinc-900"
          >
            {books.map(b => (
              <option key={b.id} value={b.id}>
                {b.sl}. {b.bookName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Book Quick Metrics Summary (Clean Black & White) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">বিক্রয় মূল্য (MRP)</span>
          <span className="text-base font-bold text-zinc-900">{formatBDT(m.perBookAmount)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">কপি প্রতি লাভ</span>
          <span className="text-base font-bold text-zinc-900">+{formatBDT(m.profitPerBook)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">প্রেস অর্ডার</span>
          <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(m.totalOrderFaridBhai)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">হেড অফিস স্টক</span>
          <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(m.totalPresentStockHO)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">প্রেস স্টক (Farid Bhai)</span>
          <span className="text-base font-bold text-zinc-800 font-mono">{formatNumber(m.stockToFaridBhai)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">সর্বমোট বিক্রি</span>
          <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(m.totalSold)}</span>
        </div>
      </div>

      {/* 31-Day Date Matrix Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <span>👉 ১ থেকে {formatNumber(daysInMonth)} তারিখ দেখতে ডানে স্ক্রোল করুন</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-100 text-zinc-800 border-b border-zinc-200 font-semibold">
                <th className="py-2.5 px-3 sticky left-0 z-20 bg-zinc-100 min-w-[220px] shadow-xs">
                  চ্যানেল / খাত
                </th>
                <th className="py-2.5 px-3 text-center bg-zinc-200 font-bold min-w-[70px]">
                  মোট
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(dateNum => (
                  <th key={dateNum} className="py-2 px-1 text-center min-w-[44px] font-mono text-[11px]">
                    {dateNum} তাং
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {matrixRows.map(row => {
                const total = sumDaily(row.salesMap);
                return (
                  <tr key={row.key} className="hover:bg-zinc-50 transition-colors">
                    {/* Sticky Channel Title */}
                    <td className={`py-2.5 px-3 font-semibold sticky left-0 z-10 shadow-xs border-r border-zinc-200 bg-white ${row.bgHeader}`}>
                      {row.title}
                    </td>

                    {/* Channel Total */}
                    <td className="py-2 px-3 text-center font-bold bg-zinc-100 border-r border-zinc-200 text-zinc-900 font-mono">
                      {total ? formatNumber(total) : '-'}
                    </td>

                    {/* Dates 1 to 31 */}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(dateNum => {
                      const val = row.salesMap?.[dateNum] || 0;
                      const isEditing = editingCell?.channelKey === row.key && editingCell?.day === dateNum;

                      return (
                        <td
                          key={dateNum}
                          onClick={() => !isEditing && startEdit(row.key, dateNum, val)}
                          className={`py-1.5 px-1 text-center border-r border-zinc-100 font-mono cursor-pointer transition-colors ${
                            val > 0
                              ? 'bg-zinc-100 text-zinc-900 font-bold hover:bg-zinc-200'
                              : 'text-zinc-300 hover:bg-zinc-50'
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
                                className="w-10 text-center text-xs font-bold bg-white border border-zinc-900 rounded p-0.5 focus:outline-hidden"
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
              <tr className="bg-zinc-100 font-bold text-zinc-900 border-t-2 border-zinc-300">
                <td className="py-2.5 px-3 sticky left-0 z-10 bg-zinc-100 shadow-xs border-r border-zinc-200">
                  সর্বমোট দৈনিক বিক্রয় (Online + Offline)
                </td>
                <td className="py-2.5 px-3 text-center bg-zinc-200 border-r border-zinc-200 text-zinc-900 text-sm font-mono">
                  {formatNumber(m.totalSold)}
                </td>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(dateNum => {
                  const dayTotal = 
                    (currentBook.boibari[dateNum] || 0) +
                    (currentBook.rokomari[dateNum] || 0) +
                    (currentBook.wafilife[dateNum] || 0) +
                    (currentBook.othersOnline[dateNum] || 0) +
                    (currentBook.headOfficeSellOffline[dateNum] || 0) +
                    (currentBook.nilkhetLibrary[dateNum] || 0) +
                    (currentBook.sumonaLibrary[dateNum] || 0) +
                    (currentBook.promiseLibrary[dateNum] || 0) +
                    (currentBook.joystarLibrary[dateNum] || 0);

                  return (
                    <td key={dateNum} className="py-2 px-1 text-center font-mono border-r border-zinc-200 text-zinc-900 font-semibold">
                      {dayTotal > 0 ? dayTotal : '-'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs text-zinc-600 flex flex-wrap items-center justify-between gap-2">
        <span>💡 টিপস: যেকোনো তারিখের ঘরে ক্লিক করে সরাসরি সংখ্যা পরিবর্তন করতে পারেন।</span>
        <span className="font-medium">মার্কেটিং ও উপহার কপি: {m.totalPromo} কপি</span>
      </div>

    </div>
  );
};
