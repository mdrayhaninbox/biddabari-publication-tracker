import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ArrowLeft 
} from 'lucide-react';
import { BookRecord, ChannelConfig, DEFAULT_CHANNELS } from '../types/book';
import { calculateBookMetrics, getBookChannelSales, formatBDT, formatNumber, sumDaily, formatMonthYearBengali } from '../utils/calculations';
import { Language, tr } from '../utils/i18n';

interface BookDetailMatrixProps {
  books: BookRecord[];
  selectedBookId: string;
  onSelectBook: (bookId: string) => void;
  onUpdateDailyCell: (bookId: string, channelKey: string, day: number, value: number) => void;
  onBackToDashboard: () => void;
  selectedMonth?: number;
  selectedYear?: number;
  daysInMonth?: number;
  language?: Language;
  channels?: ChannelConfig[];
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
  language = 'en',
  channels = DEFAULT_CHANNELS,
}) => {
  const currentBook = books.find(b => b.id === selectedBookId) || books[0];
  const effectiveChannels = channels && channels.length > 0 ? channels : DEFAULT_CHANNELS;

  // Inline edit state
  const [editingCell, setEditingCell] = useState<{ channelKey: string; day: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (!currentBook) {
    return (
      <div className="p-8 text-center text-zinc-500 bg-white rounded-xl border border-zinc-200">
        {tr('কোনো বই পাওয়া যায়নি।', 'No book found.', language)}
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

  // Channels to render in matrix (Dynamic Channels support)
  const matrixRows = [
    {
      key: 'pressDailyReceipts',
      title: tr('ফরিদ ভাই থেকে হেড অফিসে প্রাপ্ত (Press)', 'Press to Head Office (Chalan)', language),
      salesMap: currentBook.pressDailyReceipts,
      bgHeader: 'bg-zinc-100 text-zinc-900',
    },
    ...effectiveChannels.map((ch) => ({
      key: ch.id,
      title: language === 'bn' ? ch.name : (ch.nameEn || ch.name),
      salesMap: getBookChannelSales(currentBook, ch.id),
      bgHeader: 'bg-white text-zinc-800',
    })),
    {
      key: 'dailyReturns',
      title: tr('দৈনিক রিটার্ন (Daily Return to HO)', 'Daily Return to Head Office', language),
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
            title={tr('ড্যাশবোর্ডে ফিরে যান', 'Back to Dashboard', language)}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-zinc-900" />
              <h2 className="text-lg font-bold text-zinc-900">
                {tr(
                  `১ থেকে ${formatNumber(daysInMonth, language)} তারিখের সম্পূর্ণ ম্যাট্রিক্স ভিউ (${formatMonthYearBengali(selectedMonth, selectedYear, language)})`,
                  `Full 31-Day Matrix View (${formatMonthYearBengali(selectedMonth, selectedYear, language)})`,
                  language
                )}
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              {tr(
                'ক্যালেন্ডার তারিখের যেকোনো ঘরে ক্লিক করে সরাসরি মান পরিবর্তন করতে পারেন',
                'Click any date cell directly to edit sales values',
                language
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-700">{tr('বই নির্বাচন:', 'Select Book:', language)}</span>
          <select
            value={currentBook.id}
            onChange={(e) => onSelectBook(e.target.value)}
            className="text-xs font-bold border border-zinc-300 rounded-xl px-3 py-2 bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-zinc-900"
          >
            {books.map(b => (
              <option key={b.id} value={b.id}>
                {b.sl}. {b.bookName}{b.edition ? ` [${b.edition}]` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Book Quick Metrics Summary (Clean Black & White) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">{tr('বিক্রয় মূল্য (MRP)', 'MRP', language)}</span>
          <span className="text-base font-bold text-zinc-900">{formatBDT(m.perBookAmount, language)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">{tr('কপি প্রতি লাভ', 'Profit / Copy', language)}</span>
          <span className="text-base font-bold text-zinc-900">+{formatBDT(m.profitPerBook, language)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">{tr('প্রেস অর্ডার', 'Press Orders', language)}</span>
          <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(m.totalOrderFaridBhai, language)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">{tr('হেড অফিস স্টক', 'Head Office Stock', language)}</span>
          <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(m.totalPresentStockHO, language)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">{tr('প্রেস স্টক (Farid Bhai)', 'Press Stock (Farid Bhai)', language)}</span>
          <span className="text-base font-bold text-zinc-800 font-mono">{formatNumber(m.stockToFaridBhai, language)}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] text-zinc-500 block">{tr('সর্বমোট বিক্রি', 'Total Sold', language)}</span>
          <span className="text-base font-bold text-zinc-900 font-mono">{formatNumber(m.totalSold, language)}</span>
        </div>
      </div>

      {/* 31-Day Date Matrix Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <span>👉 {tr(`১ থেকে ${formatNumber(daysInMonth, language)} তারিখ দেখতে ডানে স্ক্রোল করুন`, 'Scroll right to view all dates', language)}</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-100 text-zinc-800 border-b border-zinc-200 font-semibold">
                <th className="py-2.5 px-3 sticky left-0 z-20 bg-zinc-100 min-w-[220px] shadow-xs">
                  {tr('চ্যানেল / খাত', 'Channel / Account', language)}
                </th>
                <th className="py-2.5 px-3 text-center bg-zinc-200 font-bold min-w-[70px]">
                  {tr('মোট', 'Total', language)}
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(dateNum => (
                  <th key={dateNum} className="py-2 px-1 text-center min-w-[44px] font-mono text-[11px]">
                    {language === 'bn' ? `${dateNum} তাং` : `D${dateNum}`}
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
                      {total ? formatNumber(total, language) : '-'}
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
                  {tr('সর্বমোট দৈনিক বিক্রয় (Online + Offline)', 'Grand Total Daily Sales (Online + Offline)', language)}
                </td>
                <td className="py-2.5 px-3 text-center bg-zinc-200 border-r border-zinc-200 text-zinc-900 text-sm font-mono">
                  {formatNumber(m.totalSold, language)}
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
        <span>💡 {tr('টিপস: যেকোনো তারিখের ঘরে ক্লিক করে সরাসরি সংখ্যা পরিবর্তন করতে পারেন।', 'Tip: Click any date cell to edit values directly.', language)}</span>
        <span className="font-medium">{tr('মার্কেটিং ও উপহার কপি:', 'Marketing & Gift Copies:', language)} {formatNumber(m.totalPromo, language)} {tr('কপি', 'copies', language)}</span>
      </div>

    </div>
  );
};
