import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { Language, tr } from '../utils/i18n';
import { formatNumber } from '../utils/calculations';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
  booksCount: number;
  ordersCount: number;
  paymentsCount: number;
  deliveriesCount: number;
  collectionsCount: number;
  language?: Language;
}

interface MathChallenge {
  num1: number;
  num2: number;
  operator: '+' | '-';
  answer: number;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  booksCount,
  ordersCount,
  paymentsCount,
  deliveriesCount,
  collectionsCount,
  language = 'en',
}) => {
  const [challenge, setChallenge] = useState<MathChallenge>({ num1: 12, num2: 7, operator: '+', answer: 19 });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false);

  // Generate a new random simple equation
  const generateNewChallenge = () => {
    const isAddition = Math.random() > 0.35;
    if (isAddition) {
      const n1 = Math.floor(Math.random() * 25) + 11; // 11 to 35
      const n2 = Math.floor(Math.random() * 15) + 4;  // 4 to 18
      setChallenge({
        num1: n1,
        num2: n2,
        operator: '+',
        answer: n1 + n2,
      });
    } else {
      const n1 = Math.floor(Math.random() * 30) + 20; // 20 to 49
      const n2 = Math.floor(Math.random() * 15) + 3;  // 3 to 17
      setChallenge({
        num1: n1,
        num2: n2,
        operator: '-',
        answer: n1 - n2,
      });
    }
    setUserAnswer('');
  };

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      generateNewChallenge();
      setIsAcknowledged(false);
      setUserAnswer('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMathCorrect = userAnswer.trim() !== '' && Number(userAnswer.trim()) === challenge.answer;
  const isUnlockReady = isMathCorrect && isAcknowledged;

  const handleExecuteReset = () => {
    if (!isUnlockReady) return;
    onConfirmReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-red-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header - Danger Red styling */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-700/80 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {tr('সিস্টেম রিসেট নিরাপত্তা যাচাই', 'System Reset Security Verification', language)}
              </h3>
              <p className="text-xs text-red-100">
                {tr('সকল ডেটা মুছে শূন্য (০) করার পূর্ববর্তী সুরক্ষা ধাপ', 'Safety verification before wiping all records to zero', language)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-200 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Warning Banner */}
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">
                {tr(
                  'সতর্কবার্তা: ভুলে ক্লিকের কারণে যেন কোনো তথ্য না হারায়!',
                  'Caution: Prevent accidental one-click deletion of publication records!',
                  language
                )}
              </p>
              <p className="text-red-700 leading-relaxed">
                {tr(
                  'এই রিসেট প্রক্রিয়া সম্পন্ন করলে ওয়েবসাইটের বর্তমান সকল বইয়ের স্টক, দৈনিক বিক্রয়, প্রেসের অর্ডার, প্রাপ্ত ডেলিভারি চালান ও পেমেন্ট ভাউচার স্থায়ীভাবে মুছে সম্পূর্ণ শূন্য (০) হয়ে যাবে। এটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।',
                  'Proceeding will permanently purge all current book stocks, daily sales entries, press orders, deliveries, and payment vouchers back to zero (0). This cannot be undone.',
                  language
                )}
              </p>
            </div>
          </div>

          {/* Current Impacted Data Summary */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs">
            <div className="font-bold text-zinc-800 mb-2 border-b border-zinc-200 pb-1.5 flex justify-between">
              <span>{tr('বর্তমান সংরক্ষিত ডেটা খতিয়ান:', 'Current Recorded Data Impacted:', language)}</span>
              <span className="text-red-600 font-semibold">{tr('মুছে শূন্য হবে', 'Will be reset to 0', language)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-zinc-600">
              <div className="flex justify-between">
                <span>{tr('বইয়ের সংখ্যা:', 'Total Books:', language)}</span>
                <span className="font-bold font-mono text-zinc-900">{formatNumber(booksCount, language)} {tr('টি', '', language)}</span>
              </div>
              <div className="flex justify-between">
                <span>{tr('প্রেস অর্ডার:', 'Press Orders:', language)}</span>
                <span className="font-bold font-mono text-zinc-900">{formatNumber(ordersCount, language)} {tr('টি', '', language)}</span>
              </div>
              <div className="flex justify-between">
                <span>{tr('প্রেস চালান:', 'Press Deliveries:', language)}</span>
                <span className="font-bold font-mono text-zinc-900">{formatNumber(deliveriesCount, language)} {tr('টি', '', language)}</span>
              </div>
              <div className="flex justify-between">
                <span>{tr('পেমেন্ট ভাউচার:', 'Payment Vouchers:', language)}</span>
                <span className="font-bold font-mono text-zinc-900">{formatNumber(paymentsCount, language)} {tr('টি', '', language)}</span>
              </div>
              <div className="flex justify-between col-span-2 border-t border-zinc-100 pt-1">
                <span>{tr('আদায় ভাউচার / রিসিট:', 'Collection Receipts:', language)}</span>
                <span className="font-bold font-mono text-zinc-900">{formatNumber(collectionsCount, language)} {tr('টি', '', language)}</span>
              </div>
            </div>
          </div>

          {/* STEP 1: MATH CHALLENGE */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-blue-900">
                {tr('ধাপ ১: সাধারণ গণিত সমীকরণটির সঠিক উত্তর দিন *', 'Step 1: Solve the simple math equation *', language)}
              </label>
              <button
                type="button"
                onClick={generateNewChallenge}
                className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-medium hover:underline"
                title={tr('নতুন সমীকরণ তৈরি করুন', 'Generate new equation', language)}
              >
                <RefreshCw className="w-3 h-3" />
                <span>{tr('পরিবর্তন', 'New', language)}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 bg-white rounded-lg border border-blue-300 font-mono text-sm font-bold text-blue-950 tracking-wider shadow-2xs">
                {challenge.num1} {challenge.operator} {challenge.num2} = ?
              </div>
              
              <div className="relative flex-1">
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={tr('উত্তর লিখুন', 'Enter answer', language)}
                  className={`w-full text-xs font-bold border rounded-lg p-2.5 bg-white text-zinc-900 focus:ring-2 ${
                    isMathCorrect
                      ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/30'
                      : userAnswer.trim() !== ''
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-zinc-300 focus:ring-blue-600'
                  }`}
                />
                {isMathCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
                )}
              </div>
            </div>
            
            {userAnswer.trim() !== '' && !isMathCorrect && (
              <p className="text-[11px] text-red-600 font-medium">
                {tr('ভুল উত্তর! অনুগ্রহ করে সঠিক যোগফল/বিয়োগফল দিন।', 'Incorrect answer! Please provide the correct result.', language)}
              </p>
            )}
            {isMathCorrect && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                ✓ {tr('গণিত সমীকরণ যাচাই সফল হয়েছে।', 'Math equation verified successfully.', language)}
              </p>
            )}
          </div>

          {/* STEP 2: MANDATORY CONFIRMATION CHECKBOX */}
          <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
            isAcknowledged 
              ? 'bg-red-50/70 border-red-300 text-red-950 shadow-2xs' 
              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100/70'
          }`}>
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => setIsAcknowledged(e.target.checked)}
              className="rounded text-red-600 focus:ring-0 mt-0.5 w-4 h-4"
            />
            <span className="text-xs font-bold leading-relaxed">
              {tr(
                'ধাপ ২: আমি নিশ্চিত করছি যে আমি সমস্ত ডেটা মুছে শূন্য (০) করতে চাই এবং এর ফলাফল আমি অবগত। (I understand and confirm)',
                'Step 2: I confirm that I want to wipe all data to zero (0) and I understand the consequences.',
                language
              )}
            </span>
          </label>

        </div>

        {/* Modal Actions */}
        <div className="bg-zinc-50 px-6 py-3.5 border-t border-zinc-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            {tr('বাতিল করুন', 'Cancel', language)}
          </button>

          <button
            type="button"
            disabled={!isUnlockReady}
            onClick={handleExecuteReset}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg transition-all shadow-xs ${
              isUnlockReady
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer ring-2 ring-red-400'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isUnlockReady
                ? tr('নিশ্চিত রিসেট করুন (০)', 'Confirm Reset All Data (0)', language)
                : tr('লক করা আছে (শর্ত পূরণ করুন)', 'Locked (Complete steps)', language)}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
