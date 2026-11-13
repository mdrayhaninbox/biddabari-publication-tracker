import React, { useState, useEffect } from 'react';
import { X, BookPlus, Save } from 'lucide-react';
import { BookRecord } from '../types/book';
import { formatBDT } from '../utils/calculations';
import { Language, tr } from '../utils/i18n';

interface AddEditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBook?: BookRecord | null;
  onSaveBook: (bookData: Partial<BookRecord>) => void;
  nextSl: number;
  language?: Language;
  categories?: string[];
}

export const AddEditBookModal: React.FC<AddEditBookModalProps> = ({
  isOpen,
  onClose,
  editingBook,
  onSaveBook,
  nextSl,
  language = 'en',
  categories = ['NTRCA', 'Digest'],
}) => {
  const [bookName, setBookName] = useState('');
  const [edition, setEdition] = useState('1st Edition');
  const [publishMonth, setPublishMonth] = useState('');
  const [category, setCategory] = useState('');
  const [adCost, setAdCost] = useState<number>(30);
  const [makingCost, setMakingCost] = useState<number>(250);
  const [perBookAmount, setPerBookAmount] = useState<number>(390);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (editingBook) {
      setBookName(editingBook.bookName);
      setEdition(editingBook.edition || '1st Edition');
      setPublishMonth(editingBook.publishMonth || '');
      setCategory(editingBook.category || '');
      setAdCost(editingBook.adCost);
      setMakingCost(editingBook.makingCost);
      setPerBookAmount(editingBook.perBookAmount);
      setRemarks(editingBook.remarks || '');
    } else {
      setBookName('');
      setEdition('1st Edition');
      const now = new Date();
      const defaultMonthName = now.toLocaleString('en-US', { month: 'long' });
      setPublishMonth(`${defaultMonthName}, ${now.getFullYear()}`);
      setCategory('');
      setAdCost(30);
      setMakingCost(250);
      setPerBookAmount(390);
      setRemarks('');
    }
  }, [editingBook, isOpen]);

  if (!isOpen) return null;

  const profitPerBook = perBookAmount - (adCost + makingCost);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim()) return;

    onSaveBook({
      sl: editingBook ? editingBook.sl : nextSl,
      bookName: bookName.trim(),
      edition: edition.trim() || '1st Edition',
      publishMonth: publishMonth.trim(),
      category: category.trim(),
      adCost: Number(adCost) || 0,
      makingCost: Number(makingCost) || 0,
      perBookAmount: Number(perBookAmount) || 0,
      profitPerBook,
      totalOrderFaridBhai: editingBook ? editingBook.totalOrderFaridBhai : 0,
      remarks: remarks.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-zinc-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header (Black & White) */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {editingBook 
                  ? tr('বইয়ের তথ্য সম্পাদন করুন', 'Edit Book Details', language)
                  : tr('নতুন বই যুক্ত করুন', 'Add New Book', language)
                }
              </h3>
              <p className="text-xs text-zinc-400">
                {editingBook ? `SL: ${editingBook.sl}` : tr(`নতুন ক্রমিক নং: ${nextSl}`, `New Serial No: ${nextSl}`, language)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            
            {/* Book Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                {tr('বইয়ের নাম (Book Name) *', 'Book Name *', language)}
              </label>
              <input
                type="text"
                required
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder={tr('যেমন: ৪৭তম বিসিএস প্রিলিমিনারি গাইড', 'e.g. 47th BCS Preliminary Guide', language)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {/* Book Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center justify-between">
                <span>{tr('বইয়ের ক্যাটেগরি (Book Category)', 'Book Category', language)}</span>
                {category && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    🏷️ {category}
                  </span>
                )}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 bg-white"
              >
                <option value="">{tr('-- কোনো ক্যাটেগরি নেই / সাধারণ --', '-- No Category / General --', language)}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    📚 {cat}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 mt-1">
                {tr('নির্দিষ্ট ক্যাটেগরি নির্বাচন করলে বইয়ের তালিকা ও রিপোর্টে ক্যাটেগরি অনুযায়ী ফিল্টার করা যাবে।', 'Selecting a category allows quick filtering in table views and reports.', language)}
              </p>
            </div>

            {/* Book Edition & Publish Month */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              {/* Edition */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-800">
                    {tr('সংস্করণ (Book Edition) *', 'Book Edition *', language)}
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="e.g. 1st Edition"
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 bg-white"
                  list="edition-suggestions"
                />
                <datalist id="edition-suggestions">
                  <option value="1st Edition" />
                  <option value="2nd Edition" />
                  <option value="3rd Edition" />
                  <option value="4th Edition" />
                  <option value="5th Edition" />
                  <option value="Revised Edition" />
                  <option value="Special Edition" />
                  <option value="১ম সংস্করণ" />
                  <option value="২য় সংস্করণ" />
                  <option value="৩য় সংস্করণ" />
                </datalist>

                {/* Quick Selection Pills */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['1st Edition', '2nd Edition', '3rd Edition', 'Revised'].map(ed => (
                    <button
                      key={ed}
                      type="button"
                      onClick={() => setEdition(ed)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        edition === ed
                          ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {ed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Publish Month */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-800">
                    {tr('প্রকাশের মাস ও বছর *', 'Publish Month & Year *', language)}
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={publishMonth}
                  onChange={(e) => setPublishMonth(e.target.value)}
                  placeholder="e.g. January, 2025"
                  className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 bg-white"
                />
                <p className="text-[10px] text-zinc-500 mt-1.5 leading-tight">
                  {tr('একই বইয়ের বিভিন্ন সংস্করণের মূল্য ও প্রকাশকাল আলাদা হিসাবের জন্য।', 'Separates sales & pricing across multiple editions.', language)}
                </p>
              </div>
            </div>

            {/* Info note about Press Order Management */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-start gap-2.5 text-xs text-zinc-600">
              <div className="w-2 h-2 rounded-full bg-zinc-900 mt-1 shrink-0" />
              <div>
                <span className="font-bold text-zinc-900">
                  {tr('প্রেস অর্ডার ব্যবস্থাপনা:', 'Press Order Management:', language)}
                </span>{' '}
                {tr(
                  'প্রেসে মোট অর্ডার কপি সংখ্যা ও চালান ভাউচার এখন "প্রেস ও ডিউ হিসাব > প্রেস অর্ডার ম্যানেজমেন্ট" ট্যাব থেকে বই ভিত্তিক তারিখ ও ভাউচার অনুযায়ী সম্পূর্ণভাবে নিয়ন্ত্রণ করা হবে।',
                  'Press order copies and chalan vouchers are now managed under "Accounts & Dues > Press Order Management" tab by book, date, and voucher.',
                  language
                )}
              </div>
            </div>

            {/* Financials: 3 columns */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">
                  {tr('বিক্রয় মূল্য (MRP) *', 'Selling Price (MRP) *', language)}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={perBookAmount}
                  onChange={(e) => setPerBookAmount(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">
                  {tr('উৎপাদন খরচ *', 'Printing Cost *', language)}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={makingCost}
                  onChange={(e) => setMakingCost(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">
                  {tr('বিজ্ঞাপন খরচ *', 'Ad Cost *', language)}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adCost}
                  onChange={(e) => setAdCost(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>

            {/* Profit Margin Preview Banner */}
            <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-zinc-700 font-medium">
                {tr('কপি প্রতি লাভ (Profit Margin):', 'Profit Margin per Copy:', language)}
              </span>
              <span className="font-bold text-sm text-zinc-900 font-mono">
                +{formatBDT(profitPerBook, language)}
              </span>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                {tr('মন্তব্য (Remarks)', 'Remarks (Optional)', language)}
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={tr('বই সম্পর্কিত বিশেষ তথ্য বা সংস্করণ...', 'Special notes or edition info...', language)}
                className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              {tr('বাতিল', 'Cancel', language)}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>
                {editingBook 
                  ? tr('হালনাগাদ করুন', 'Update Book', language)
                  : tr('যুক্ত করুন', 'Add Book', language)
                }
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
