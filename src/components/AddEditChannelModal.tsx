import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle, Building2, Globe, Store } from 'lucide-react';
import { ChannelConfig, BookRecord, ChannelCollectionRecord } from '../types/book';
import { Language, tr } from '../utils/i18n';
import { sumDaily, getBookChannelSales, formatNumber, formatBDT } from '../utils/calculations';

interface AddEditChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingChannel?: ChannelConfig | null;
  defaultType?: 'online' | 'offline';
  onSaveChannel: (channelData: Partial<ChannelConfig>) => void;
  onDeleteChannel: (channelId: string) => void;
  books?: BookRecord[];
  channelCollections?: ChannelCollectionRecord[];
  language?: Language;
}

export const AddEditChannelModal: React.FC<AddEditChannelModalProps> = ({
  isOpen,
  onClose,
  editingChannel,
  defaultType = 'offline',
  onSaveChannel,
  onDeleteChannel,
  books = [],
  channelCollections = [],
  language = 'bn',
}) => {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<'online' | 'offline'>('offline');
  const [source, setSource] = useState<'headOffice' | 'press'>('headOffice');
  const [category, setCategory] = useState('');

  // Safe delete sub-flow state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);

  useEffect(() => {
    if (editingChannel) {
      setName(editingChannel.name || '');
      setNameEn(editingChannel.nameEn || '');
      setType(editingChannel.type || 'offline');
      setSource(editingChannel.source || 'headOffice');
      setCategory(editingChannel.category || '');
    } else {
      setName('');
      setNameEn('');
      setType(defaultType);
      setSource('headOffice');
      setCategory(defaultType === 'online' ? 'অনলাইন ই-কমার্স' : 'ডিলার লাইব্রেরি');
    }
    setShowDeleteConfirm(false);
    setDeleteAcknowledged(false);
  }, [editingChannel, defaultType, isOpen]);

  if (!isOpen) return null;

  // Calculate existing metrics for this channel if editing
  let totalSoldInChannel = 0;
  let totalCollectedInChannel = 0;
  if (editingChannel) {
    books.forEach(b => {
      const map = getBookChannelSales(b, editingChannel.id);
      totalSoldInChannel += sumDaily(map);
    });
    totalCollectedInChannel = channelCollections
      .filter(c => c.channelKey === editingChannel.id)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveChannel({
      name: name.trim(),
      nameEn: nameEn.trim() || undefined,
      type,
      source: type === 'offline' ? source : undefined,
      category: category.trim() || (type === 'online' ? 'অনলাইন প্ল্যাটফর্ম' : source === 'press' ? 'প্রেস সরাসরি' : 'হেড অফিস সরবরাহ'),
    });

    onClose();
  };

  const handleExecuteDelete = () => {
    if (!editingChannel || !deleteAcknowledged) return;
    onDeleteChannel(editingChannel.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-zinc-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header - Styled blue/dark to match user screenshot */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✏️</span>
            <div>
              <h3 className="text-base font-bold">
                {editingChannel
                  ? type === 'offline'
                    ? tr('অফলাইন / লাইব্রেরি চ্যানেল সম্পাদনা করুন', 'Edit Offline / Library Channel', language)
                    : tr('অনলাইন সেলস চ্যানেল সম্পাদনা করুন', 'Edit Online Sales Channel', language)
                  : type === 'offline'
                    ? tr('নতুন অফলাইন / লাইব্রেরি চ্যানেল যোগ করুন', 'Add New Offline / Library Channel', language)
                    : tr('নতুন অনলাইন সেলস চ্যানেল যোগ করুন', 'Add New Online Sales Channel', language)
                }
              </h3>
              <p className="text-xs text-blue-100">
                {type === 'offline'
                  ? tr('যেমন: কালেক্টেড লাইব্রেরি, নতুন কোনো ডিলার', 'e.g. Collected Library, new dealer', language)
                  : tr('যেমন: দারাজ, চরকা বুকস, ইত্যাদি', 'e.g. Daraz, Chorka Books, etc.', language)
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Normal Form View */}
        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              
              {/* Channel Type Selector (if creating new) */}
              {!editingChannel && (
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    {tr('চ্যানেলের ধরন (Channel Type) *', 'Channel Type *', language)}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setType('online');
                        setCategory('অনলাইন ই-কমার্স');
                      }}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        type === 'online'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      <span>{tr('অনলাইন চ্যানেল', 'Online Channel', language)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setType('offline');
                        setCategory('ডিলার লাইব্রেরি');
                      }}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        type === 'offline'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>{tr('অফলাইন / লাইব্রেরি', 'Offline / Library', language)}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bangla Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {tr('চ্যানেল / বিক্রেতার নাম (বাংলা) *', 'Channel / Seller Name (Bengali) *', language)}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'offline' ? tr('যেমন: নীলক্ষেত লাইব্রেরি', 'e.g. Nilkhet Library', language) : tr('যেমন: দারাজ অনলাইন', 'e.g. Daraz Online', language)}
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 text-zinc-900"
                />
              </div>

              {/* English Name (Optional) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {tr('নাম (ইংরেজি, ঐচ্ছিক)', 'Name (English, optional)', language)}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder={type === 'offline' ? 'e.g. Nilkhet Library' : 'e.g. Daraz Online'}
                  className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 text-zinc-900"
                />
              </div>

              {/* Supply Route (For Offline Channels) - Exactly matching Image 2 */}
              {type === 'offline' && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-zinc-800">
                    {tr('এই চ্যানেলটি কোথা থেকে সরবরাহ হয়? *', 'Where is this channel supplied from? *', language)}
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      source === 'headOffice'
                        ? 'border-blue-600 bg-blue-50/50 text-zinc-900 font-bold'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}>
                      <input
                        type="radio"
                        name="channelSource"
                        value="headOffice"
                        checked={source === 'headOffice'}
                        onChange={() => setSource('headOffice')}
                        className="text-blue-600 focus:ring-0"
                      />
                      <span>{tr('হেড অফিস থেকে', 'From Head Office', language)}</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      source === 'press'
                        ? 'border-blue-600 bg-blue-50/50 text-zinc-900 font-bold'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}>
                      <input
                        type="radio"
                        name="channelSource"
                        value="press"
                        checked={source === 'press'}
                        onChange={() => setSource('press')}
                        className="text-blue-600 focus:ring-0"
                      />
                      <span>{tr('সরাসরি প্রেস থেকে', 'Directly from Press', language)}</span>
                    </label>
                  </div>

                  <p className="text-[11px] text-zinc-500 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 leading-relaxed">
                    {tr(
                      'সুমনা/প্রমিজ/জয়স্টারের মতো যেসব লাইব্রেরি প্রেস থেকে সরাসরি কপি নেয়, সেগুলোর বিক্রি হেড অফিসের স্টক না কমিয়ে প্রেসের স্টক কমায়।',
                      'Libraries that collect directly from the press (like Sumona, Promise, Joystar) deduct stock from the press rather than the head office.',
                      language
                    )}
                  </p>
                </div>
              )}

              {/* Notice if Editing Channel with Existing Sales */}
              {editingChannel && totalSoldInChannel > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                  <span>
                    ℹ️ {tr('এই চ্যানেলে ইতিমধ্যে সংরক্ষিত মোট বিক্রি:', 'Total sales recorded in this channel:', language)}{' '}
                    <b>{formatNumber(totalSoldInChannel, language)} {tr('কপি', 'copies', language)}</b>
                  </span>
                  <span className="font-mono text-[11px] font-bold">
                    আদায়: {formatBDT(totalCollectedInChannel, language)}
                  </span>
                </div>
              )}

            </div>

            {/* Bottom Actions */}
            <div className="bg-zinc-50 px-6 py-3.5 border-t border-zinc-200 flex items-center justify-between">
              <div>
                {editingChannel && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                    title={tr('চ্যানেল নিরাপদে মুছে ফেলুন', 'Safely delete channel', language)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{tr('চ্যানেল মুছুন', 'Delete Channel', language)}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  {tr('বাতিল', 'Cancel', language)}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingChannel
                      ? tr('হালনাগাদ করুন', 'Update Channel', language)
                      : tr('চ্যানেল যোগ করুন', 'Add Channel', language)
                    }
                  </span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* SAFE DELETE CONFIRMATION DIALOG (Safely jate bhule click pore konota remove na hoy) */
          <div className="p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900">
              <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">
                  {tr('চ্যানেল মুছে ফেলার নিরাপত্তা যাচাই', 'Confirm Safe Channel Deletion', language)}
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  {tr('ভুলে ক্লিক পড়ে যেন কোনো চ্যানেল ডিলিট না হয় সেজন্য এই নিরাপত্তা ধাপ।', 'This safety confirmation prevents accidental deletion of channels.', language)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-600">{tr('চ্যানেলের নাম:', 'Channel Name:', language)}</span>
                <span className="font-bold text-zinc-900">{editingChannel?.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-600">{tr('চ্যানেলের ধরন:', 'Channel Type:', language)}</span>
                <span className="font-bold text-zinc-900">
                  {editingChannel?.type === 'online' ? tr('অনলাইন ই-কমার্স', 'Online E-commerce', language) : tr('অফলাইন / লাইব্রেরি', 'Offline / Library', language)}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-600">{tr('মোট বিক্রিত কপি সংখ্যা:', 'Total Sold Copies:', language)}</span>
                <span className="font-bold font-mono text-zinc-900">{formatNumber(totalSoldInChannel, language)} {tr('কপি', 'copies', language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">{tr('মোট আদায়কৃত কালেকশন:', 'Total Collected Amount:', language)}</span>
                <span className="font-bold font-mono text-zinc-900">{formatBDT(totalCollectedInChannel, language)}</span>
              </div>
            </div>

            {totalSoldInChannel > 0 && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 font-medium">
                ⚠️ {tr(
                  `সতর্কবার্তা: এই চ্যানেলে ইতিমধ্যে ${formatNumber(totalSoldInChannel, language)} কপি বিক্রয় সংরক্ষিত আছে! এটি মুছে ফেললে ওইসব বিক্রির হিসাব এবং স্টক সামঞ্জস্য প্রভাবিত হতে পারে।`,
                  `Warning: This channel already has ${formatNumber(totalSoldInChannel, language)} sold copies recorded! Deleting it may impact past sales totals.`,
                  language
                )}
              </div>
            )}

            {/* Safety Checkbox */}
            <label className="flex items-start gap-2.5 p-3 bg-white border-2 border-red-200 rounded-xl cursor-pointer hover:bg-red-50/30 transition-colors">
              <input
                type="checkbox"
                checked={deleteAcknowledged}
                onChange={(e) => setDeleteAcknowledged(e.target.checked)}
                className="rounded text-red-600 focus:ring-0 mt-0.5 w-4 h-4"
              />
              <span className="text-xs font-bold text-red-900 leading-tight">
                {tr(
                  'আমি বিষয়টি বুঝেছি এবং নিশ্চিত করছি যে আমি এই চ্যানেলটি স্থায়ীভাবে মুছে ফেলতে চাই।',
                  'I understand the consequences and confirm that I want to permanently delete this channel.',
                  language
                )}
              </span>
            </label>

            {/* Confirmation Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                {tr('ফিরে যান (বাতিল)', 'Back (Cancel)', language)}
              </button>
              <button
                type="button"
                disabled={!deleteAcknowledged}
                onClick={handleExecuteDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{tr('স্থায়ীভাবে মুছে ফেলুন', 'Confirm Delete', language)}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
