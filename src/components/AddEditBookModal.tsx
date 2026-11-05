import React, { useState, useEffect } from 'react';
import { X, BookPlus, Save } from 'lucide-react';
import { BookRecord } from '../types/book';
import { formatBDT } from '../utils/calculations';

interface AddEditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBook?: BookRecord | null;
  onSaveBook: (bookData: Partial<BookRecord>) => void;
  nextSl: number;
}

export const AddEditBookModal: React.FC<AddEditBookModalProps> = ({
  isOpen,
  onClose,
  editingBook,
  onSaveBook,
  nextSl,
}) => {
  const [bookName, setBookName] = useState('');
  const [adCost, setAdCost] = useState<number>(30);
  const [makingCost, setMakingCost] = useState<number>(250);
  const [perBookAmount, setPerBookAmount] = useState<number>(390);
  const [totalOrderFaridBhai, setTotalOrderFaridBhai] = useState<number>(5000);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (editingBook) {
      setBookName(editingBook.bookName);
      setAdCost(editingBook.adCost);
      setMakingCost(editingBook.makingCost);
      setPerBookAmount(editingBook.perBookAmount);
      setTotalOrderFaridBhai(editingBook.totalOrderFaridBhai);
      setRemarks(editingBook.remarks || '');
    } else {
      setBookName('');
      setAdCost(30);
      setMakingCost(250);
      setPerBookAmount(390);
      setTotalOrderFaridBhai(5000);
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
      adCost: Number(adCost) || 0,
      makingCost: Number(makingCost) || 0,
      perBookAmount: Number(perBookAmount) || 0,
      profitPerBook,
      totalOrderFaridBhai: Number(totalOrderFaridBhai) || 0,
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
                {editingBook ? 'বইয়ের তথ্য সম্পাদন করুন' : 'নতুন বই যুক্ত করুন'}
              </h3>
              <p className="text-xs text-zinc-400">
                {editingBook ? `SL: ${editingBook.sl}` : `নতুন ক্রমিক নং: ${nextSl}`}
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
                বইয়ের নাম (Book Name) *
              </label>
              <input
                type="text"
                required
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="যেমন: ৪৭তম বিসিএস প্রিলিমিনারি গাইড"
                className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {/* Total Press Order */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                ফরিদ ভাই প্রেসে মোট অর্ডার সংখ্যা (Press Order) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalOrderFaridBhai}
                onChange={(e) => setTotalOrderFaridBhai(parseInt(e.target.value) || 0)}
                className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
              />
            </div>

            {/* Financials: 3 columns */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-700 mb-1 font-semibold">
                  বিক্রয় মূল্য (MRP) *
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
                  উৎপাদন খরচ *
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
                  বিজ্ঞাপন খরচ *
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
              <span className="text-zinc-700 font-medium">কপি প্রতি লাভ (Profit Margin):</span>
              <span className="font-bold text-sm text-zinc-900 font-mono">
                +{formatBDT(profitPerBook)}
              </span>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                মন্তব্য (Remarks)
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="বই সম্পর্কিত বিশেষ তথ্য বা সংস্করণ..."
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
              বাতিল
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{editingBook ? 'হালনাগাদ করুন' : 'যুক্ত করুন'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
