import React, { useState } from 'react';
import { X, HandCoins } from 'lucide-react';
import { ChannelCollectionRecord, PaymentMethod, SALES_CHANNELS } from '../types/book';
import { Language, tr } from '../utils/i18n';
import { VoucherImageUploader } from './VoucherImageUploader';

interface AddChannelCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCollection: (collection: Omit<ChannelCollectionRecord, 'id' | 'createdAt'>) => void;
  initialChannelKey?: string;
  language?: Language;
}

export const AddChannelCollectionModal: React.FC<AddChannelCollectionModalProps> = ({
  isOpen,
  onClose,
  onSaveCollection,
  initialChannelKey,
  language = 'en',
}) => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [channelKey, setChannelKey] = useState<string>(initialChannelKey || SALES_CHANNELS[0].key);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [voucherImage, setVoucherImage] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert(tr('অনুগ্রহ করে সঠিক আদায়ের পরিমাণ (টাকা) লিখুন', 'Please enter a valid collection amount', language));
      return;
    }

    const channel = SALES_CHANNELS.find(c => c.key === channelKey) || SALES_CHANNELS[0];

    onSaveCollection({
      date,
      channelKey: channel.key,
      channelName: channel.name,
      amount: Number(amount),
      paymentMethod,
      receiptNo: receiptNo.trim() || undefined,
      voucherImage: voucherImage || undefined,
      receiptImage: voucherImage || undefined,
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
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">
                {tr('বিক্রয় বিল আদায় / কালেকশন এন্ট্রি', 'Sales Collection Entry', language)}
              </h3>
              <p className="text-xs text-zinc-500">
                {tr('অনলাইন প্ল্যাটফর্ম বা অফলাইন লাইব্রেরি থেকে প্রাপ্ত টাকা যুক্ত করুন', 'Record dues received from online channels or offline libraries', language)}
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
                {tr('আদায়ের তারিখ *', 'Collection Date *', language)}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900 font-mono"
              />
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                {tr('চ্যানেল / লাইব্রেরি *', 'Channel / Library *', language)}
              </label>
              <select
                value={channelKey}
                onChange={(e) => setChannelKey(e.target.value)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900"
              >
                <optgroup label={tr('🌐 অনলাইন চ্যানেলসমূহ', '🌐 Online Channels', language)}>
                  {SALES_CHANNELS.filter(c => c.type === 'online').map(c => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={tr('🏪 অফলাইন ও লাইব্রেরিসমূহ', '🏪 Offline & Libraries', language)}>
                  {SALES_CHANNELS.filter(c => c.type === 'offline').map(c => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                {tr('আদায়কৃত টাকা (৳) *', 'Collected Amount (৳) *', language)}
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
                <option value="bank">{tr('ব্যাংক ট্রান্সফার (Bank Deposit/Transfer)', 'Bank Deposit/Transfer', language)}</option>
                <option value="cash">{tr('নগদ ক্যাশ (Cash)', 'Cash', language)}</option>
                <option value="bkash">{tr('বিকাশ (bKash)', 'bKash', language)}</option>
                <option value="nagad">{tr('নগদ (Nagad)', 'Nagad', language)}</option>
                <option value="check">{tr('ব্যাংক চেক (Cheque)', 'Cheque', language)}</option>
                <option value="other">{tr('অন্যান্য', 'Other', language)}</option>
              </select>
            </div>
          </div>

          {/* Receipt No */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              {tr('রশিদ / ইনভয়েস / ট্রানজেকশন আইডি (ঐচ্ছিক)', 'Receipt / Invoice / Trx ID (Optional)', language)}
            </label>
            <input
              type="text"
              placeholder={tr('যেমন: REC-2026-092 বা TrxID: 9X738KA', 'e.g. REC-2026-092 or TrxID: 9X738KA', language)}
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              className="w-full text-xs border border-zinc-300 rounded-xl p-2.5 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {/* Optional Voucher / Receipt Image Upload */}
          <VoucherImageUploader
            image={voucherImage}
            onChange={setVoucherImage}
            label={tr('মানি রিসিট বা জমার ভাউচারের ছবি (ঐচ্ছিক)', 'Money Receipt or Voucher Photo (Optional)', language)}
            subLabel={tr('JPG, PNG, WebP • অপ্টিমাইজড', 'JPG, PNG, WebP • Optimized', language)}
            language={language}
          />

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              {tr('নোট বা বিবরণ (ঐচ্ছিক)', 'Remarks or Notes (Optional)', language)}
            </label>
            <textarea
              rows={2}
              placeholder={tr('কালেকশন সংক্রান্ত বিস্তারিত...', 'Collection details or reference...', language)}
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
              {tr('কালেকশন সংরক্ষণ করুন', 'Save Collection', language)}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
