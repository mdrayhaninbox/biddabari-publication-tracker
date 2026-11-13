import React, { useState, useEffect } from 'react';
import { X, Truck, Save } from 'lucide-react';
import { BookRecord, PressDeliveryRecord } from '../types/book';
import { Language, tr } from '../utils/i18n';
import { VoucherImageUploader } from './VoucherImageUploader';

interface AddPressDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  onAddDelivery: (delivery: Omit<PressDeliveryRecord, 'id' | 'createdAt'>) => void;
  preSelectedBookId?: string;
  language?: Language;
}

export const AddPressDeliveryModal: React.FC<AddPressDeliveryModalProps> = ({
  isOpen,
  onClose,
  books,
  onAddDelivery,
  preSelectedBookId,
  language = 'en',
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(
    preSelectedBookId || books[0]?.id || ''
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [quantity, setQuantity] = useState<number>(1000);
  const [chalanNo, setChalanNo] = useState<string>(
    `CH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [lotName, setLotName] = useState<string>('১ম মুদ্রণ (লট-১)');
  const [receivedBy, setReceivedBy] = useState<string>('হেড অফিস স্টোর');
  const [voucherImage, setVoucherImage] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (preSelectedBookId) {
      setSelectedBookId(preSelectedBookId);
    } else if (books.length > 0 && !selectedBookId) {
      setSelectedBookId(books[0].id);
    }
  }, [preSelectedBookId, books]);

  if (!isOpen) return null;

  const currentBook = books.find((b) => b.id === selectedBookId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !quantity || quantity <= 0) return;

    onAddDelivery({
      bookId: selectedBookId,
      bookName: currentBook?.bookName || tr('অজানা বই', 'Unknown Book', language),
      deliveryDate,
      quantity: Number(quantity),
      chalanNo: chalanNo.trim() || `CH-${Date.now()}`,
      lotName: lotName.trim() || undefined,
      receivedBy: receivedBy.trim() || undefined,
      voucherImage: voucherImage || undefined,
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
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {tr('প্রেস থেকে বই চালান গ্রহণ', 'Receive Book Delivery from Press', language)}
              </h3>
              <p className="text-xs text-zinc-400">
                {tr('ফরিদ ভাই প্রেস থেকে হেড অফিসে বই সরবরাহ চালান এন্ট্রি করুন', 'Enter delivery chalan of books received from Farid Bhai Press to Head Office', language)}
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
            
            {/* Book Selection (Bookwise) */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                {tr('বই নির্বাচন করুন (Book Selection) *', 'Select Book *', language)}
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 bg-white"
                required
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.sl}. {b.bookName}{b.edition ? ` [${b.edition}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Voucher / Chalan No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr('চালান / গ্রহণের তারিখ (Receipt Date) *', 'Receipt Date *', language)}
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr('প্রেস চালান / ভাউচার নং (Chalan No) *', 'Chalan / Voucher No *', language)}
                </label>
                <input
                  type="text"
                  required
                  value={chalanNo}
                  onChange={(e) => setChalanNo(e.target.value)}
                  placeholder={tr('যেমন: CH-2026-004', 'e.g. CH-2026-004', language)}
                  className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>

            {/* Quantity and Lot Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr('গ্রহণকৃত বই সংখ্যা / কপি (Quantity) *', 'Received Quantity (Copies) *', language)}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder={tr('যেমন: ১০০০', 'e.g. 1000', language)}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr('মুদ্রণ সংস্করণ / লটের রেফারেন্স', 'Edition / Lot Reference', language)}
                </label>
                <input
                  type="text"
                  value={lotName}
                  onChange={(e) => setLotName(e.target.value)}
                  placeholder={tr('যেমন: ১ম মুদ্রণ (লট-১)', 'e.g. 1st Edition (Lot-1)', language)}
                  className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            {/* Received By */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                {tr('গ্রহীতার নাম / ওয়্যারহাউস স্থান', 'Receiver / Warehouse Location', language)}
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder={tr('যেমন: হেড অফিস ওয়্যারহাউস / স্টোর', 'e.g. Head Office Warehouse / Store', language)}
                className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {/* Optional Voucher / Chalan Image Upload */}
            <VoucherImageUploader
              image={voucherImage}
              onChange={setVoucherImage}
              label={tr('প্রেস চালান বা ভাউচারের ছবি (ঐচ্ছিক)', 'Press Chalan or Voucher Photo (Optional)', language)}
              subLabel={tr('JPG, PNG, WebP • অপ্টিমাইজড', 'JPG, PNG, WebP • Optimized', language)}
              language={language}
            />

            {/* Notes / Remarks */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                {tr('নোট / মন্তব্য (ঐচ্ছিক)', 'Notes / Remarks (Optional)', language)}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tr('চালান গ্রহণ সম্পর্কিত বিশেষ বিবরণ...', 'Special notes about delivery receipt...', language)}
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
              <span>{tr('চালান গ্রহণ নিশ্চিত করুন', 'Confirm Delivery Receipt', language)}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
