import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Building2 } from 'lucide-react';
import { BookRecord, PressOrderRecord, ChannelConfig } from '../types/book';
import { formatBDT } from '../utils/calculations';
import { Language, tr } from '../utils/i18n';
import { VoucherImageUploader } from './VoucherImageUploader';

interface AddPressOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  channels?: ChannelConfig[];
  onAddOrder: (order: Omit<PressOrderRecord, 'id' | 'createdAt'>) => void;
  preSelectedBookId?: string;
  language?: Language;
}

export const AddPressOrderModal: React.FC<AddPressOrderModalProps> = ({
  isOpen,
  onClose,
  books,
  channels = [],
  onAddOrder,
  preSelectedBookId,
  language = 'en',
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
  const [voucherImage, setVoucherImage] = useState<string | undefined>(undefined);
  const [makingCost, setMakingCost] = useState<number>(250);
  const [notes, setNotes] = useState<string>('');

  const availablePresses = channels.filter(c => c.type === 'press' || c.id === 'faridBhaiPress');
  const [selectedPressId, setSelectedPressId] = useState<string>(
    availablePresses[0]?.id || 'faridBhaiPress'
  );

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

  useEffect(() => {
    if (availablePresses.length > 0 && !selectedPressId) {
      setSelectedPressId(availablePresses[0].id);
    }
  }, [channels]);

  if (!isOpen) return null;

  const currentBook = books.find((b) => b.id === selectedBookId);
  const currentPress = availablePresses.find((p) => p.id === selectedPressId);
  const totalBill = (Number(orderQuantity) || 0) * (Number(makingCost) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !orderQuantity || orderQuantity <= 0) return;

    onAddOrder({
      bookId: selectedBookId,
      bookName: currentBook?.bookName || tr('অজানা বই', 'Unknown Book', language),
      pressId: selectedPressId,
      pressName: currentPress?.name || 'ফরিদ ভাই প্রেস',
      orderDate,
      orderQuantity: Number(orderQuantity),
      lotName: lotName.trim() || tr('প্রেস অর্ডার', 'Press Order', language),
      makingCost: Number(makingCost) || 0,
      totalBill,
      orderNo: orderNo.trim() || undefined,
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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {tr('নতুন প্রেস অর্ডার এন্ট্রি', 'New Press Order Entry', language)}
              </h3>
              <p className="text-xs text-zinc-400">
                {tr('প্রেসে বই ছাপার নতুন অর্ডার বা রি-অর্ডার লট যোগ করুন', 'Add print order or re-order lot placed at press', language)}
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
            
            {/* Press Selection (If multiple presses exist or for clarity) */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>{tr('ছাপাখানা / প্রেস নির্বাচন করুন (Select Press) *', 'Select Printing Press *', language)}</span>
              </label>
              <select
                value={selectedPressId}
                onChange={(e) => setSelectedPressId(e.target.value)}
                className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 bg-white"
                required
              >
                {availablePresses.length > 0 ? (
                  availablePresses.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.address ? `(${p.address})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="faridBhaiPress">ফরিদ ভাই প্রেস (Farid Bhai Press)</option>
                )}
              </select>
            </div>

            {/* Book Selection (Bookwise) */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                {tr('বই নির্বাচন করুন (Book Selection) *', 'Select Book *', language)}
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
                      {b.sl}. {b.bookName}{b.edition ? ` [${b.edition}]` : ''} ({tr('ছাপার খরচ', 'Printing Cost', language)}: ৳{b.makingCost})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Voucher / Slip No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr('অর্ডারের তারিখ (Order Date) *', 'Order Date *', language)}
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
                  {tr('ভাউচার / অর্ডার স্লিপ নং (Voucher No) *', 'Voucher / PO No *', language)}
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
                  {tr('ভাউচার / অর্ডার স্লিপ নং (Voucher No) *', 'Voucher / PO No *', language)}
                </label>
                <input
                  type="text"
                  required
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder={tr('যেমন: PO-2026-002', 'e.g. PO-2026-002', language)}
                  className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>

            {/* Lot / Edition Name & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-800">
                  {tr('মুদ্রণ সংস্করণ / লটের বিবরণ *', 'Edition / Lot Details *', language)}
                </label>
                <span className="text-[10px] text-zinc-400">
                  {tr('লটের নাম বা সংস্করণ', 'Lot name or edition', language)}
                </span>
              </div>
              <input
                type="text"
                required
                value={lotName}
                onChange={(e) => setLotName(e.target.value)}
                placeholder={tr('যেমন: ২য় মুদ্রণ (রি-অর্ডার) বা লট-২', 'e.g. 2nd Edition (Re-order) or Lot-2', language)}
                className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900"
              />
              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { bn: '১ম মুদ্রণ', en: '1st Edition' },
                  { bn: '২য় মুদ্রণ (রি-অর্ডার)', en: '2nd Edition (Re-order)' },
                  { bn: '৩য় মুদ্রণ (রি-অর্ডার)', en: '3rd Edition (Re-order)' },
                  { bn: 'লট-১', en: 'Lot-1' },
                  { bn: 'লট-২', en: 'Lot-2' },
                  { bn: 'লট-৩', en: 'Lot-3' }
                ].map((preset) => (
                  <button
                    type="button"
                    key={preset.bn}
                    onClick={() => setLotName(language === 'en' ? preset.en : preset.bn)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition-colors border border-zinc-200"
                  >
                    + {language === 'en' ? preset.en : preset.bn}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Unit Making Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr('অর্ডার বই সংখ্যা / কপি (Quantity) *', 'Order Quantity (Copies) *', language)}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                  placeholder={tr('যেমন: ৩০০০', 'e.g. 3000', language)}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr('প্রতি কপির ছাপার খরচ (Unit Cost) *', 'Printing Cost per Copy *', language)}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={makingCost}
                  onChange={(e) => setMakingCost(parseInt(e.target.value) || 0)}
                  placeholder={tr('যেমন: ২৫০', 'e.g. 250', language)}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>

            {/* Total Order Bill Calculated Summary */}
            <div className="bg-zinc-100 border border-zinc-300 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-zinc-600">
                  {tr('মোট অর্ডার বিল (Total Order Bill)', 'Total Order Bill', language)}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {orderQuantity} {tr('কপি', 'copies', language)} × ৳{makingCost}
                </div>
              </div>
              <div className="text-base font-black text-zinc-900 font-mono">
                {formatBDT(totalBill, language)}
              </div>
            </div>

            {/* Optional Voucher / PO Slip Image Upload */}
            <VoucherImageUploader
              image={voucherImage}
              onChange={setVoucherImage}
              label={tr('অর্ডার স্লিপ বা ভাউচারের ছবি (ঐচ্ছিক)', 'PO Slip or Voucher Photo (Optional)', language)}
              subLabel={tr('JPG, PNG, WebP • অপ্টিমাইজড', 'JPG, PNG, WebP • Optimized', language)}
              language={language}
            />

            {/* Notes / Remarks */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                {tr('নোট / বিবরণ (ঐচ্ছিক)', 'Notes / Remarks (Optional)', language)}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tr('অর্ডারের ডেলিভারি সময়সীমা বা বিশেষ শর্ত...', 'Delivery timeline or special terms...', language)}
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
              <span>{tr('প্রেস অর্ডার যুক্ত করুন', 'Save Press Order', language)}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
