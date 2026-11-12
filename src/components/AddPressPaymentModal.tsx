import React, { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { BookRecord, PressPaymentRecord, PaymentMethod } from '../types/book';
import { Language, tr } from '../utils/i18n';

interface AddPressPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  onSavePayment: (payment: Omit<PressPaymentRecord, 'id' | 'createdAt'>) => void;
  language?: Language;
}

export const AddPressPaymentModal: React.FC<AddPressPaymentModalProps> = ({
  isOpen,
  onClose,
  books,
  onSavePayment,
  language = 'en',
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
      alert(tr('অনুগ্রহ করে সঠিক পেমেন্টের পরিমাণ (টাকা) লিখুন', 'Please enter a valid payment amount', language));
      return;
    }

    const selectedBook = books.find(b => b.id === bookId);

    onSavePayment({
      date,
      bookId: bookId || undefined,
      bookName: selectedBook ? selectedBook.bookName : tr('সার্বিক প্রেস অর্ডার', 'General Press Orders', language),
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
              <h3 className="font-bold text-zinc-900 text-base">
                {tr('প্রেস পেমেন্ট ভাউচার এন্ট্রি', 'Enter Press Payment Voucher', language)}
              </h3>
              <p className="text-xs text-zinc-500">
                {tr('ফরিদ ভাই প্রেসে পরিশোধকৃত টাকার হিসাব লিপিবদ্ধ করুন', 'Record payment made to Farid Bhai Press', language)}
              </p>
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
                {tr('পেমেন্টের তারিখ *', 'Payment Date *', language)}
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
                {tr('বইয়ের নাম (খাত) *', 'Book Name (Account) *', language)}
              </label>
              <select
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">{tr('সার্বিক প্রেস চালান (All Books)', 'General Press Account (All Books)', language)}</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.sl}. {b.bookName}{b.edition ? ` [${b.edition}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                {tr('পরিশোধকৃত টাকা (৳) *', 'Amount Paid (৳) *', language)}
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder={tr('যেমন: ৫০,০০০', 'e.g. 50,000', language)}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm font-bold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900 font-mono"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                {tr('পেমেন্ট মাধ্যম *', 'Payment Method *', language)}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900"
              >
                <option value="bank">{tr('ব্যাংক ট্রান্সফার (Bank Transfer)', 'Bank Transfer', language)}</option>
                <option value="cash">{tr('নগদ ক্যাশ (Cash)', 'Cash', language)}</option>
                <option value="check">{tr('ব্যাংক চেক (Cheque)', 'Cheque', language)}</option>
                <option value="bkash">{tr('বিকাশ (bKash)', 'bKash', language)}</option>
                <option value="nagad">{tr('নগদ (Nagad)', 'Nagad', language)}</option>
                <option value="other">{tr('অন্যান্য', 'Other', language)}</option>
              </select>
            </div>
          </div>

          {/* Voucher / Slip No */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              {tr('ভাউচার / চেক / চালান নম্বর (ঐচ্ছিক)', 'Voucher / Cheque / Chalan No (Optional)', language)}
            </label>
            <input
              type="text"
              placeholder={tr('যেমন: PR-2026-004 বা চেক নং: ১২৩৪৫৬', 'e.g. PR-2026-004 or Cheque No: 123456', language)}
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              className="w-full text-xs border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              {tr('বিবরণ বা নোট (ঐচ্ছিক)', 'Description or Notes (Optional)', language)}
            </label>
            <textarea
              rows={2}
              placeholder={tr('পেমেন্ট সংক্রান্ত কোনো বিশেষ নোট থাকলে লিখুন...', 'Enter any special payment remarks...', language)}
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
              {tr('বাতিল', 'Cancel', language)}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-colors shadow-xs"
            >
              {tr('ভাউচার সংরক্ষণ করুন', 'Save Voucher', language)}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
