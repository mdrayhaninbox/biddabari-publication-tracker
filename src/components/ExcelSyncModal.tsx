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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">এক্সেল সিঙ্ক ও ডেটা ট্রান্সফার</h3>
              <p className="text-xs text-emerald-200">এক্সেল ইমপোর্ট ও এক্সপোর্ট পরিচালনা করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Status feedback */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Option 1: Upload Excel File */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>এক্সেল ফাইল ইমপোর্ট করুন</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              আপনার কাছে থাকা `biddabari publication all books data.xlsx` ফাইলটি আপলোড করে সফটওয়্যার ডাটা আপডেট করুন।
            </p>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl p-4 cursor-pointer transition-colors">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-emerald-700">
                {loading ? 'ডাটা প্রসেস হচ্ছে...' : 'কম্পিউটার থেকে এক্সেল (.xlsx) নির্বাচন করুন'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">(.xlsx বা .xls ফাইল)</span>
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
          <div className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">বর্তমান ডাটা এক্সপোর্ট</h4>
              <p className="text-xs text-slate-500">সকল হিসাব সহ ফুল এক্সেল (.xlsx) তৈরি</p>
            </div>
            <button
              onClick={() => {
                exportBooksToExcel(books);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ডাউনলোড</span>
            </button>
          </div>

          {/* Option 3: Download Original Template */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">মূল এক্সেল টেমপ্লেট</h4>
              <p className="text-xs text-slate-500">অরিজিনাল ৩৭১ কলামের এক্সেল ফাইল</p>
            </div>
            <a
              href="/biddabari_publication_books_data.xlsx"
              download="biddabari publication all books data.xlsx"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>মূল ফাইল</span>
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
