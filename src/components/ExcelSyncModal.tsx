import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { BookRecord } from '../types/book';
import { importBooksFromExcel, exportBooksToExcel } from '../utils/excelHandler';

interface ExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  onImportSuccess: (importedBooks: BookRecord[]) => void;
}

export const ExcelSyncModal: React.FC<ExcelSyncModalProps> = ({
  isOpen,
  onClose,
  books,
  onImportSuccess,
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
      setSuccessMsg(`সফলভাবে ${imported.length} টি বই ইমপোর্ট করা হয়েছে!`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'এক্সেল ফাইল পড়তে সমস্যা হয়েছে। দয়া করে সঠিক ফরম্যাট দিন।');
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
              <h3 className="text-base font-bold">এক্সেল সিঙ্ক ও ডেটা ট্রান্সফার</h3>
              <p className="text-xs text-zinc-400">এক্সেল ইমপোর্ট ও এক্সপোর্ট পরিচালনা করুন</p>
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
              <span>এক্সেল ফাইল ইমপোর্ট করুন</span>
            </h4>
            <p className="text-xs text-zinc-500 mb-3">
              আপনার কাছে থাকা `biddabari publication all books data.xlsx` ফাইলটি আপলোড করে ডাটা আপডেট করুন।
            </p>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 hover:border-zinc-900 bg-white rounded-xl p-4 cursor-pointer transition-colors">
              <FileSpreadsheet className="w-7 h-7 text-zinc-400 mb-1" />
              <span className="text-xs font-bold text-zinc-900">
                {loading ? 'ডাটা প্রসেস হচ্ছে...' : 'কম্পিউটার থেকে এক্সেল (.xlsx) নির্বাচন করুন'}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5">(.xlsx বা .xls ফাইল)</span>
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
              <h4 className="text-xs font-bold text-zinc-900">বর্তমান ডাটা এক্সপোর্ট</h4>
              <p className="text-[11px] text-zinc-500">৩৭১ কলামের ফুল এক্সেল (.xlsx) ফাইল</p>
            </div>
            <button
              onClick={() => {
                exportBooksToExcel(books);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ডাউনলোড</span>
            </button>
          </div>

          {/* Option 3: Download Original Template */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-white flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-zinc-900">মূল এক্সেল টেমপ্লেট</h4>
              <p className="text-[11px] text-zinc-500">অরিজিনাল আনটাচড এক্সেল ফাইল</p>
            </div>
            <a
              href="/biddabari_publication_books_data.xlsx"
              download="biddabari publication all books data.xlsx"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-200"
            >
              <Download className="w-4 h-4 text-zinc-500" />
              <span>মূল ফাইল</span>
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
