import React, { useState } from 'react';
import { 
  CreditCard, 
  HandCoins, 
  PlusCircle, 
  Trash2, 
  Layers, 
  Search, 
  Truck, 
  X, 
  Globe, 
  Store,
  Filter,
  Edit2,
  Image as ImageIcon,
  Printer
} from 'lucide-react';
import { ImageViewerModal } from './ImageViewerModal';
import { 
  BookRecord, 
  PressPaymentRecord, 
  ChannelCollectionRecord, 
  PressOrderRecord, 
  PressDeliveryRecord,
  ChannelConfig,
  DEFAULT_CHANNELS
} from '../types/book';
import { 
  calculatePressAccounts, 
  calculateChannelDueAccounts, 
  formatBDT, 
  formatNumber,
} from '../utils/calculations';
import { Language, tr } from '../utils/i18n';

interface AccountsDueLedgerProps {
  books: BookRecord[];
  pressPayments: PressPaymentRecord[];
  pressOrders: PressOrderRecord[];
  pressDeliveries: PressDeliveryRecord[];
  channelCollections: ChannelCollectionRecord[];
  onAddPressPayment: () => void;
  onDeletePressPayment: (id: string) => void;
  onAddPressOrder: (preSelectedBookId?: string) => void;
  onDeletePressOrder: (id: string) => void;
  onAddPressDelivery: (preSelectedBookId?: string) => void;
  onDeletePressDelivery: (id: string) => void;
  onAddChannelCollection: (channelKey?: string) => void;
  onDeleteChannelCollection: (id: string) => void;
  selectedMonth?: number;
  selectedYear?: number;
  language?: Language;
  channels?: ChannelConfig[];
  onOpenAddChannel?: (defaultType: 'online' | 'offline') => void;
  onOpenEditChannel?: (channel: ChannelConfig) => void;
  onOpenPrintCollectionVouchers?: (libraryKey?: string) => void;
  onOpenPrintPressVouchers?: () => void;
}

export const AccountsDueLedger: React.FC<AccountsDueLedgerProps> = ({
  books,
  pressPayments,
  pressOrders,
  pressDeliveries,
  channelCollections,
  onAddPressPayment,
  onDeletePressPayment,
  onAddPressOrder,
  onDeletePressOrder,
  onAddPressDelivery,
  onDeletePressDelivery,
  onAddChannelCollection,
  onDeleteChannelCollection,
  language = 'en',
  channels = DEFAULT_CHANNELS,
  onOpenAddChannel,
  onOpenEditChannel,
  onOpenPrintCollectionVouchers,
  onOpenPrintPressVouchers,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'press' | 'orders' | 'channels'>('press');
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');
  const [voucherSearchQuery, setVoucherSearchQuery] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const openImagePreview = (url?: string, title = 'ভাউচার কপি', subtitle?: string) => {
    if (!url) return;
    setPreviewImage({ url, title, subtitle });
  };

  const effectiveChannels = channels && channels.length > 0 ? channels : DEFAULT_CHANNELS;

  // Compute live press financials (incorporating multi press orders)
  const pressAccounts = calculatePressAccounts(books, pressPayments, pressOrders);
  const channelAccounts = calculateChannelDueAccounts(books, channelCollections, effectiveChannels);

  // Filter press orders for Press Order Management
  const filteredOrders = pressOrders.filter((o) => {
    const matchBook = selectedBookFilter === 'all' || o.bookId === selectedBookFilter;
    const q = voucherSearchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      (o.orderNo && o.orderNo.toLowerCase().includes(q)) ||
      (o.lotName && o.lotName.toLowerCase().includes(q)) ||
      (o.bookName && o.bookName.toLowerCase().includes(q)) ||
      (o.orderDate && o.orderDate.includes(q)) ||
      (o.notes && o.notes.toLowerCase().includes(q));
    return matchBook && matchQuery;
  });

  // Filter press deliveries for Press Order Management
  const filteredDeliveries = pressDeliveries.filter((d) => {
    const matchBook = selectedBookFilter === 'all' || d.bookId === selectedBookFilter;
    const q = voucherSearchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      (d.chalanNo && d.chalanNo.toLowerCase().includes(q)) ||
      (d.lotName && d.lotName.toLowerCase().includes(q)) ||
      (d.bookName && d.bookName.toLowerCase().includes(q)) ||
      (d.deliveryDate && d.deliveryDate.includes(q)) ||
      (d.receivedBy && d.receivedBy.toLowerCase().includes(q)) ||
      (d.notes && d.notes.toLowerCase().includes(q));
    return matchBook && matchQuery;
  });

  const totalOrderedCopies = filteredOrders.reduce((sum, o) => sum + (Number(o.orderQuantity) || 0), 0);
  const totalDeliveredCopies = filteredDeliveries.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  const totalOrdersBill = filteredOrders.reduce((sum, o) => sum + (Number(o.totalBill) || 0), 0);
  const remainingAtPress = Math.max(0, totalOrderedCopies - totalDeliveredCopies);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner & High-Level Financial Overview */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
            <span>{tr('প্রেস হিসাব ও বিক্রয় ডিউ খতিয়ান', 'Press Accounts & Sales Due Ledger', language)}</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {tr(
              'ফরিদ ভাই প্রেসে পরিশোধিত পেমেন্ট, বকেয়া ব্যালেন্স এবং অনলাইন ও অফলাইন লাইব্রেরি ডিউ ট্র্যাকিং',
              'Tracking payments, dues & balances for Farid Bhai Press and online/offline libraries',
              language
            )}
          </p>
        </div>

        {/* Sub-tab Switcher (Black & White) */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 w-full sm:w-auto flex-wrap sm:flex-nowrap gap-1">
          <button
            onClick={() => setActiveSubTab('press')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'press'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{tr('প্রেস পেমেন্ট ও ব্যালেন্স', 'Press Payments & Balance', language)}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'orders'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{tr('প্রেস অর্ডার ম্যানেজমেন্ট', 'Press Order Management', language)}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('channels')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'channels'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>{tr('অনলাইন ও অফলাইন ডিউ', 'Online & Offline Dues', language)}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        
        {/* Total Press Bill */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">
            {tr('মোট প্রেস বিল (অর্ডার)', 'Total Press Bill (Orders)', language)}
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(pressAccounts.totalOrderBill, language)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            {tr('প্রাপ্ত চালান:', 'Received Chalan:', language)} {formatBDT(pressAccounts.totalReceivedBill, language)}
          </div>
        </div>

        {/* Paid to Press */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">
            {tr('প্রেসকে পরিশোধিত', 'Paid to Press', language)}
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(pressAccounts.totalPaidToPress, language)}
          </div>
          <div className="text-[10px] text-zinc-600 mt-1">
            {tr(`মোট ${pressPayments.length} টি ভাউচার`, `Total ${pressPayments.length} Vouchers`, language)}
          </div>
        </div>

        {/* Press Net Due / Balance */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">
            {tr('প্রেসের বকেয়া ব্যালেন্স', 'Press Due / Balance', language)}
          </div>
          <div className={`text-xl font-bold font-mono mt-1 ${pressAccounts.netDueOnOrder > 0 ? 'text-zinc-900' : 'text-zinc-600'}`}>
            {pressAccounts.netDueOnOrder > 0
              ? `${formatBDT(pressAccounts.netDueOnOrder, language)}`
              : pressAccounts.netDueOnOrder < 0
              ? `+${formatBDT(Math.abs(pressAccounts.netDueOnOrder), language)}`
              : '৳০'}
          </div>
          <div className="text-[10px] font-medium text-zinc-500 mt-1">
            {pressAccounts.netDueOnOrder > 0 
              ? tr('⚠️ প্রেস পাবে', '⚠️ Payable to Press', language) 
              : pressAccounts.netDueOnOrder < 0 
              ? tr('✓ আমরা অগ্রিম পাবো', '✓ Advance Balance', language) 
              : tr('✓ পরিশোধিত', '✓ Paid', language)}
          </div>
        </div>

        {/* Total Sales Billed */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">
            {tr('মোট বিক্রয় (বিক্রিত মূল্য)', 'Total Sales (Billed)', language)}
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(channelAccounts.totalBilled, language)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            {tr('অনলাইন + অফলাইন মোট', 'Online + Offline Total', language)}
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">
            {tr('মোট আদায় / কালেকশন', 'Total Collected', language)}
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(channelAccounts.totalCollected, language)}
          </div>
          <div className="text-[10px] text-zinc-600 mt-1">
            {tr('আদায় হার:', 'Collection Rate:', language)} {channelAccounts.totalBilled > 0 ? ((channelAccounts.totalCollected / channelAccounts.totalBilled) * 100).toFixed(1) : 100}%
          </div>
        </div>

        {/* Total Pending Due */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">
            {tr('মোট বকেয়া / ডিউ', 'Total Pending Due', language)}
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(channelAccounts.totalDue, language)}
          </div>
          <div className="text-[10px] font-medium text-zinc-500 mt-1">
            {tr('অনলাইন', 'Online', language)} {formatBDT(channelAccounts.onlineDue, language)} • {tr('অফলাইন', 'Offline', language)} {formatBDT(channelAccounts.offlineDue, language)}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: PRESS ACCOUNTS & PAYMENT LEDGER */}
      {/* ======================================================== */}
      {activeSubTab === 'press' && (
        <div className="space-y-6">
          
          {/* Press Accounts Per-Book Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">
                  {tr('বই ভিত্তিক প্রেস হিসাব খতিয়ান (ফরিদ ভাই প্রেস)', 'Book-wise Press Ledger (Farid Bhai Press)', language)}
                </h3>
                <p className="text-xs text-zinc-500">
                  {tr(
                    'প্রতিটি বইয়ের জন্য মোট অর্ডার বিল, প্রাপ্ত চালান মূল্য ও পরিশোধিত ব্যালেন্স',
                    'Total order bill, received chalan value, and net balance per book',
                    language
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  onClick={onAddPressPayment}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-all shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{tr('+ প্রেস পেমেন্ট ভাউচার এন্ট্রি', '+ Enter Press Payment Voucher', language)}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span>👉 {tr('পুরো টেবিল দেখতে ডানে স্ক্রোল করুন', 'Scroll right to view full table', language)}</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-200">
                    <th className="py-2.5 px-3 text-center w-12">SL</th>
                    <th className="py-2.5 px-3 min-w-[200px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('অর্ডার কপি', 'Order Copies', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('ছাপার খরচ', 'Unit Cost', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('মোট অর্ডার বিল', 'Total Order Bill', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('প্রাপ্ত চালান', 'Received Chalan', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('চালান মূল্য', 'Chalan Value', language)}</th>
                    <th className="py-2.5 px-3 text-right bg-zinc-200/50">{tr('পরিশোধিত টাকা', 'Amount Paid', language)}</th>
                    <th className="py-2.5 px-3 text-right bg-zinc-200/80">{tr('বাকি / ব্যালেন্স', 'Due / Balance', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('স্ট্যাটাস', 'Status', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pressAccounts.bookAccounts.map((b) => (
                    <tr key={b.bookId} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-600">{b.sl}</td>
                      <td className="py-3 px-3 font-bold text-zinc-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{b.bookName}</span>
                          {books.find(bk => bk.id === b.bookId)?.edition && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-900 border border-blue-200">
                              {books.find(bk => bk.id === b.bookId)?.edition}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-bold text-zinc-900">
                          {formatNumber(b.orderQuantity, language)} {tr('কপি', 'copies', language)}
                        </div>
                        {b.orderCount > 1 && (
                          <div className="text-[10px] text-zinc-500 font-medium">
                            {formatNumber(b.orderCount, language)} {tr('টি লট', 'Lots', language)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatBDT(b.makingCost, language)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(b.totalOrderBill, language)}</td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-700">
                        {formatNumber(b.receivedCopies, language)} {tr('কপি', 'copies', language)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-700">{formatBDT(b.receivedBill, language)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 bg-zinc-50/50">{formatBDT(b.totalPaid, language)}</td>
                      <td className="py-3 px-3 text-right font-mono font-black bg-zinc-50 text-zinc-900">
                        {b.dueOnOrder > 0
                          ? formatBDT(b.dueOnOrder, language)
                          : b.dueOnOrder < 0
                          ? `+${formatBDT(Math.abs(b.dueOnOrder), language)}`
                          : '৳০'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.dueOnOrder > 0
                            ? 'bg-zinc-100 text-zinc-900 border-zinc-400'
                            : b.dueOnOrder < 0
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}>
                          {b.dueOnOrder > 0 
                            ? tr('ডিউ বাকি', 'Due Pending', language) 
                            : b.dueOnOrder < 0 
                            ? tr('অগ্রিম ব্যালেন্স', 'Advance', language) 
                            : tr('পরিশোধিত', 'Paid', language)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black text-zinc-900 border-t-2 border-zinc-300">
                    <td colSpan={2} className="py-3 px-3 text-right">{tr('সর্বমোট যোগফল:', 'Grand Total:', language)}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.orderQuantity, 0), language)} {tr('কপি', 'copies', language)}
                    </td>
                    <td></td>
                    <td className="py-3 px-3 text-right font-mono">{formatBDT(pressAccounts.totalOrderBill, language)}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.receivedCopies, 0), language)} {tr('কপি', 'copies', language)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{formatBDT(pressAccounts.totalReceivedBill, language)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-zinc-200/50">{formatBDT(pressAccounts.totalPaidToPress, language)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-zinc-200/80">
                      {pressAccounts.netDueOnOrder > 0
                        ? formatBDT(pressAccounts.netDueOnOrder, language)
                        : pressAccounts.netDueOnOrder < 0
                        ? `+${formatBDT(Math.abs(pressAccounts.netDueOnOrder), language)}`
                        : '৳০'}
                    </td>
                    <td className="py-3 px-3 text-center font-normal text-xs text-zinc-600">
                      {pressAccounts.netDueOnOrder > 0 ? tr('প্রেস পাবে', 'Payable to Press', language) : tr('পরিশোধিত', 'Paid', language)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Press Payment Voucher Ledger History */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">
                  {tr('প্রেস পেমেন্ট ভাউচার হিস্ট্রি', 'Press Payment Voucher History', language)}
                </h3>
                <p className="text-xs text-zinc-500">
                  {tr(
                    `প্রেসে প্রদানকৃত সকল চেক, ব্যাংক ও ক্যাশ ট্রানজেকশনের তালিকা (${pressPayments.length} টি)`,
                    `All cheque, bank, and cash transactions to press (${pressPayments.length})`,
                    language
                  )}
                </p>
              </div>

              {onOpenPrintPressVouchers && (
                <button
                  type="button"
                  onClick={onOpenPrintPressVouchers}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-700" />
                  <span>{tr('🖨️ প্রেস ভাউচার প্রিন্ট (১০টি/পৃষ্ঠা)', 'Print Press Vouchers (10/page)', language)}</span>
                </button>
              )}
            </div>

            {pressPayments.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                {tr(
                  'এখনও কোনো প্রেস পেমেন্ট এন্ট্রি করা হয়নি। উপরে "প্রেস পেমেন্ট ভাউচার এন্ট্রি" বাটনে ক্লিক করে যুক্ত করুন।',
                  'No press payment entries yet. Click "+ Enter Press Payment Voucher" above to add.',
                  language
                )}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                      <th className="py-2.5 px-3">{tr('তারিখ', 'Date', language)}</th>
                      <th className="py-2.5 px-3">{tr('খাত / বইয়ের নাম', 'Account / Book Name', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('পরিশোধিত পরিমাণ', 'Amount Paid', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('পেমেন্ট মাধ্যম', 'Payment Method', language)}</th>
                      <th className="py-2.5 px-3">{tr('ভাউচার / চেক নং', 'Voucher / Cheque No', language)}</th>
                      <th className="py-2.5 px-3">{tr('বিবরণ / নোট', 'Notes / Remarks', language)}</th>
                      <th className="py-2.5 px-3 text-center w-16">{tr('অ্যাকশন', 'Action', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pressPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">{p.date}</td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-800">{p.bookName || tr('সার্বিক প্রেস অর্ডার', 'General Press Account', language)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(p.amount, language)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-zinc-100 px-2 py-0.5 rounded text-[11px] font-medium border border-zinc-200 text-zinc-800 uppercase">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{p.voucherNo || '—'}</span>
                            {p.voucherImage && (
                              <button
                                type="button"
                                onClick={() => openImagePreview(p.voucherImage, `${p.bookName || tr('প্রেস পেমেন্ট', 'Press Payment', language)} (${p.voucherNo || 'ভাউচার'})`, `${p.date} • ${formatBDT(p.amount, language)}`)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
                                title={tr('ভাউচারের ছবি দেখুন', 'View Voucher Image', language)}
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>{tr('ছবি', 'Photo', language)}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">{p.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(tr('আপনি কি এই পেমেন্ট ভাউচারটি মুছে ফেলতে চান?', 'Are you sure you want to delete this payment voucher?', language))) {
                                onDeletePressPayment(p.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                            title={tr('মুছে ফেলুন', 'Delete', language)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: PRESS ORDER & DELIVERY MANAGEMENT */}
      {/* ======================================================== */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Top Control Bar: Book-wise Filter, Voucher Search, and Add Action Buttons */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            
            {/* Book-wise selector & Voucher Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              
              {/* Book-wise dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                <select
                  value={selectedBookFilter}
                  onChange={(e) => setSelectedBookFilter(e.target.value)}
                  className="text-xs font-bold border border-zinc-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-zinc-900 w-full sm:w-auto"
                >
                  <option value="all">{tr(`সবগুলো বই (${books.length} টি)`, `All Books (${books.length})`, language)}</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.sl}. {b.bookName}{b.edition ? ` [${b.edition}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Find by Voucher Number Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={voucherSearchQuery}
                  onChange={(e) => setVoucherSearchQuery(e.target.value)}
                  placeholder={tr('ভাউচার / চালান নং বা বিবরণ দিয়ে খুঁজুন (Find by Voucher No)...', 'Find by Voucher / Chalan No or remarks...', language)}
                  className="w-full text-xs pl-8 pr-7 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900 font-mono"
                />
                {voucherSearchQuery && (
                  <button
                    onClick={() => setVoucherSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    title={tr('ক্লিয়ার করুন', 'Clear', language)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>

            {/* Action Buttons: Add Press Order & Add Received Delivery */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => onAddPressOrder(selectedBookFilter !== 'all' ? selectedBookFilter : undefined)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-all shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{tr('+ নতুন প্রেস অর্ডার', '+ New Press Order', language)}</span>
              </button>

              <button
                onClick={() => onAddPressDelivery(selectedBookFilter !== 'all' ? selectedBookFilter : undefined)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl transition-all shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{tr('+ প্রেস চালান গ্রহণ', '+ Receive Press Chalan', language)}</span>
              </button>
            </div>

          </div>

          {/* Book-wise Aggregated Metrics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-500">
                {tr('মোট প্রেস অর্ডার কপি', 'Total Press Order Copies', language)}
              </div>
              <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
                {formatNumber(totalOrderedCopies, language)} {tr('কপি', 'copies', language)}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                {tr(`মোট ${filteredOrders.length} টি অর্ডার লট`, `Total ${filteredOrders.length} Order Lots`, language)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-500">
                {tr('প্রেস থেকে প্রাপ্ত চালান', 'Received from Press', language)}
              </div>
              <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
                {formatNumber(totalDeliveredCopies, language)} {tr('কপি', 'copies', language)}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                {tr(`মোট ${filteredDeliveries.length} টি ডেলিভারি চালান`, `Total ${filteredDeliveries.length} Delivery Chalans`, language)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-500">
                {tr('প্রেসে অবশিষ্ট ব্যালেন্স', 'Remaining at Press', language)}
              </div>
              <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
                {formatNumber(remainingAtPress, language)} {tr('কপি', 'copies', language)}
              </div>
              <div className="text-[10px] font-medium text-zinc-500 mt-1">
                {remainingAtPress > 0 
                  ? tr('ডেলিভারি বাকি আছে', 'Pending Delivery', language) 
                  : tr('✓ সব কপি সরবরাহ সমাপ্ত', '✓ All Deliveries Completed', language)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-500">
                {tr('মোট প্রেস অর্ডার চুক্তি বিল', 'Total Press Order Bill', language)}
              </div>
              <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
                {formatBDT(totalOrdersBill, language)}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                {tr(`ভাউচার সংখ্যা: ${filteredOrders.length} টি`, `Vouchers: ${filteredOrders.length}`, language)}
              </div>
            </div>

          </div>

          {/* -------------------------------------------------------- */}
          {/* Section 1: প্রেস অর্ডার তালিকা (Press Order List) */}
          {/* -------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-900 text-sm">
                    {tr('১. প্রেসে প্রদানকৃত অর্ডার তালিকা (Press Order List)', '1. Press Order List', language)}
                  </h3>
                  <span className="bg-zinc-100 text-zinc-800 text-[11px] font-mono px-2 py-0.5 rounded-full border border-zinc-200">
                    {formatNumber(filteredOrders.length, language)} {tr('টি', '', language)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {tr(
                    'ফরিদ ভাই প্রেসে বই ছাপার জন্য দেওয়া ১ম, ২য় ও রি-অর্ডার লট এবং চুক্তি বিল',
                    '1st, 2nd & re-order lots and printing contract bills placed at Farid Bhai Press',
                    language
                  )}
                </p>
              </div>

              <button
                onClick={() => onAddPressOrder(selectedBookFilter !== 'all' ? selectedBookFilter : undefined)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg transition-all shadow-xs self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{tr('+ প্রেস অর্ডার যুক্ত করুন', '+ Add Press Order', language)}</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span>👉 {tr('পুরো টেবিল দেখতে ডানে স্ক্রোল করুন', 'Scroll right to view full table', language)}</span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                {voucherSearchQuery
                  ? tr(`"${voucherSearchQuery}" ভাউচার বা বিবরণের কোনো প্রেস অর্ডার পাওয়া যায়নি।`, `No press orders matched "${voucherSearchQuery}".`, language)
                  : tr('এই বইয়ের জন্য এখনও কোনো প্রেস অর্ডার এন্ট্রি করা হয়নি। "+ নতুন প্রেস অর্ডার" বাটনে ক্লিক করে যুক্ত করুন।', 'No press orders found for this book. Click "+ New Press Order" to add.', language)}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                      <th className="py-2.5 px-3">{tr('অর্ডারের তারিখ', 'Order Date', language)}</th>
                      <th className="py-2.5 px-3">{tr('ভাউচার / অর্ডার নং', 'Voucher / PO No', language)}</th>
                      <th className="py-2.5 px-3 min-w-[180px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                      <th className="py-2.5 px-3">{tr('সংস্করণ / লট', 'Edition / Lot', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('অর্ডার কপি', 'Order Copies', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('ছাপার খরচ', 'Unit Cost', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('মোট বিল', 'Total Bill', language)}</th>
                      <th className="py-2.5 px-3">{tr('নোট / বিবরণ', 'Notes / Remarks', language)}</th>
                      <th className="py-2.5 px-3 text-center w-16">{tr('অ্যাকশন', 'Action', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">{o.orderDate}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                              {o.orderNo || 'PO-DEFAULT'}
                            </span>
                            {o.voucherImage && (
                              <button
                                type="button"
                                onClick={() => openImagePreview(o.voucherImage, `${o.bookName} (${o.orderNo || tr('অর্ডার স্লিপ', 'PO Slip', language)})`, `${o.orderDate} • ${o.lotName || ''} • ${formatNumber(o.orderQuantity, language)} ${tr('কপি', 'copies', language)}`)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
                                title={tr('অর্ডার স্লিপের ছবি দেখুন', 'View PO Slip Image', language)}
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>{tr('স্লিপ', 'Slip', language)}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-zinc-900">{o.bookName}</td>
                        <td className="py-2.5 px-3 font-medium text-zinc-700">
                          <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[11px] border border-zinc-200">
                            {o.lotName || tr('প্রেস অর্ডার', 'Press Order', language)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900">
                          {formatNumber(o.orderQuantity, language)} {tr('কপি', 'copies', language)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-700">
                          {formatBDT(o.makingCost || 0, language)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-zinc-900">
                          {formatBDT(o.totalBill || 0, language)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">{o.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(tr(`আপনি কি এই প্রেস অর্ডারটি (${o.orderNo || o.lotName || ''} - ${formatNumber(o.orderQuantity)} কপি) মুছে ফেলতে চান?`, `Are you sure you want to delete this press order (${o.orderNo || o.lotName || ''})?`, language))) {
                                onDeletePressOrder(o.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                            title={tr('মুছে ফেলুন', 'Delete', language)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black text-zinc-900 border-t-2 border-zinc-300">
                      <td colSpan={4} className="py-3 px-3 text-right">{tr('মোট প্রেস অর্ডার যোগফল:', 'Total Press Orders:', language)}</td>
                      <td className="py-3 px-3 text-center font-mono">{formatNumber(totalOrderedCopies, language)} {tr('কপি', 'copies', language)}</td>
                      <td></td>
                      <td className="py-3 px-3 text-right font-mono">{formatBDT(totalOrdersBill, language)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* -------------------------------------------------------- */}
          {/* Section 2: প্রেস থেকে আসা বইয়ের চালান তালিকা (Press Received Deliveries) */}
          {/* -------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-900 text-sm">
                    {tr('২. প্রেস থেকে আসা বইয়ের চালান তালিকা (Received Books From Press)', '2. Received Books From Press (Chalans)', language)}
                  </h3>
                  <span className="bg-zinc-100 text-zinc-800 text-[11px] font-mono px-2 py-0.5 rounded-full border border-zinc-200">
                    {formatNumber(filteredDeliveries.length, language)} {tr('টি', '', language)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {tr(
                    'ফরিদ ভাই প্রেস থেকে সরাসরি হেড অফিস ওয়্যারহাউসে গ্রহণকৃত চালান ভাউচার',
                    'Chalan vouchers of books received directly from Farid Bhai Press to Head Office warehouse',
                    language
                  )}
                </p>
              </div>

              <button
                onClick={() => onAddPressDelivery(selectedBookFilter !== 'all' ? selectedBookFilter : undefined)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg transition-all shadow-xs self-start sm:self-auto"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{tr('+ প্রেস চালান গ্রহণ', '+ Receive Press Chalan', language)}</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span>👉 {tr('পুরো টেবিল দেখতে ডানে স্ক্রোল করুন', 'Scroll right to view full table', language)}</span>
            </div>

            {filteredDeliveries.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                {voucherSearchQuery
                  ? tr(`"${voucherSearchQuery}" ভাউচার বা চালানের কোনো বই ডেলিভারি পাওয়া যায়নি।`, `No delivery chalans matched "${voucherSearchQuery}".`, language)
                  : tr('এই বইয়ের জন্য এখনও কোনো প্রেস চালান গ্রহণ এন্ট্রি করা হয়নি। "+ প্রেস চালান গ্রহণ" বাটনে ক্লিক করে যুক্ত করুন।', 'No deliveries recorded yet. Click "+ Receive Press Chalan" to add.', language)}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                      <th className="py-2.5 px-3">{tr('গ্রহণের তারিখ', 'Receipt Date', language)}</th>
                      <th className="py-2.5 px-3">{tr('প্রেস চালান / ভাউচার নং', 'Chalan / Voucher No', language)}</th>
                      <th className="py-2.5 px-3 min-w-[180px]">{tr('বইয়ের নাম', 'Book Name', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('গ্রহণকৃত কপি', 'Received Copies', language)}</th>
                      <th className="py-2.5 px-3">{tr('সংস্করণ / লট', 'Edition / Lot', language)}</th>
                      <th className="py-2.5 px-3">{tr('গ্রহীতা / ওয়্যারহাউস', 'Receiver / Warehouse', language)}</th>
                      <th className="py-2.5 px-3">{tr('নোট / বিবরণ', 'Notes / Remarks', language)}</th>
                      <th className="py-2.5 px-3 text-center w-16">{tr('অ্যাকশন', 'Action', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredDeliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">{d.deliveryDate}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                              {d.chalanNo}
                            </span>
                            {d.voucherImage && (
                              <button
                                type="button"
                                onClick={() => openImagePreview(d.voucherImage, `${d.bookName} (${d.chalanNo})`, `${d.deliveryDate} • ${formatNumber(d.quantity, language)} ${tr('কপি গ্রহণ', 'copies received', language)} • ${d.receivedBy || ''}`)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors shadow-2xs"
                                title={tr('চালানের ছবি দেখুন', 'View Chalan Image', language)}
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>{tr('চালান', 'Chalan', language)}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-zinc-900">{d.bookName}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900">
                          {formatNumber(d.quantity, language)} {tr('কপি', 'copies', language)}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-700">
                          {d.lotName ? (
                            <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[11px] border border-zinc-200">
                              {d.lotName}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-700">{d.receivedBy || tr('হেড অফিস স্টোর', 'Head Office Store', language)}</td>
                        <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">{d.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(tr(`আপনি কি এই প্রেস চালানটি (${d.chalanNo} - ${formatNumber(d.quantity)} কপি) মুছে ফেলতে চান?`, `Are you sure you want to delete this delivery chalan (${d.chalanNo})?`, language))) {
                                onDeletePressDelivery(d.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                            title={tr('মুছে ফেলুন', 'Delete', language)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black text-zinc-900 border-t-2 border-zinc-300">
                      <td colSpan={3} className="py-3 px-3 text-right">{tr('মোট গ্রহণকৃত চালান কপি:', 'Total Received Copies:', language)}</td>
                      <td className="py-3 px-3 text-center font-mono">{formatNumber(totalDeliveredCopies, language)} {tr('কপি', 'copies', language)}</td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: ONLINE & OFFLINE CHANNEL DUE LEDGER */}
      {/* ======================================================== */}
      {activeSubTab === 'channels' && (
        <div className="space-y-6">
          
          {/* Split Summary Cards: Online Due vs Offline Due */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Online Due Overview */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">
                      {tr('অনলাইন চ্যানেল ডিউ খতিয়ান', 'Online Channels Due Ledger', language)}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {tr('বইবাড়ি, রকমারি, ওয়াফিলাইফ ও অন্যান্য', 'Boibari, Rokomari, Wafilife & others', language)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onAddChannelCollection('boibari')}
                  className="text-xs font-bold text-white bg-zinc-900 hover:bg-black px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                >
                  {tr('+ অনলাইন কালেকশন', '+ Online Collection', language)}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">{tr('মোট বিক্রয়', 'Total Sold', language)}</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineBilled, language)}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">{tr('আদায়কৃত', 'Collected', language)}</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineCollected, language)}</span>
                </div>
                <div className="p-2.5 bg-zinc-100 border border-zinc-300 rounded-xl">
                  <span className="text-[10px] text-zinc-600 block font-bold">{tr('অনলাইন ডিউ', 'Online Due', language)}</span>
                  <span className="text-sm font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineDue, language)}</span>
                </div>
              </div>
            </div>

            {/* Offline Due Overview */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900 border border-zinc-200">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">
                      {tr('অফলাইন ও লাইব্রেরি ডিউ খতিয়ান', 'Offline & Library Due Ledger', language)}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {tr('সুমনা, প্রমিজ, জয়স্টার, নীলক্ষেত ও হেড অফিস', 'Sumona, Promise, Joystar, Nilkhet & Head Office', language)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onAddChannelCollection('sumonaLibrary')}
                  className="text-xs font-bold text-white bg-zinc-900 hover:bg-black px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                >
                  {tr('+ লাইব্রেরি কালেকশন', '+ Library Collection', language)}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">{tr('মোট বিক্রয়', 'Total Sold', language)}</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineBilled, language)}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">{tr('আদায়কৃত', 'Collected', language)}</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineCollected, language)}</span>
                </div>
                <div className="p-2.5 bg-zinc-100 border border-zinc-300 rounded-xl">
                  <span className="text-[10px] text-zinc-600 block font-bold">{tr('অফলাইন ডিউ', 'Offline Due', language)}</span>
                  <span className="text-sm font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineDue, language)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Detailed All Channels Due Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">
                  {tr('চ্যানেল ও লাইব্রেরিভিত্তিক বিশদ ডিউ হিসাব', 'Channel & Library Detailed Dues', language)}
                </h3>
                <p className="text-xs text-zinc-500">
                  {tr('প্রতিটি প্ল্যাটফর্মের বিক্রিত কপি, মোট ইনভয়েস মূল্য, আদায় ও বর্তমান বকেয়া', 'Sold copies, total invoiced, collected and pending due per platform', language)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {onOpenPrintCollectionVouchers && (
                  <button
                    type="button"
                    onClick={() => onOpenPrintCollectionVouchers()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-xs"
                    title={tr('সকল লাইব্রেরির আদায় ভাউচার ১০টি করে পৃষ্ঠায় প্রিন্ট করুন', 'Print Collection Vouchers (10/page)', language)}
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{tr('🖨️ আদায় ভাউচার প্রিন্ট (১০টি/পৃষ্ঠা)', 'Print Collection Vouchers (10/page)', language)}</span>
                  </button>
                )}
                {onOpenAddChannel && (
                  <button
                    type="button"
                    onClick={() => onOpenAddChannel('offline')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl transition-all shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{tr('+ নতুন চ্যানেল যোগ', '+ Add Channel', language)}</span>
                  </button>
                )}
                <button
                  onClick={() => onAddChannelCollection()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-all shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{tr('+ নতুন কালেকশন এন্ট্রি', '+ New Collection Entry', language)}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span>👉 {tr('পুরো টেবিল দেখতে ডানে স্ক্রোল করুন', 'Scroll right to view full table', language)}</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-200">
                    <th className="py-2.5 px-3 min-w-[200px]">{tr('চ্যানেল / লাইব্রেরি', 'Channel / Library', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('ক্যাটেগরি', 'Category', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('বিক্রিত কপি', 'Sold Copies', language)}</th>
                    <th className="py-2.5 px-3 text-right">{tr('মোট বিক্রয় মূল্য', 'Total Billed', language)}</th>
                    <th className="py-2.5 px-3 text-right bg-zinc-200/50">{tr('আদায়কৃত টাকা', 'Amount Collected', language)}</th>
                    <th className="py-2.5 px-3 text-right bg-zinc-200/80">{tr('বকেয়া / ডিউ', 'Pending Due', language)}</th>
                    <th className="py-2.5 px-3 min-w-[120px]">{tr('আদায় হার (%)', 'Collection Rate (%)', language)}</th>
                    <th className="py-2.5 px-3 text-center">{tr('স্ট্যাটাস', 'Status', language)}</th>
                    <th className="py-2.5 px-3 text-center w-24">{tr('অ্যাকশন', 'Action', language)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {channelAccounts.channels.map((ch) => (
                    <tr key={ch.key} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-zinc-900">{ch.name}</div>
                        <div className="text-[10px] text-zinc-400">{ch.category}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          ch.type === 'online'
                            ? 'bg-zinc-100 text-zinc-800 border-zinc-300'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}>
                          {ch.type === 'online' ? tr('অনলাইন', 'Online', language) : tr('অফলাইন', 'Offline', language)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-800">
                        {formatNumber(ch.totalCopies, language)} {tr('কপি', 'copies', language)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">
                        {formatBDT(ch.totalBilled, language)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 bg-zinc-50/50">
                        {formatBDT(ch.totalCollected, language)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-zinc-900 bg-zinc-50">
                        {ch.dueAmount > 0 ? (
                          <span className="text-zinc-900 font-bold">{formatBDT(ch.dueAmount, language)}</span>
                        ) : (
                          <span className="text-zinc-400">৳০</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/60">
                            <div 
                              className="bg-zinc-900 h-full rounded-full transition-all"
                              style={{ width: `${ch.collectionRate}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-600 whitespace-nowrap">
                            {ch.collectionRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ch.dueAmount > 0
                            ? 'bg-zinc-100 text-zinc-900 border-zinc-400'
                            : 'bg-zinc-900 text-white border-zinc-900'
                        }`}>
                          {ch.dueAmount > 0 ? tr('ডিউ বাকি', 'Due Pending', language) : tr('পরিশোধিত', 'Paid', language)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onAddChannelCollection(ch.key)}
                            className="text-[11px] font-bold text-zinc-800 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded-lg transition-colors border border-zinc-300"
                            title={tr('টাকা আদায়ের ভাউচার লিখুন', 'Record collection receipt', language)}
                          >
                            {tr('আদায়', 'Collect', language)}
                          </button>
                          {onOpenPrintCollectionVouchers && (
                            <button
                              type="button"
                              onClick={() => onOpenPrintCollectionVouchers(ch.key)}
                              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors border border-emerald-200 flex items-center gap-1"
                              title={tr(`${ch.name} এর ভাউচার ১০টি করে পৃষ্ঠায় প্রিন্ট করুন`, `Print collection vouchers for ${ch.name}`, language)}
                            >
                              <Printer className="w-3 h-3 text-emerald-700" />
                              <span>{tr('প্রিন্ট', 'Print', language)}</span>
                            </button>
                          )}
                          {onOpenEditChannel && (
                            <button
                              type="button"
                              onClick={() => {
                                const found = effectiveChannels.find(c => c.id === ch.key);
                                if (found) onOpenEditChannel(found);
                              }}
                              className="p-1 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={tr('চ্যানেল সম্পাদন বা মুছুন', 'Edit or Delete Channel', language)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black text-zinc-900 border-t-2 border-zinc-300">
                    <td colSpan={2} className="py-3 px-3 text-right">{tr('সর্বমোট যোগফল:', 'Grand Total:', language)}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {formatNumber(channelAccounts.channels.reduce((s, x) => s + x.totalCopies, 0), language)} {tr('কপি', 'copies', language)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{formatBDT(channelAccounts.totalBilled, language)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-zinc-200/50">{formatBDT(channelAccounts.totalCollected, language)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-zinc-200/80">{formatBDT(channelAccounts.totalDue, language)}</td>
                    <td colSpan={3} className="py-3 px-3 text-center font-normal text-xs text-zinc-600">
                      {tr('সম্মিলিত আদায় হার:', 'Combined Collection Rate:', language)} {channelAccounts.totalBilled > 0 ? ((channelAccounts.totalCollected / channelAccounts.totalBilled) * 100).toFixed(1) : 100}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Channel Collection Receipts Ledger History */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">
                  {tr('বিক্রয় আদায় / কালেকশন হিস্ট্রি', 'Sales Collection History', language)}
                </h3>
                <p className="text-xs text-zinc-500">
                  {tr(
                    `অনলাইন ও লাইব্রেরি থেকে প্রাপ্ত মোট ${channelCollections.length} টি জমার রশিদ`,
                    `Total ${channelCollections.length} collection receipts received from online & library channels`,
                    language
                  )}
                </p>
              </div>

              {onOpenPrintCollectionVouchers && (
                <button
                  type="button"
                  onClick={() => onOpenPrintCollectionVouchers()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{tr('🖨️ কালেকশন ভাউচার প্রিন্ট (১০টি/পৃষ্ঠা)', 'Print Vouchers (10/page)', language)}</span>
                </button>
              )}
            </div>

            {channelCollections.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                {tr(
                  'এখনও কোনো কালেকশন এন্ট্রি করা হয়নি। উপরে "+ নতুন কালেকশন এন্ট্রি" বাটনে ক্লিক করে যুক্ত করুন।',
                  'No collection records yet. Click "+ New Collection Entry" above to add.',
                  language
                )}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                      <th className="py-2.5 px-3">{tr('তারিখ', 'Date', language)}</th>
                      <th className="py-2.5 px-3">{tr('চ্যানেল / লাইব্রেরি', 'Channel / Library', language)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('আদায়কৃত টাকা', 'Amount Collected', language)}</th>
                      <th className="py-2.5 px-3 text-center">{tr('পেমেন্ট মাধ্যম', 'Payment Method', language)}</th>
                      <th className="py-2.5 px-3">{tr('রশিদ / ভাউচার নং', 'Receipt / Trx No', language)}</th>
                      <th className="py-2.5 px-3">{tr('বিবরণ / নোট', 'Notes / Remarks', language)}</th>
                      <th className="py-2.5 px-3 text-center w-16">{tr('অ্যাকশন', 'Action', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {channelCollections.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">{c.date}</td>
                        <td className="py-2.5 px-3 font-bold text-zinc-900">{c.channelName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(c.amount, language)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-zinc-100 px-2 py-0.5 rounded text-[11px] font-medium border border-zinc-200 text-zinc-800 uppercase">
                            {c.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{c.receiptNo || '—'}</span>
                            {(c.voucherImage || c.receiptImage) && (
                              <button
                                type="button"
                                onClick={() => openImagePreview(c.voucherImage || c.receiptImage, `${c.channelName} (${c.receiptNo || tr('রশিদ', 'Receipt', language)})`, `${c.date} • ${formatBDT(c.amount, language)}`)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                                title={tr('মানি রিসিটের ছবি দেখুন', 'View Receipt Image', language)}
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>{tr('রশিদ', 'Receipt', language)}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">{c.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(tr('আপনি কি এই কালেকশন রেকর্ডটি মুছে ফেলতে চান?', 'Are you sure you want to delete this collection record?', language))) {
                                onDeleteChannelCollection(c.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                            title={tr('মুছে ফেলুন', 'Delete', language)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Fullscreen Image Preview Lightbox */}
      <ImageViewerModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        language={language}
      />

    </div>
  );
};
