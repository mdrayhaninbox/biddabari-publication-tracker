import React, { useState, useEffect } from 'react';
import { X, Layers, Save, BookOpen } from 'lucide-react';
import { BookRecord, PressOrderRecord } from '../types/book';
import { formatBDT } from '../utils/calculations';

interface AddPressOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  onAddOrder: (order: Omit<PressOrderRecord, 'id' | 'createdAt'>) => void;
  preSelectedBookId?: string;
}

export const AddPressOrderModal: React.FC<AddPressOrderModalProps> = ({
  isOpen,
  onClose,
  books,
  onAddOrder,
  preSelectedBookId,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(
    preSelectedBookId || books[0]?.id || ''
  );
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [orderQuantity, setOrderQuantity] = useState<number>(3000);
  const [lotName, setLotName] = useState<string>('২য় মুদ্রণ (রি-অর্ডার)');
  const [orderNo, setOrderNo] = useState<string>(
    `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [makingCost, setMakingCost] = useState<number>(250);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (preSelectedBookId) {
      setSelectedBookId(preSelectedBookId);
    } else if (books.length > 0 && !selectedBookId) {
      setSelectedBookId(books[0].id);
    }
  }, [preSelectedBookId, books]);

  useEffect(() => {
    const book = books.find((b) => b.id === selectedBookId);
    if (book) {
      setMakingCost(Number(book.makingCost) || 250);
    }
  }, [selectedBookId, books]);

  if (!isOpen) return null;

  const currentBook = books.find((b) => b.id === selectedBookId);
  const totalBill = (Number(orderQuantity) || 0) * (Number(makingCost) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !orderQuantity || orderQuantity <= 0) return;

    onAddOrder({
      bookId: selectedBookId,
      bookName: currentBook?.bookName || 'অজানা বই',
      orderDate,
      orderQuantity: Number(orderQuantity),
      lotName: lotName.trim() || 'প্রেস অর্ডার',
      makingCost: Number(makingCost) || 0,
      totalBill,
      orderNo: orderNo.trim() || undefined,
      notes: notes.trim() || undefined,
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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">নতুন প্রেস অর্ডার এন্ট্রি</h3>
              <p className="text-xs text-zinc-400">ফরিদ ভাই প্রেসে বই ছাপার নতুন অর্ডার বা রি-অর্ডার লট যোগ করুন</p>
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
            
            {/* Book Selection (Bookwise) */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                বই নির্বাচন করুন (Book Selection) *
              </label>
              <div className="relative">
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 bg-white"
                  required
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.sl}. {b.bookName} (ছাপার খরচ: ৳{b.makingCost})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Voucher / Slip No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  অর্ডারের তারিখ (Order Date) *
                </label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  ভাউচার / অর্ডার স্লিপ নং (Voucher No) *
                </label>
                <input
                  type="text"
                  required
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder="যেমন: PO-2026-002"
                  className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>

            {/* Lot / Edition Name & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-800">
                  মুদ্রণ সংস্করণ / লটের বিবরণ *
                </label>
                <span className="text-[10px] text-zinc-400">লটের নাম বা সংস্করণ</span>
              </div>
              <input
                type="text"
                required
                value={lotName}
                onChange={(e) => setLotName(e.target.value)}
                placeholder="যেমন: ২য় মুদ্রণ (রি-অর্ডার) বা লট-২"
                className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900"
              />
              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['১ম মুদ্রণ', '২য় মুদ্রণ (রি-অর্ডার)', '৩য় মুদ্রণ (রি-অর্ডার)', 'লট-১', 'লট-২', 'লট-৩'].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setLotName(preset)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition-colors border border-zinc-200"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Unit Making Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  অর্ডার বই সংখ্যা / কপি (Quantity) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                  placeholder="যেমন: ৩০০০"
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  প্রতি কপির ছাপার খরচ (Unit Cost) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={makingCost}
                  onChange={(e) => setMakingCost(parseInt(e.target.value) || 0)}
                  placeholder="যেমন: ২৫০"
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>

            {/* Total Order Bill Calculated Summary */}
            <div className="bg-zinc-100 border border-zinc-300 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-zinc-600">মোট অর্ডার বিল (Total Order Bill)</div>
                <div className="text-[10px] text-zinc-500">
                  {orderQuantity} কপি × ৳{makingCost}
                </div>
              </div>
              <div className="text-base font-black text-zinc-900 font-mono">
                {formatBDT(totalBill)}
              </div>
            </div>

            {/* Notes / Remarks */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                নোট / বিবরণ (ঐচ্ছিক)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="অর্ডারের ডেলিভারি সময়সীমা বা বিশেষ শর্ত..."
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
              <span>প্রেস অর্ডার যুক্ত করুন</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
