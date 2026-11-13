import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { 
  BookRecord, 
  PressPaymentRecord, 
  PressOrderRecord, 
  PressDeliveryRecord, 
  ChannelCollectionRecord, 
  ChannelConfig 
} from '../types/book';
import { NotebookNoteRecord } from '../types/storage';
import { 
  importBooksFromExcel, 
  exportBooksToExcel, 
  FullDatabaseImportResult 
} from '../utils/excelHandler';
import { Language, tr } from '../utils/i18n';

interface ExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  pressPayments?: PressPaymentRecord[];
  pressOrders?: PressOrderRecord[];
  pressDeliveries?: PressDeliveryRecord[];
  channelCollections?: ChannelCollectionRecord[];
  channels?: ChannelConfig[];
  notebookNotes?: NotebookNoteRecord[];
  bookCategories?: string[];
  onImportSuccess: (result: FullDatabaseImportResult) => void;
  language?: Language;
}

export const ExcelSyncModal: React.FC<ExcelSyncModalProps> = ({
  isOpen,
  onClose,
  books,
  pressPayments = [],
  pressOrders = [],
  pressDeliveries = [],
  channelCollections = [],
  channels = [],
  notebookNotes = [],
  bookCategories = [],
  onImportSuccess,
  language = 'en',
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const imported = await importBooksFromExcel(file);
      onImportSuccess(imported);
      
      const details: string[] = [];
      if (imported.books.length > 0) details.push(`${imported.books.length}টি বই`);
      if (imported.pressPayments?.length) details.push(`${imported.pressPayments.length}টি প্রেস পেমেন্ট`);
      if (imported.pressOrders?.length) details.push(`${imported.pressOrders.length}টি প্রেস অর্ডার`);
      if (imported.pressDeliveries?.length) details.push(`${imported.pressDeliveries.length}টি চালান`);
      if (imported.channelCollections?.length) details.push(`${imported.channelCollections.length}টি আদায় ভাউচার`);
      if (imported.notebookNotes?.length) details.push(`${imported.notebookNotes.length}টি নোট`);
      
      const summaryText = details.length > 0 ? ` (${details.join(', ')})` : '';
      setSuccessMsg(tr(
        `সফলভাবে সম্পূর্ণ ডাটাবেজ ইমপোর্ট ও রিস্টোর করা হয়েছে!${summaryText}`, 
        `Successfully restored full database!${summaryText}`, 
        language
      ));
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || tr('এক্সেল ফাইল পড়তে সমস্যা হয়েছে। দয়া করে সঠিক ফরম্যাট দিন।', 'Failed to read Excel file. Please check format.', language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-zinc-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header (Black & White) */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {tr('এক্সেল সিঙ্ক ও ডেটা ট্রান্সফার', 'Excel Sync & Data Transfer', language)}
              </h3>
              <p className="text-xs text-zinc-400">
                {tr('এক্সেল ইমপোর্ট ও এক্সপোর্ট পরিচালনা করুন', 'Manage Excel import and export', language)}
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

        <div className="p-6 space-y-4">
          
          {/* Status feedback */}
          {errorMsg && (
            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl text-xs text-zinc-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-zinc-900" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-zinc-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-white" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Option 1: Upload Excel File */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50">
            <h4 className="text-xs font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4 text-zinc-700" />
              <span>{tr('এক্সেল ফাইল ইমপোর্ট করুন', 'Import Excel File', language)}</span>
            </h4>
            <p className="text-xs text-zinc-500 mb-3">
              {tr(
                'আপনার কাছে থাকা `biddabari publication all books data.xlsx` ফাইলটি আপলোড করে ডাটা আপডেট করুন।',
                'Upload your `biddabari publication all books data.xlsx` file to sync data.',
                language
              )}
            </p>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 hover:border-zinc-900 bg-white rounded-xl p-4 cursor-pointer transition-colors">
              <FileSpreadsheet className="w-7 h-7 text-zinc-400 mb-1" />
              <span className="text-xs font-bold text-zinc-900">
                {loading ? tr('ডাটা প্রসেস হচ্ছে...', 'Processing data...', language) : tr('কম্পিউটার থেকে এক্সেল (.xlsx) নির্বাচন করুন', 'Select Excel (.xlsx) from computer', language)}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5">(.xlsx {tr('বা', 'or', language)} .xls)</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                disabled={loading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Option 2: Export Current State */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-white flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-zinc-700" />
                <span>{tr('সম্পূর্ণ ডাটাবেজ এক্সপোর্ট (অল-ইন-ওয়ান ব্যাকআপ)', 'Full Database Export (All-in-One Backup)', language)}</span>
              </h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {tr(
                  'বই সেলস, স্টক, প্রেস হিসাব, প্রেস অর্ডার, চালান ভাউচার, আদায় রিসিট ও চ্যানেল কনফিগ সহ সম্পূর্ণ ডাটাবেজ',
                  'Complete database with book sales, stock, press accounts, orders, chalans, collection receipts & channels',
                  language
                )}
              </p>
            </div>
            <button
              onClick={() => {
                exportBooksToExcel(books, undefined, undefined, {
                  pressPayments,
                  pressOrders,
                  pressDeliveries,
                  channelCollections,
                  channels,
                  notebookNotes,
                  bookCategories,
                });
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors shrink-0 ml-3"
            >
              <Download className="w-4 h-4" />
              <span>{tr('ফুল ব্যাকআপ ডাউনলোড', 'Download Backup', language)}</span>
            </button>
          </div>

          {/* Option 3: Download Original Template */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-white flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-zinc-900">
                {tr('মূল এক্সেল টেমপ্লেট', 'Original Excel Template', language)}
              </h4>
              <p className="text-[11px] text-zinc-500">
                {tr('অরিজিনাল আনটাচড এক্সেল ফাইল', 'Original untouched Excel file', language)}
              </p>
            </div>
            <a
              href="/biddabari_publication_books_data.xlsx"
              download="biddabari publication all books data.xlsx"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-200"
            >
              <Download className="w-4 h-4 text-zinc-500" />
              <span>{tr('মূল ফাইল', 'Original File', language)}</span>
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {tr('বন্ধ করুন', 'Close', language)}
          </button>
        </div>

      </div>
    </div>
  );
};
