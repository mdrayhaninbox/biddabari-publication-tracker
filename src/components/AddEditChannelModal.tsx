import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle, Building2, Globe, Store, Phone, MapPin } from 'lucide-react';
import { ChannelConfig, ChannelType, BookRecord, ChannelCollectionRecord } from '../types/book';
import { Language, tr } from '../utils/i18n';
import { sumDaily, getBookChannelSales, formatNumber, formatBDT } from '../utils/calculations';

interface AddEditChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingChannel?: ChannelConfig | null;
  defaultType?: ChannelType;
  onSaveChannel: (channelData: Partial<ChannelConfig>) => void;
  onDeleteChannel: (channelId: string) => void;
  books?: BookRecord[];
  channelCollections?: ChannelCollectionRecord[];
  channels?: ChannelConfig[];
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
  channels = [],
  language = 'en',
}) => {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<ChannelType>('offline');
  const [source, setSource] = useState<'headOffice' | 'press'>('headOffice');
  const [selectedPressId, setSelectedPressId] = useState<string>('faridBhaiPress');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Safe delete sub-flow state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);

  // Available presses for linking dealer libraries
  const availablePresses = (channels || []).filter(c => c.type === 'press' || c.id === 'faridBhaiPress');

  useEffect(() => {
    if (editingChannel) {
      setName(editingChannel.name || '');
      setNameEn(editingChannel.nameEn || '');
      setType(editingChannel.type || 'offline');
      setSource(editingChannel.source || 'headOffice');
      setSelectedPressId(editingChannel.pressId || 'faridBhaiPress');
      setCategory(editingChannel.category || '');
      setAddress(editingChannel.address || '');
      setPhone(editingChannel.phone || '');
    } else {
      setName('');
      setNameEn('');
      setType(defaultType);
      setSource('headOffice');
      setSelectedPressId(availablePresses[0]?.id || 'faridBhaiPress');
      setAddress('');
      setPhone('');
      setCategory(
        defaultType === 'press'
          ? 'মুদ্রণ ও বাঁধাই প্রেস'
          : defaultType === 'online'
          ? 'অনলাইন ই-কমার্স'
          : 'ডিলার লাইব্রেরি'
      );
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
      pressId: type === 'offline' && source === 'press' ? selectedPressId : undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      category:
        category.trim() ||
        (type === 'press'
          ? 'মুদ্রণ ও বাঁধাই প্রেস'
          : type === 'online'
          ? 'অনলাইন প্ল্যাটফর্ম'
          : source === 'press'
          ? 'প্রেস সরাসরি'
          : 'হেড অফিস সরবরাহ'),
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
        
        {/* Header */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">
              {type === 'press' ? '🏭' : type === 'online' ? '🌐' : '🏪'}
            </span>
            <div>
              <h3 className="text-base font-bold">
                {editingChannel
                  ? type === 'press'
                    ? tr('প্রেস / ছাপাখানা সম্পাদনা করুন', 'Edit Printing Press Entry', language)
                    : type === 'offline'
                    ? tr('অফলাইন / লাইব্রেরি চ্যানেল সম্পাদনা করুন', 'Edit Offline / Library Channel', language)
                    : tr('অনলাইন সেলস চ্যানেল সম্পাদনা করুন', 'Edit Online Sales Channel', language)
                  : type === 'press'
                    ? tr('নতুন প্রেস / ছাপাখানা যোগ করুন (New Press Entry)', 'Add New Printing Press Entry', language)
                    : type === 'offline'
                    ? tr('নতুন অফলাইন / লাইব্রেরি চ্যানেল যোগ করুন', 'Add New Offline / Library Channel', language)
                    : tr('নতুন অনলাইন সেলস চ্যানেল যোগ করুন', 'Add New Online Sales Channel', language)
                }
              </h3>
              <p className="text-xs text-blue-100">
                {type === 'press'
                  ? tr('যেমন: ফরিদ ভাই প্রেস, বর্ণালী প্রেস, আল-মদিনা প্রেস ইত্যাদি', 'e.g. Farid Bhai Press, Bornali Press, etc.', language)
                  : type === 'offline'
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
              
              {/* Channel Type Selector (if creating new) - 3 Options: Online, Offline, New Press */}
              {!editingChannel && (
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    {tr('চ্যানেলের ধরন (Channel Type) *', 'Channel Type *', language)}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setType('online');
                        setCategory('অনলাইন ই-কমার্স');
                      }}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        type === 'online'
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>{tr('অনলাইন চ্যানেল', 'Online Channel', language)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setType('offline');
                        setCategory('ডিলার লাইব্রেরি');
                      }}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        type === 'offline'
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Store className="w-4 h-4 shrink-0" />
                      <span>{tr('অফলাইন / লাইব্রেরি', 'Offline / Library', language)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setType('press');
                        setCategory('মুদ্রণ ও বাঁধাই প্রেস');
                      }}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        type === 'press'
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>{tr('প্রেস এন্ট্রি', 'New Press Entry', language)}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bangla Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {type === 'press'
                    ? tr('প্রেস / ছাপাখানার নাম (বাংলা) *', 'Press / Printing House Name (Bengali) *', language)
                    : tr('চ্যানেল / বিক্রেতার নাম (বাংলা) *', 'Channel / Seller Name (Bengali) *', language)}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    type === 'press'
                      ? tr('যেমন: বর্ণালী প্রেস, আল-মদিনা প্রেস', 'e.g. Bornali Press, Al-Madina Press', language)
                      : type === 'offline'
                      ? tr('যেমন: নীলক্ষেত লাইব্রেরি', 'e.g. Nilkhet Library', language)
                      : tr('যেমন: দারাজ অনলাইন', 'e.g. Daraz Online', language)
                  }
                  className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 text-zinc-900"
                />
              </div>

              {/* English Name (Optional) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {type === 'press'
                    ? tr('প্রেসের নাম (ইংরেজি, ঐচ্ছিক)', 'Press Name (English, optional)', language)
                    : tr('নাম (ইংরেজি, ঐচ্ছিক)', 'Name (English, optional)', language)}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder={
                    type === 'press'
                      ? 'e.g. Bornali Press'
                      : type === 'offline'
                      ? 'e.g. Nilkhet Library'
                      : 'e.g. Daraz Online'
                  }
                  className="w-full text-xs font-semibold border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 text-zinc-900"
                />
              </div>

              {/* Fields specific to Printing Press: Address & Phone */}
              {type === 'press' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{tr('প্রেসের ঠিকানা / অবস্থান (ঐচ্ছিক)', 'Address / Location (optional)', language)}</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={tr('যেমন: নয়াপল্টন / বাংলাবাজার, ঢাকা', 'e.g. Banglabazar, Dhaka', language)}
                      className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{tr('যোগাযোগ / ফোন নম্বর (ঐচ্ছিক)', 'Contact / Phone (optional)', language)}</span>
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="w-full text-xs font-mono border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 text-zinc-900"
                    />
                  </div>
                </div>
              )}

              {/* Supply Route (For Offline Channels) */}
              {type === 'offline' && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-zinc-800">
                    {tr('এই চ্যানেলটি কোথা থেকে সরবরাহ হয়? *', 'Where is this channel supplied from? *', language)}
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      source === 'headOffice'
                        ? 'border-zinc-900 bg-zinc-100 text-zinc-900 font-bold shadow-2xs'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}>
                      <input
                        type="radio"
                        name="channelSource"
                        value="headOffice"
                        checked={source === 'headOffice'}
                        onChange={() => setSource('headOffice')}
                        className="text-zinc-900 focus:ring-0"
                      />
                      <span>{tr('হেড অফিস থেকে', 'From Head Office', language)}</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      source === 'press'
                        ? 'border-zinc-900 bg-zinc-100 text-zinc-900 font-bold shadow-2xs'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}>
                      <input
                        type="radio"
                        name="channelSource"
                        value="press"
                        checked={source === 'press'}
                        onChange={() => setSource('press')}
                        className="text-zinc-900 focus:ring-0"
                      />
                      <span>{tr('সরাসরি প্রেস থেকে', 'Directly from Press', language)}</span>
                    </label>
                  </div>

                  {source === 'press' && availablePresses.length > 1 && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        {tr('কোন প্রেস থেকে সরাসরি সংগ্রহ করবে? *', 'Which press does it collect from? *', language)}
                      </label>
                      <select
                        value={selectedPressId}
                        onChange={(e) => setSelectedPressId(e.target.value)}
                        className="w-full text-xs font-bold border border-zinc-300 rounded-lg p-2 bg-white text-zinc-900"
                      >
                        {availablePresses.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

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
                    <span>
                      {type === 'press'
                        ? tr('প্রেস মুছুন', 'Delete Press', language)
                        : tr('চ্যানেল মুছুন', 'Delete Channel', language)}
                    </span>
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingChannel
                      ? type === 'press'
                        ? tr('প্রেস হালনাগাদ করুন', 'Update Press Entry', language)
                        : tr('হালনাগাদ করুন', 'Update Channel', language)
                      : type === 'press'
                      ? tr('প্রেস সংরক্ষণ করুন', 'Save Press Entry', language)
                      : tr('চ্যানেল যোগ করুন', 'Add Channel', language)
                    }
                  </span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* SAFE DELETE CONFIRMATION DIALOG */
          <div className="p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900">
              <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">
                  {type === 'press'
                    ? tr('প্রেস মুছে ফেলার নিরাপত্তা যাচাই', 'Confirm Safe Press Deletion', language)
                    : tr('চ্যানেল মুছে ফেলার নিরাপত্তা যাচাই', 'Confirm Safe Channel Deletion', language)}
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  {tr('ভুলে ক্লিক পড়ে যেন কোনো এন্ট্রি ডিলিট না হয় সেজন্য এই নিরাপত্তা ধাপ।', 'This safety confirmation prevents accidental deletion.', language)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-600">{tr('নাম:', 'Name:', language)}</span>
                <span className="font-bold text-zinc-900">{editingChannel?.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-600">{tr('ধরন:', 'Type:', language)}</span>
                <span className="font-bold text-zinc-900">
                  {editingChannel?.type === 'press'
                    ? tr('প্রেস / ছাপাখানা', 'Printing Press', language)
                    : editingChannel?.type === 'online'
                    ? tr('অনলাইন ই-কমার্স', 'Online E-commerce', language)
                    : tr('অফলাইন / লাইব্রেরি', 'Offline / Library', language)}
                </span>
              </div>
              {editingChannel?.type !== 'press' && (
                <>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-600">{tr('মোট বিক্রিত কপি সংখ্যা:', 'Total Sold Copies:', language)}</span>
                    <span className="font-bold font-mono text-zinc-900">{formatNumber(totalSoldInChannel, language)} {tr('কপি', 'copies', language)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">{tr('মোট আদায়কৃত কালেকশন:', 'Total Collected Amount:', language)}</span>
                    <span className="font-bold font-mono text-zinc-900">{formatBDT(totalCollectedInChannel, language)}</span>
                  </div>
                </>
              )}
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
                  'আমি বিষয়টি বুঝেছি এবং নিশ্চিত করছি যে আমি এটি স্থায়ীভাবে মুছে ফেলতে চাই।',
                  'I understand the consequences and confirm that I want to permanently delete this entry.',
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
