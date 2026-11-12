import React, { useState } from 'react';
import { 
  CreditCard, 
  HandCoins, 
  Warehouse, 
  Store, 
  Globe, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  Layers,
  Search,
  Truck,
  X,
  BookOpen,
  Filter
} from 'lucide-react';
import { 
  BookRecord, 
  PressPaymentRecord, 
  ChannelCollectionRecord, 
  PressOrderRecord, 
  PressDeliveryRecord 
} from '../types/book';
import { 
  calculatePressAccounts, 
  calculateChannelDueAccounts, 
  formatBDT, 
  formatNumber,
  formatMonthYearBengali 
} from '../utils/calculations';

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
  selectedMonth = 11,
  selectedYear = 2026,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'press' | 'orders' | 'channels'>('press');
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');
  const [voucherSearchQuery, setVoucherSearchQuery] = useState<string>('');

  // Compute live press financials (incorporating multi press orders)
  const pressAccounts = calculatePressAccounts(books, pressPayments, pressOrders);

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

  // Compute live channel dues & collections
  const channelAccounts = calculateChannelDueAccounts(books, channelCollections);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner & High-Level Financial Overview */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
            <span>প্রেস হিসাব ও বিক্রয় ডিউ খতিয়ান</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            ফরিদ ভাই প্রেসে পরিশোধিত পেমেন্ট, বকেয়া ব্যালেন্স এবং অনলাইন ও অফলাইন লাইব্রেরি ডিউ ট্র্যাকিং
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
            <span>প্রেস পেমেন্ট ও ব্যালেন্স</span>
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
            <span>প্রেস অর্ডার ম্যানেজমেন্ট</span>
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
            <span>অনলাইন ও অফলাইন ডিউ</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        
        {/* Total Press Bill */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">মোট প্রেস বিল (অর্ডার)</div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(pressAccounts.totalOrderBill)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            প্রাপ্ত চালান: {formatBDT(pressAccounts.totalReceivedBill)}
          </div>
        </div>

        {/* Paid to Press */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">প্রেসকে পরিশোধিত</div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(pressAccounts.totalPaidToPress)}
          </div>
          <div className="text-[10px] text-zinc-600 mt-1">
            মোট {pressPayments.length} টি ভাউচার
          </div>
        </div>

        {/* Press Net Due / Balance */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">প্রেসের বকেয়া ব্যালেন্স</div>
          <div className={`text-xl font-bold font-mono mt-1 ${pressAccounts.netDueOnOrder > 0 ? 'text-zinc-900' : 'text-zinc-600'}`}>
            {pressAccounts.netDueOnOrder > 0
              ? `${formatBDT(pressAccounts.netDueOnOrder)}`
              : pressAccounts.netDueOnOrder < 0
              ? `+${formatBDT(Math.abs(pressAccounts.netDueOnOrder))}`
              : '৳০'}
          </div>
          <div className="text-[10px] font-medium text-zinc-500 mt-1">
            {pressAccounts.netDueOnOrder > 0 ? '⚠️ প্রেস পাবে' : pressAccounts.netDueOnOrder < 0 ? '✓ আমরা অগ্রিম পাবো' : '✓ পরিশোধিত'}
          </div>
        </div>

        {/* Total Sales Billed */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">মোট বিক্রয় (বিক্রিত মূল্য)</div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(channelAccounts.totalBilled)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            অনলাইন + অফলাইন মোট
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">মোট আদায় / কালেকশন</div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(channelAccounts.totalCollected)}
          </div>
          <div className="text-[10px] text-zinc-600 mt-1">
            আদায় হার: {channelAccounts.totalBilled > 0 ? ((channelAccounts.totalCollected / channelAccounts.totalBilled) * 100).toFixed(1) : 100}%
          </div>
        </div>

        {/* Total Pending Due */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500">মোট বকেয়া / ডিউ</div>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            {formatBDT(channelAccounts.totalDue)}
          </div>
          <div className="text-[10px] font-medium text-zinc-500 mt-1">
            অনলাইন {formatBDT(channelAccounts.onlineDue)} • অফলাইন {formatBDT(channelAccounts.offlineDue)}
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
                <h3 className="font-bold text-zinc-900 text-sm">বই ভিত্তিক প্রেস হিসাব খতিয়ান (ফরিদ ভাই প্রেস)</h3>
                <p className="text-xs text-zinc-500">প্রতিটি বইয়ের জন্য মোট অর্ডার বিল, প্রাপ্ত চালান মূল্য ও পরিশোধিত ব্যালেন্স</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  onClick={() => onAddPressOrder()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl transition-all shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>+ নতুন প্রেস অর্ডার</span>
                </button>
                <button
                  onClick={onAddPressPayment}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-all shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ প্রেস পেমেন্ট ভাউচার এন্ট্রি</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span>👉 পুরো টেবিল দেখতে ডানে স্ক্রোল করুন</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-200">
                    <th className="py-2.5 px-3 text-center w-12">SL</th>
                    <th className="py-2.5 px-3 min-w-[200px]">বইয়ের নাম</th>
                    <th className="py-2.5 px-3 text-center">অর্ডার কপি</th>
                    <th className="py-2.5 px-3 text-right">ছাপার খরচ</th>
                    <th className="py-2.5 px-3 text-right">মোট অর্ডার বিল</th>
                    <th className="py-2.5 px-3 text-center">প্রাপ্ত চালান</th>
                    <th className="py-2.5 px-3 text-right">চালান মূল্য</th>
                    <th className="py-2.5 px-3 text-right bg-zinc-200/50">পরিশোধিত টাকা</th>
                    <th className="py-2.5 px-3 text-right bg-zinc-200/80">বাকি / ব্যালেন্স</th>
                    <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pressAccounts.bookAccounts.map((b) => (
                    <tr key={b.bookId} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-600">{b.sl}</td>
                      <td className="py-3 px-3 font-bold text-zinc-900">{b.bookName}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-bold text-zinc-900">{formatNumber(b.orderQuantity)} কপি</div>
                        {b.orderCount > 1 && (
                          <div className="text-[10px] text-zinc-500 font-medium">
                            {b.orderCount} টি লট
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatBDT(b.makingCost)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(b.totalOrderBill)}</td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-700">{formatNumber(b.receivedCopies)} কপি</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-700">{formatBDT(b.receivedBill)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 bg-zinc-50/50">{formatBDT(b.totalPaid)}</td>
                      <td className="py-3 px-3 text-right font-mono font-black bg-zinc-50 text-zinc-900">
                        {b.dueOnOrder > 0
                          ? formatBDT(b.dueOnOrder)
                          : b.dueOnOrder < 0
                          ? `+${formatBDT(Math.abs(b.dueOnOrder))}`
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
                          {b.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black text-zinc-900 border-t-2 border-zinc-300">
                    <td colSpan={2} className="py-3 px-3 text-right">সর্বমোট যোগফল:</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.orderQuantity, 0))} কপি
                    </td>
                    <td></td>
                    <td className="py-3 px-3 text-right font-mono">{formatBDT(pressAccounts.totalOrderBill)}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {formatNumber(pressAccounts.bookAccounts.reduce((s, x) => s + x.receivedCopies, 0))} কপি
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{formatBDT(pressAccounts.totalReceivedBill)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-zinc-200/50">{formatBDT(pressAccounts.totalPaidToPress)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-zinc-200/80">
                      {pressAccounts.netDueOnOrder > 0
                        ? formatBDT(pressAccounts.netDueOnOrder)
                        : pressAccounts.netDueOnOrder < 0
                        ? `+${formatBDT(Math.abs(pressAccounts.netDueOnOrder))}`
                        : '৳০'}
                    </td>
                    <td className="py-3 px-3 text-center font-normal text-xs text-zinc-600">
                      {pressAccounts.netDueOnOrder > 0 ? 'প্রেস পাবে' : 'পরিশোধিত'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Press Payment Voucher Ledger History */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">প্রেস পেমেন্ট ভাউচার হিস্ট্রি</h3>
                <p className="text-xs text-zinc-500">প্রেসে প্রদানকৃত সকল চেক, ব্যাংক ও ক্যাশ ট্রানজেকশনের তালিকা ({pressPayments.length} টি)</p>
              </div>
            </div>

            {pressPayments.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                এখনও কোনো প্রেস পেমেন্ট এন্ট্রি করা হয়নি। উপরে "প্রেস পেমেন্ট ভাউচার এন্ট্রি" বাটনে ক্লিক করে যুক্ত করুন।
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">খাত / বইয়ের নাম</th>
                      <th className="py-2.5 px-3 text-right">পরিশোধিত পরিমাণ</th>
                      <th className="py-2.5 px-3 text-center">পেমেন্ট মাধ্যম</th>
                      <th className="py-2.5 px-3">ভাউচার / চেক নং</th>
                      <th className="py-2.5 px-3">বিবরণ / নোট</th>
                      <th className="py-2.5 px-3 text-center w-16">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pressPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">{p.date}</td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-800">{p.bookName || 'সার্বিক প্রেস অর্ডার'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(p.amount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-zinc-100 px-2 py-0.5 rounded text-[11px] font-medium border border-zinc-200 text-zinc-800 uppercase">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">{p.voucherNo || '—'}</td>
                        <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">{p.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm('আপনি কি এই পেমেন্ট ভাউচারটি মুছে ফেলতে চান?')) {
                                onDeletePressPayment(p.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                            title="মুছে ফেলুন"
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
                  <option value="all">সবগুলো বই ({books.length} টি)</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.sl}. {b.bookName}
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
                  placeholder="ভাউচার / চালান নং বা বিবরণ দিয়ে খুঁজুন (Find by Voucher No)..."
                  className="w-full text-xs pl-8 pr-7 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900 font-mono"
                />
                {voucherSearchQuery && (
                  <button
                    onClick={() => setVoucherSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    title="ক্লিয়ার করুন"
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
                <span>+ নতুন প্রেস অর্ডার</span>
              </button>

              <button
                onClick={() => onAddPressDelivery(selectedBookFilter !== 'all' ? selectedBookFilter : undefined)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-xl transition-all shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>+ প্রেস চালান গ্রহণ</span>
              </button>
            </div>

          </div>

          {/* Book-wise Aggregated Metrics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-500">মোট প্রেস অর্ডার কপি</div>
              <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
                {formatNumber(totalOrderedCopies)} কপি
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                মোট {filteredOrders.length} টি অর্ডার লট
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-500">প্রেস থেকে প্রাপ্ত চালান</div>
              <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
                {formatNumber(totalDeliveredCopies)} কপি
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                মোট {filteredDeliveries.length} টি ডেলিভারি চালান
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-500">প্রেসে অবশিষ্ট ব্যালেন্স</div>
              <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
                {formatNumber(remainingAtPress)} কপি
              </div>
              <div className="text-[10px] font-medium text-zinc-500 mt-1">
                {remainingAtPress > 0 ? 'ডেলিভারি বাকি আছে' : '✓ সব কপি সরবরাহ সমাপ্ত'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-500">মোট প্রেস অর্ডার চুক্তি বিল</div>
              <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
                {formatBDT(totalOrdersBill)}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                ভাউচার সংখ্যা: {filteredOrders.length} টি
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
                  <h3 className="font-bold text-zinc-900 text-sm">১. প্রেসে প্রদানকৃত অর্ডার তালিকা (Press Order List)</h3>
                  <span className="bg-zinc-100 text-zinc-800 text-[11px] font-mono px-2 py-0.5 rounded-full border border-zinc-200">
                    {filteredOrders.length} টি
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  ফরিদ ভাই প্রেসে বই ছাপার জন্য দেওয়া ১ম, ২য় ও রি-অর্ডার লট এবং চুক্তি বিল
                </p>
              </div>

              <button
                onClick={() => onAddPressOrder(selectedBookFilter !== 'all' ? selectedBookFilter : undefined)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg transition-all shadow-xs self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ প্রেস অর্ডার যুক্ত করুন</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span>👉 পুরো টেবিল দেখতে ডানে স্ক্রোল করুন</span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                {voucherSearchQuery
                  ? `"${voucherSearchQuery}" ভাউচার বা বিবরণের কোনো প্রেস অর্ডার পাওয়া যায়নি।`
                  : 'এই বইয়ের জন্য এখনও কোনো প্রেস অর্ডার এন্ট্রি করা হয়নি। "+ নতুন প্রেস অর্ডার" বাটনে ক্লিক করে যুক্ত করুন।'}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                      <th className="py-2.5 px-3">অর্ডারের তারিখ</th>
                      <th className="py-2.5 px-3">ভাউচার / অর্ডার নং</th>
                      <th className="py-2.5 px-3 min-w-[180px]">বইয়ের নাম</th>
                      <th className="py-2.5 px-3">সংস্করণ / লট</th>
                      <th className="py-2.5 px-3 text-center">অর্ডার কপি</th>
                      <th className="py-2.5 px-3 text-right">ছাপার খরচ</th>
                      <th className="py-2.5 px-3 text-right">মোট বিল</th>
                      <th className="py-2.5 px-3">নোট / বিবরণ</th>
                      <th className="py-2.5 px-3 text-center w-16">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">{o.orderDate}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                            {o.orderNo || 'PO-DEFAULT'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-zinc-900">{o.bookName}</td>
                        <td className="py-2.5 px-3 font-medium text-zinc-700">
                          <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[11px] border border-zinc-200">
                            {o.lotName || 'প্রেস অর্ডার'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900">
                          {formatNumber(o.orderQuantity)} কপি
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-700">
                          {formatBDT(o.makingCost || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-zinc-900">
                          {formatBDT(o.totalBill || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">{o.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`আপনি কি এই প্রেস অর্ডারটি (${o.orderNo || o.lotName || ''} - ${formatNumber(o.orderQuantity)} কপি) মুছে ফেলতে চান?`)) {
                                onDeletePressOrder(o.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black text-zinc-900 border-t-2 border-zinc-300">
                      <td colSpan={4} className="py-3 px-3 text-right">মোট প্রেস অর্ডার যোগফল:</td>
                      <td className="py-3 px-3 text-center font-mono">{formatNumber(totalOrderedCopies)} কপি</td>
                      <td></td>
                      <td className="py-3 px-3 text-right font-mono">{formatBDT(totalOrdersBill)}</td>
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
                  <h3 className="font-bold text-zinc-900 text-sm">২. প্রেস থেকে আসা বইয়ের চালান তালিকা (Received Books From Press)</h3>
                  <span className="bg-zinc-100 text-zinc-800 text-[11px] font-mono px-2 py-0.5 rounded-full border border-zinc-200">
                    {filteredDeliveries.length} টি
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  ফরিদ ভাই প্রেস থেকে সরাসরি হেড অফিস ওয়্যারহাউসে গ্রহণকৃত চালান ভাউচার
                </p>
              </div>

              <button
                onClick={() => onAddPressDelivery(selectedBookFilter !== 'all' ? selectedBookFilter : undefined)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg transition-all shadow-xs self-start sm:self-auto"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>+ প্রেস চালান গ্রহণ</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span>👉 পুরো টেবিল দেখতে ডানে স্ক্রোল করুন</span>
            </div>

            {filteredDeliveries.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                {voucherSearchQuery
                  ? `"${voucherSearchQuery}" ভাউচার বা চালানের কোনো বই ডেলিভারি পাওয়া যায়নি।`
                  : 'এই বইয়ের জন্য এখনও কোনো প্রেস চালান গ্রহণ এন্ট্রি করা হয়নি। "+ প্রেস চালান গ্রহণ" বাটনে ক্লিক করে যুক্ত করুন।'}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                      <th className="py-2.5 px-3">গ্রহণের তারিখ</th>
                      <th className="py-2.5 px-3">প্রেস চালান / ভাউচার নং</th>
                      <th className="py-2.5 px-3 min-w-[180px]">বইয়ের নাম</th>
                      <th className="py-2.5 px-3 text-center">গ্রহণকৃত কপি</th>
                      <th className="py-2.5 px-3">সংস্করণ / লট</th>
                      <th className="py-2.5 px-3">গ্রহীতা / ওয়্যারহাউস</th>
                      <th className="py-2.5 px-3">নোট / বিবরণ</th>
                      <th className="py-2.5 px-3 text-center w-16">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredDeliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">{d.deliveryDate}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                            {d.chalanNo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-zinc-900">{d.bookName}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900">
                          {formatNumber(d.quantity)} কপি
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-700">
                          {d.lotName ? (
                            <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[11px] border border-zinc-200">
                              {d.lotName}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-700">{d.receivedBy || 'হেড অফিস স্টোর'}</td>
                        <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">{d.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`আপনি কি এই প্রেস চালানটি (${d.chalanNo} - ${formatNumber(d.quantity)} কপি) মুছে ফেলতে চান?`)) {
                                onDeletePressDelivery(d.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-black text-zinc-900 border-t-2 border-zinc-300">
                      <td colSpan={3} className="py-3 px-3 text-right">মোট গ্রহণকৃত চালান কপি:</td>
                      <td className="py-3 px-3 text-center font-mono">{formatNumber(totalDeliveredCopies)} কপি</td>
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
                    <h4 className="font-bold text-zinc-900 text-sm">অনলাইন চ্যানেল ডিউ খতিয়ান</h4>
                    <p className="text-xs text-zinc-500">বইবাড়ি, রকমারি, ওয়াফিলাইফ ও অন্যান্য</p>
                  </div>
                </div>
                <button
                  onClick={() => onAddChannelCollection('boibari')}
                  className="text-xs font-bold text-white bg-zinc-900 hover:bg-black px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                >
                  + অনলাইন কালেকশন
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">মোট বিক্রয়</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineBilled)}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">আদায়কৃত</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineCollected)}</span>
                </div>
                <div className="p-2.5 bg-zinc-100 border border-zinc-300 rounded-xl">
                  <span className="text-[10px] text-zinc-600 block font-bold">অনলাইন ডিউ</span>
                  <span className="text-sm font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.onlineDue)}</span>
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
                    <h4 className="font-bold text-zinc-900 text-sm">অফলাইন ও লাইব্রেরি ডিউ খতিয়ান</h4>
                    <p className="text-xs text-zinc-500">সুমনা, প্রমিজ, জয়স্টার, নীলক্ষেত ও হেড অফিস</p>
                  </div>
                </div>
                <button
                  onClick={() => onAddChannelCollection('sumonaLibrary')}
                  className="text-xs font-bold text-white bg-zinc-900 hover:bg-black px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                >
                  + লাইব্রেরি কালেকশন
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">মোট বিক্রয়</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineBilled)}</span>
                </div>
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">আদায়কৃত</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineCollected)}</span>
                </div>
                <div className="p-2.5 bg-zinc-100 border border-zinc-300 rounded-xl">
                  <span className="text-[10px] text-zinc-600 block font-bold">অফলাইন ডিউ</span>
                  <span className="text-sm font-black text-zinc-900 font-mono">{formatBDT(channelAccounts.offlineDue)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Detailed All Channels Due Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">চ্যানেল ও লাইব্রেরিভিত্তিক বিশদ ডিউ হিসাব</h3>
                <p className="text-xs text-zinc-500">প্রতিটি প্ল্যাটফর্মের বিক্রিত কপি, মোট ইনভয়েস মূল্য, আদায় ও বর্তমান বকেয়া</p>
              </div>

              <button
                onClick={() => onAddChannelCollection()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-all shadow-xs self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ নতুন কালেকশন এন্ট্রি</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 font-medium px-4 py-2 sm:hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span>👉 পুরো টেবিল দেখতে ডানে স্ক্রোল করুন</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-200">
                    <th className="py-2.5 px-3 min-w-[200px]">চ্যানেল / লাইব্রেরি</th>
                    <th className="py-2.5 px-3 text-center">ক্যাটেগরি</th>
                    <th className="py-2.5 px-3 text-center">বিক্রিত কপি</th>
                    <th className="py-2.5 px-3 text-right">মোট বিক্রয় মূল্য</th>
                    <th className="py-2.5 px-3 text-right bg-zinc-200/50">আদায়কৃত টাকা</th>
                    <th className="py-2.5 px-3 text-right bg-zinc-200/80">বকেয়া / ডিউ</th>
                    <th className="py-2.5 px-3 min-w-[120px]">আদায় হার (%)</th>
                    <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                    <th className="py-2.5 px-3 text-center w-24">অ্যাকশন</th>
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
                          {ch.type === 'online' ? 'অনলাইন' : 'অফলাইন'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-800">
                        {formatNumber(ch.totalCopies)} কপি
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">
                        {formatBDT(ch.totalBilled)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 bg-zinc-50/50">
                        {formatBDT(ch.totalCollected)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-zinc-900 bg-zinc-50">
                        {ch.dueAmount > 0 ? (
                          <span className="text-zinc-900 font-bold">{formatBDT(ch.dueAmount)}</span>
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
                          {ch.dueAmount > 0 ? 'ডিউ বাকি' : 'পরিশোধিত'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onAddChannelCollection(ch.key)}
                          className="text-[11px] font-bold text-zinc-800 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg transition-colors border border-zinc-300"
                        >
                          আদায়
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-black text-zinc-900 border-t-2 border-zinc-300">
                    <td colSpan={2} className="py-3 px-3 text-right">সর্বমোট যোগফল:</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {formatNumber(channelAccounts.channels.reduce((s, x) => s + x.totalCopies, 0))} কপি
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{formatBDT(channelAccounts.totalBilled)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-zinc-200/50">{formatBDT(channelAccounts.totalCollected)}</td>
                    <td className="py-3 px-3 text-right font-mono bg-zinc-200/80">{formatBDT(channelAccounts.totalDue)}</td>
                    <td colSpan={3} className="py-3 px-3 text-center font-normal text-xs text-zinc-600">
                      সম্মিলিত আদায় হার: {channelAccounts.totalBilled > 0 ? ((channelAccounts.totalCollected / channelAccounts.totalBilled) * 100).toFixed(1) : 100}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Channel Collection Receipts Ledger History */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">বিক্রয় আদায় / কালেকশন হিস্ট্রি</h3>
                <p className="text-xs text-zinc-500">অনলাইন ও লাইব্রেরি থেকে প্রাপ্ত মোট {channelCollections.length} টি জমার রশিদ</p>
              </div>
            </div>

            {channelCollections.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                এখনও কোনো কালেকশন এন্ট্রি করা হয়নি। উপরে "+ নতুন কালেকশন এন্ট্রি" বাটনে ক্লিক করে যুক্ত করুন।
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-800 font-semibold border-b border-zinc-200">
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">চ্যানেল / লাইব্রেরি</th>
                      <th className="py-2.5 px-3 text-right">আদায়কৃত টাকা</th>
                      <th className="py-2.5 px-3 text-center">পেমেন্ট মাধ্যম</th>
                      <th className="py-2.5 px-3">রশিদ / ভাউচার নং</th>
                      <th className="py-2.5 px-3">বিবরণ / নোট</th>
                      <th className="py-2.5 px-3 text-center w-16">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {channelCollections.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">{c.date}</td>
                        <td className="py-2.5 px-3 font-bold text-zinc-900">{c.channelName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">{formatBDT(c.amount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-zinc-100 px-2 py-0.5 rounded text-[11px] font-medium border border-zinc-200 text-zinc-800 uppercase">
                            {c.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">{c.receiptNo || '—'}</td>
                        <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">{c.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm('আপনি কি এই কালেকশন রেকর্ডটি মুছে ফেলতে চান?')) {
                                onDeleteChannelCollection(c.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                            title="মুছে ফেলুন"
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

    </div>
  );
};
