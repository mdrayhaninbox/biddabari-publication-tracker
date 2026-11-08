import React, { useState } from 'react';
import { X, PlusCircle, CreditCard } from 'lucide-react';
import { BookRecord, PressPaymentRecord, PaymentMethod } from '../types/book';

interface AddPressPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  onSavePayment: (payment: Omit<PressPaymentRecord, 'id' | 'createdAt'>) => void;
}

export const AddPressPaymentModal: React.FC<AddPressPaymentModalProps> = ({
  isOpen,
  onClose,
  books,
  onSavePayment,
}) => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [bookId, setBookId] = useState<string>(books[0]?.id || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [voucherNo, setVoucherNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('অনুগ্রহ করে সঠিক পেমেন্টের পরিমাণ (টাকা) লিখুন');
      return;
    }

    const selectedBook = books.find(b => b.id === bookId);

    onSavePayment({
      date,
      bookId: bookId || undefined,
      bookName: selectedBook ? selectedBook.bookName : 'সার্বিক প্রেস অর্ডার',
      amount: Number(amount),
      paymentMethod,
      voucherNo: voucherNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-zinc-200 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">প্রেস পেমেন্ট ভাউচার এন্ট্রি</h3>
              <p className="text-xs text-zinc-500">ফরিদ ভাই প্রেসে পরিশোধকৃত টাকার হিসাব লিপিবদ্ধ করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                পেমেন্টের তারিখ *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900 font-mono"
              />
            </div>

            {/* Book Selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                বইয়ের নাম (খাত) *
              </label>
              <select
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">সার্বিক প্রেস চালান (All Books)</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.sl}. {b.bookName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                পরিশোধকৃত টাকা (৳) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="যেমন: ৫০,০০০"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm font-bold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900 font-mono"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                পেমেন্ট মাধ্যম *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900"
              >
                <option value="bank">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
                <option value="cash">নগদ ক্যাশ (Cash)</option>
                <option value="check">ব্যাংক চেক (Cheque)</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="other">অন্যান্য</option>
              </select>
            </div>
          </div>

          {/* Voucher / Slip No */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              ভাউচার / চেক / চালান নম্বর (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="যেমন: PR-2026-004 বা চেক নং: ১২৩৪৫৬"
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              className="w-full text-xs border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              বিবরণ বা নোট (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              placeholder="পেমেন্ট সংক্রান্ত কোনো বিশেষ নোট থাকলে লিখুন..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-colors shadow-xs"
            >
              ভাউচার সংরক্ষণ করুন
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
