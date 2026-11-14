import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  FolderOpen, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  FileSpreadsheet, 
  File, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  StickyNote, 
  HardDrive, 
  AlertCircle,
  ImageIcon,
  CreditCard,
  Truck,
  ClipboardList,
  Receipt,
  Printer
} from 'lucide-react';
import { 
  StoredFileRecord, 
  NotebookNoteRecord, 
  FileCategory, 
  NoteColor,
  VoucherCategory,
  VoucherStorageItem 
} from '../types/storage';
import { 
  PressPaymentRecord, 
  PressDeliveryRecord, 
  PressOrderRecord, 
  ChannelCollectionRecord 
} from '../types/book';
import { Language, tr } from '../utils/i18n';
import { ImageViewerModal } from './ImageViewerModal';

interface FileStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StoredFileRecord[];
  notes: NotebookNoteRecord[];
  pressPayments?: PressPaymentRecord[];
  pressDeliveries?: PressDeliveryRecord[];
  pressOrders?: PressOrderRecord[];
  channelCollections?: ChannelCollectionRecord[];
  onAddFile: (file: Omit<StoredFileRecord, 'id' | 'createdAt'>) => void;
  onDeleteFile: (fileId: string) => void;
  onAddNote: (note: Omit<NotebookNoteRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (note: NotebookNoteRecord) => void;
  onDeleteNote: (noteId: string) => void;
  onRemoveVoucherImage?: (type: 'payment' | 'delivery' | 'order' | 'collection', recordId: string) => void;
  onDeletePressPayment?: (id: string) => void;
  onDeletePressDelivery?: (id: string) => void;
  onDeletePressOrder?: (id: string) => void;
  onDeleteChannelCollection?: (id: string) => void;
  language?: Language;
}

const COLOR_MAP: Record<NoteColor, { bg: string; border: string; badge: string; text: string }> = {
  yellow: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-900', text: 'text-amber-950' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-900', text: 'text-blue-950' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-900', text: 'text-emerald-950' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-900', text: 'text-purple-950' },
  zinc: { bg: 'bg-zinc-50', border: 'border-zinc-200', badge: 'bg-zinc-200 text-zinc-900', text: 'text-zinc-950' },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function detectCategory(fileName: string, mime: string): FileCategory {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (mime.includes('pdf') || ext === 'pdf') return 'pdf';
  if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
  if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv') || ['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet';
  if (mime.includes('word') || mime.includes('document') || ['doc', 'docx'].includes(ext)) return 'document';
  if (mime.includes('text') || ['txt', 'md', 'json'].includes(ext)) return 'text';
  return 'other';
}

function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return new Blob([dataUrl], { type: 'text/plain' });
  }
}

export const FileStorageModal: React.FC<FileStorageModalProps> = ({
  isOpen,
  onClose,
  files,
  notes,
  pressPayments = [],
  pressDeliveries = [],
  pressOrders = [],
  channelCollections = [],
  onAddFile,
  onDeleteFile,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onRemoveVoucherImage,
  onDeletePressPayment,
  onDeletePressDelivery,
  onDeletePressOrder,
  onDeleteChannelCollection,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'vouchers' | 'notes'>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all'>('all');
  const [selectedVoucherCategory, setSelectedVoucherCategory] = useState<VoucherCategory>('all');

  // Upload state
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Note state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState<NoteColor>('yellow');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Preview state (Image or Text for Stored Files)
  const [previewFile, setPreviewFile] = useState<StoredFileRecord | null>(null);

  // Viewer state for Vouchers & Chalans
  const [viewingVoucher, setViewingVoucher] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Deletion / Removal dialog state for Vouchers
  const [managingVoucher, setManagingVoucher] = useState<VoucherStorageItem | null>(null);

  // Compile all uploaded vouchers from system
  const allVouchers = useMemo<VoucherStorageItem[]>(() => {
    const list: VoucherStorageItem[] = [];

    // 1. Press Payments
    pressPayments.forEach(p => {
      if (p.voucherImage) {
        list.push({
          id: `payment-${p.id}`,
          recordId: p.id,
          category: 'payment',
          categoryLabelBn: 'প্রেস পেমেন্ট',
          categoryLabelEn: 'Press Payment',
          categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: 'CreditCard',
          title: p.pressName || tr('প্রেস পেমেন্ট ভাউচার', 'Press Payment Voucher', language),
          subtitle: p.bookName ? `${tr('বই:', 'Book:', language)} ${p.bookName}` : undefined,
          date: p.date,
          voucherNo: p.voucherNo ? `#${p.voucherNo}` : undefined,
          amountOrQuantity: `৳ ${Number(p.amount || 0).toLocaleString()}`,
          paymentMethod: p.paymentMethod,
          notes: p.notes,
          imageUrl: p.voucherImage,
        });
      }
    });

    // 2. Press Deliveries (Chalans)
    pressDeliveries.forEach(d => {
      if (d.voucherImage) {
        list.push({
          id: `delivery-${d.id}`,
          recordId: d.id,
          category: 'delivery',
          categoryLabelBn: 'প্রেস চালান (ডেলিভারি)',
          categoryLabelEn: 'Press Chalan',
          categoryColor: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: 'Truck',
          title: d.bookName || tr('প্রেস চালান কপি', 'Press Chalan Copy', language),
          subtitle: `${d.pressName || tr('প্রেস', 'Press', language)}${d.chalanNo ? ` • চালান #${d.chalanNo}` : ''}${d.lotName ? ` (${d.lotName})` : ''}`,
          date: d.deliveryDate,
          voucherNo: d.chalanNo ? `#${d.chalanNo}` : undefined,
          amountOrQuantity: `${Number(d.quantity || 0).toLocaleString()} ${tr('কপি', 'copies', language)}`,
          notes: d.notes,
          imageUrl: d.voucherImage,
        });
      }
    });

    // 3. Press Orders
    pressOrders.forEach(o => {
      if (o.voucherImage) {
        list.push({
          id: `order-${o.id}`,
          recordId: o.id,
          category: 'order',
          categoryLabelBn: 'প্রেস অর্ডার স্লিপ',
          categoryLabelEn: 'Press Order',
          categoryColor: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: 'ClipboardList',
          title: o.bookName || tr('প্রেস অর্ডার স্লিপ', 'Press Order Slip', language),
          subtitle: `${o.pressName || tr('প্রেস', 'Press', language)}${o.lotName ? ` • ${o.lotName}` : ''}${o.orderNo ? ` • অর্ডার #${o.orderNo}` : ''}`,
          date: o.orderDate,
          voucherNo: o.orderNo ? `#${o.orderNo}` : undefined,
          amountOrQuantity: `${Number(o.orderQuantity || 0).toLocaleString()} ${tr('কপি অর্ডার', 'copies order', language)}`,
          notes: o.notes,
          imageUrl: o.voucherImage,
        });
      }
    });

    // 4. Channel Collections
    channelCollections.forEach(c => {
      const img = c.voucherImage || c.receiptImage;
      if (img) {
        list.push({
          id: `collection-${c.id}`,
          recordId: c.id,
          category: 'collection',
          categoryLabelBn: 'লাইব্রেরি / চ্যানেল আদায়',
          categoryLabelEn: 'Channel Collection',
          categoryColor: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: 'Receipt',
          title: c.channelName || tr('লাইব্রেরি আদায়', 'Library Collection', language),
          subtitle: c.paymentMethod ? `${tr('পদ্ধতি:', 'Method:', language)} ${c.paymentMethod}` : undefined,
          date: c.date,
          voucherNo: c.receiptNo ? `#${c.receiptNo}` : undefined,
          amountOrQuantity: `৳ ${Number(c.amount || 0).toLocaleString()}`,
          paymentMethod: c.paymentMethod,
          notes: c.notes,
          imageUrl: img,
        });
      }
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [pressPayments, pressDeliveries, pressOrders, channelCollections, language]);

  if (!isOpen) return null;

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // 25MB check
        if (file.size > 25 * 1024 * 1024) {
          throw new Error(tr(`'${file.name}' ফাইলটি ২৫ মেগাবাইটের চেয়ে বড়।`, `'${file.name}' exceeds 25MB limit.`, language));
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const category = detectCategory(file.name, file.type);
        onAddFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          category,
          dataUrl,
          notes: uploadNotes.trim() || undefined,
        });
      }
      setUploadNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message || tr('ফাইল আপলোড করতে সমস্যা হয়েছে।', 'Failed to upload file.', language));
    } finally {
      setIsUploading(false);
    }
  };

  // Download file helper
  const handleDownloadFile = (file: StoredFileRecord) => {
    try {
      const blob = dataUrlToBlob(file.dataUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      const link = document.createElement('a');
      link.href = file.dataUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Download voucher image helper
  const handleDownloadVoucherImage = (voucher: VoucherStorageItem) => {
    try {
      const link = document.createElement('a');
      link.href = voucher.imageUrl;
      const cleanTitle = (voucher.title || 'voucher').replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_');
      link.download = `${voucher.category}_${cleanTitle}_${voucher.date}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download voucher image:', err);
    }
  };

  // View / Open File
  const handleOpenFile = (file: StoredFileRecord) => {
    if (file.category === 'image' || file.category === 'text') {
      setPreviewFile(file);
    } else {
      try {
        const blob = dataUrlToBlob(file.dataUrl);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch {
        handleDownloadFile(file);
      }
    }
  };

  // Handle Note Save / Update
  const handleSaveNote = () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;

    if (editingNoteId) {
      const existing = notes.find(n => n.id === editingNoteId);
      if (existing) {
        onUpdateNote({
          ...existing,
          title: noteTitle.trim() || tr('শিরোনামহীন নোট', 'Untitled Note', language),
          content: noteContent.trim(),
          color: noteColor,
          updatedAt: new Date().toISOString(),
        });
      }
      setEditingNoteId(null);
    } else {
      onAddNote({
        title: noteTitle.trim() || tr('নতুন প্রকাশনা নোট', 'New Publication Note', language),
        content: noteContent.trim(),
        color: noteColor,
      });
    }

    setNoteTitle('');
    setNoteContent('');
    setNoteColor('yellow');
    setIsAddingNote(false);
  };

  const handleEditNote = (note: NotebookNoteRecord) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color || 'yellow');
    setIsAddingNote(true);
  };

  const handleCopyNote = (note: NotebookNoteRecord) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 1800);
  };

  // Confirm delete or remove image only
  const handleExecuteVoucherAction = (action: 'remove_image_only' | 'delete_record') => {
    if (!managingVoucher) return;

    if (action === 'remove_image_only') {
      if (onRemoveVoucherImage) {
        onRemoveVoucherImage(managingVoucher.category, managingVoucher.recordId);
      }
    } else if (action === 'delete_record') {
      if (managingVoucher.category === 'payment' && onDeletePressPayment) {
        onDeletePressPayment(managingVoucher.recordId);
      } else if (managingVoucher.category === 'delivery' && onDeletePressDelivery) {
        onDeletePressDelivery(managingVoucher.recordId);
      } else if (managingVoucher.category === 'order' && onDeletePressOrder) {
        onDeletePressOrder(managingVoucher.recordId);
      } else if (managingVoucher.category === 'collection' && onDeleteChannelCollection) {
        onDeleteChannelCollection(managingVoucher.recordId);
      }
    }
    setManagingVoucher(null);
  };

  // Filtered files
  const filteredFiles = files.filter(f => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || f.name.toLowerCase().includes(q) || (f.notes && f.notes.toLowerCase().includes(q));
    const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchQuery && matchCat;
  });

  // Filtered vouchers
  const filteredVouchers = allVouchers.filter(v => {
    const q = searchQuery.toLowerCase().trim();
    const matchCat = selectedVoucherCategory === 'all' || v.category === selectedVoucherCategory;
    if (!matchCat) return false;
    if (!q) return true;

    return (
      v.title.toLowerCase().includes(q) ||
      (v.subtitle && v.subtitle.toLowerCase().includes(q)) ||
      (v.voucherNo && v.voucherNo.toLowerCase().includes(q)) ||
      (v.notes && v.notes.toLowerCase().includes(q)) ||
      (v.amountOrQuantity && v.amountOrQuantity.toLowerCase().includes(q)) ||
      (v.paymentMethod && v.paymentMethod.toLowerCase().includes(q)) ||
      v.date.includes(q)
    );
  });

  // Filtered notes
  const filteredNotes = notes.filter(n => {
    const q = searchQuery.toLowerCase().trim();
    return !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const totalStorageBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

  const getFileIcon = (category: FileCategory) => {
    switch (category) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-amber-500" />;
      default:
        return <File className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getVoucherIcon = (category: VoucherStorageItem['category']) => {
    switch (category) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'delivery':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'order':
        return <ClipboardList className="w-4 h-4 text-purple-600" />;
      case 'collection':
        return <Receipt className="w-4 h-4 text-amber-600" />;
      default:
        return <Receipt className="w-4 h-4 text-zinc-600" />;
    }
  };

  // Counts per voucher category
  const voucherCounts = {
    all: allVouchers.length,
    payment: allVouchers.filter(v => v.category === 'payment').length,
    delivery: allVouchers.filter(v => v.category === 'delivery').length,
    order: allVouchers.filter(v => v.category === 'order').length,
    collection: allVouchers.filter(v => v.category === 'collection').length,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-zinc-200 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl text-white">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {tr('ফাইল স্টোরেজ ও ডিজিটাল নোটবুক', 'File Storage & Digital Notebook', language)}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                  {formatBytes(totalStorageBytes)}
                </span>
                {allVouchers.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40">
                    {allVouchers.length} {tr('টি ভাউচার স্ক্যান', 'vouchers attached', language)}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {tr(
                  'পাবলিকেশন চালানের ছবি, রিসিট ভাউচার, চুক্তিপত্র, পিডিএফ ও হিসাবের ডিজিটাল সংরক্ষণাগার',
                  'Store publication chalans, receipts, invoices, agreements, PDFs & memos',
                  language
                )}
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

        {/* Tab Switcher & Search Bar */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="inline-flex bg-zinc-200/80 p-1 rounded-xl text-xs font-bold gap-1 self-start">
            {/* TAB 1: STORED FILES */}
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'files'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-700 hover:text-black'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{tr('সংরক্ষিত ফাইলসমূহ', 'Stored Files', language)}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'files' ? 'bg-zinc-700 text-white' : 'bg-zinc-300 text-zinc-800'
              }`}>
                {files.length}
              </span>
            </button>

            {/* TAB 2: VOUCHERS & CHALANS */}
            <button
              type="button"
              onClick={() => setActiveTab('vouchers')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'vouchers'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-700 hover:text-black'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{tr('ভাউচার ও চালান গ্যালারি', 'Vouchers & Chalans', language)}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'vouchers' ? 'bg-emerald-600 text-white' : 'bg-zinc-300 text-zinc-800'
              }`}>
                {allVouchers.length}
              </span>
            </button>

            {/* TAB 3: NOTEBOOK NOTES */}
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'notes'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-700 hover:text-black'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>{tr('প্রকাশনা নোটবুক', 'Notebook Notes', language)}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'notes' ? 'bg-zinc-700 text-white' : 'bg-zinc-300 text-zinc-800'
              }`}>
                {notes.length}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'files' 
                  ? tr('ফাইল খুঁজুন...', 'Search files...', language)
                  : activeTab === 'vouchers'
                  ? tr('ভাউচার বা চালান খুঁজুন...', 'Search vouchers / chalans...', language)
                  : tr('নোটের শিরোনাম বা বিষয়...', 'Search notes...', language)
              }
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[11px]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* TAB 1: FILES STORAGE */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              
              {/* Upload Box */}
              <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-zinc-900 rounded-2xl p-4 transition-colors">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200/80 flex items-center justify-center text-zinc-700 shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">
                        {tr('নতুন ফাইল আপলোড ও সংরক্ষণ করুন', 'Upload & Store New Files', language)}
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        {tr('পিডিএফ, চালান ছবি, চুক্তিপত্র, এক্সেল ও ওয়ার্ড ফাইল (সর্বোচ্চ ২৫MB)', 'PDF, Invoices, Images, Excel, Word & Docs (Up to 25MB)', language)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder={tr('সংক্ষিপ্ত বিবরণ / নোট (ঐচ্ছিক)...', 'Short note / memo (optional)...', language)}
                      className="px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 flex-1 sm:w-60"
                    />

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                      id="biddabari-file-upload-input"
                    />
                    <label
                      htmlFor="biddabari-file-upload-input"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0 ${
                        isUploading 
                          ? 'bg-zinc-300 text-zinc-600 cursor-not-allowed' 
                          : 'bg-zinc-900 hover:bg-black text-white shadow-xs'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isUploading ? tr('আপলোড হচ্ছে...', 'Uploading...', language) : tr('ফাইল বেছে নিন', 'Choose File', language)}</span>
                    </label>
                  </div>
                </div>

                {uploadError && (
                  <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-zinc-500 mr-1">{tr('ক্যাটাগরি:', 'Category:', language)}</span>
                {[
                  { key: 'all', label: tr('সকল ফাইল', 'All Files', language) },
                  { key: 'pdf', label: tr('পিডিএফ (PDF)', 'PDFs', language) },
                  { key: 'image', label: tr('ছবি ও স্ক্যান', 'Images & Scans', language) },
                  { key: 'spreadsheet', label: tr('এক্সেল / শিট', 'Spreadsheets', language) },
                  { key: 'document', label: tr('ডকুমেন্টস', 'Documents', language) },
                  { key: 'text', label: tr('টেক্সট নোট', 'Text', language) },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat.key
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Files List */}
              {filteredFiles.length === 0 ? (
                <div className="text-center py-12 border border-zinc-200 rounded-2xl bg-zinc-50">
                  <FolderOpen className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-700">
                    {tr('কোনো ফাইল পাওয়া যায়নি', 'No files found', language)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {tr('উপরের আপলোড বাটন থেকে প্রয়োজনীয় ফাইল যুক্ত করে রাখুন।', 'Upload and store important documents above.', language)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 bg-white border border-zinc-200 hover:border-zinc-400 rounded-xl transition-all shadow-2xs flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                          {getFileIcon(file.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-zinc-900 truncate" title={file.name}>
                            {file.name}
                          </h5>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                          </div>
                          {file.notes && (
                            <p className="text-[11px] text-zinc-600 mt-1 italic bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100 line-clamp-1">
                              💬 {file.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* File Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenFile(file)}
                          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                          title={tr('দেখুন বা প্রিভিউ', 'View or Preview', language)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(file)}
                          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                          title={tr('ডাউনলোড করুন', 'Download', language)}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(tr(`আপনি কি '${file.name}' ফাইলটি মুছে ফেলতে চান?`, `Delete '${file.name}'?`, language))) {
                              onDeleteFile(file.id);
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={tr('মুছে ফেলুন', 'Delete', language)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: VOUCHERS & CHALANS GALLERY */}
          {activeTab === 'vouchers' && (
            <div className="space-y-4">
              
              {/* Banner / Info Header */}
              <div className="bg-linear-to-r from-zinc-900 to-zinc-800 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>{tr('আপলোডকৃত সকল ভাউচার, চালান ও মানি রিসিট সংগ্রহশালা', 'Centralized Vouchers, Chalans & Receipts Repository', language)}</span>
                  </h4>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    {tr(
                      'প্রেস পেমেন্ট, ডেলিভারি চালান, প্রেস অর্ডার স্লিপ এবং লাইব্রেরি কালেকশনের সময় সংযুক্ত করা সকল মূল ডকুমেন্ট ছবি এখানে ক্যাটাগরিভিত্তিক সংরক্ষিত আছে।',
                      'All original receipt/voucher images uploaded across press payments, deliveries, orders & library collections are categorized and accessible here.',
                      language
                    )}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center">
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">{tr('মোট সংযুক্ত', 'Total Attached', language)}</div>
                    <div className="text-sm font-black font-mono text-emerald-400">{allVouchers.length}</div>
                  </div>
                </div>
              </div>

              {/* Voucher Category Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-zinc-500 mr-1">{tr('ক্যাটাগরি:', 'Category:', language)}</span>
                
                {/* All */}
                <button
                  type="button"
                  onClick={() => setSelectedVoucherCategory('all')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedVoucherCategory === 'all'
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  <span>{tr('সকল ভাউচার ও চালান', 'All Vouchers & Chalans', language)}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedVoucherCategory === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-800'
                  }`}>
                    {voucherCounts.all}
                  </span>
                </button>

                {/* Press Payments */}
                <button
                  type="button"
                  onClick={() => setSelectedVoucherCategory('payment')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedVoucherCategory === 'payment'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{tr('💳 প্রেস পেমেন্ট ভাউচার', 'Press Payments', language)}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedVoucherCategory === 'payment' ? 'bg-emerald-800 text-white' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {voucherCounts.payment}
                  </span>
                </button>

                {/* Press Deliveries */}
                <button
                  type="button"
                  onClick={() => setSelectedVoucherCategory('delivery')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedVoucherCategory === 'delivery'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{tr('🚚 প্রেস ডেলিভারি চালান', 'Press Chalans', language)}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedVoucherCategory === 'delivery' ? 'bg-blue-800 text-white' : 'bg-blue-200 text-blue-900'
                  }`}>
                    {voucherCounts.delivery}
                  </span>
                </button>

                {/* Press Orders */}
                <button
                  type="button"
                  onClick={() => setSelectedVoucherCategory('order')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedVoucherCategory === 'order'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>{tr('📋 প্রেস অর্ডার স্লিপ', 'Press Orders', language)}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedVoucherCategory === 'order' ? 'bg-purple-800 text-white' : 'bg-purple-200 text-purple-900'
                  }`}>
                    {voucherCounts.order}
                  </span>
                </button>

                {/* Collections */}
                <button
                  type="button"
                  onClick={() => setSelectedVoucherCategory('collection')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedVoucherCategory === 'collection'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{tr('💰 লাইব্রেরি মানি রিসিট', 'Library Receipts', language)}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedVoucherCategory === 'collection' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {voucherCounts.collection}
                  </span>
                </button>
              </div>

              {/* Vouchers Grid */}
              {filteredVouchers.length === 0 ? (
                <div className="text-center py-12 border border-zinc-200 rounded-2xl bg-zinc-50">
                  <Receipt className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-700">
                    {tr('কোনো ভাউচার বা চালান ছবি পাওয়া যায়নি', 'No voucher or chalan images found', language)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 max-w-md mx-auto">
                    {tr(
                      'প্রেস পেমেন্ট, ডেলিভারি রিসিভ বা লাইব্রেরি আদায় এন্ট্রি করার সময় ছবি বা ভাউচার আপলোড করলে স্বয়ংক্রিয়ভাবে এখানে তালিকাভুক্ত হবে।',
                      'Attaching photos while recording press payments, deliveries or collections will automatically list them here.',
                      language
                    )}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className="bg-white border border-zinc-200 hover:border-zinc-400 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                    >
                      {/* Image Thumbnail Container */}
                      <div className="relative aspect-4/3 bg-zinc-100 overflow-hidden border-b border-zinc-100 cursor-pointer"
                           onClick={() => setViewingVoucher({
                             url: voucher.imageUrl,
                             title: voucher.title,
                             subtitle: `${voucher.categoryLabelBn} • ${voucher.subtitle || ''} (${voucher.date})`
                           })}
                      >
                        <img
                          src={voucher.imageUrl}
                          alt={voucher.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{tr('বড় করে দেখুন', 'Zoom / View', language)}</span>
                          </span>
                        </div>

                        {/* Top Left: Category Badge */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border flex items-center gap-1 backdrop-blur-md ${voucher.categoryColor}`}>
                            {getVoucherIcon(voucher.category)}
                            <span>{language === 'bn' ? voucher.categoryLabelBn : voucher.categoryLabelEn}</span>
                          </span>
                        </div>

                        {/* Top Right: Date Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-900/80 text-white shadow-xs font-mono backdrop-blur-md">
                            {voucher.date}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <h5 className="text-xs font-bold text-zinc-900 line-clamp-1" title={voucher.title}>
                              {voucher.title}
                            </h5>
                            {voucher.voucherNo && (
                              <span className="text-[10px] font-bold text-zinc-500 font-mono bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
                                {voucher.voucherNo}
                              </span>
                            )}
                          </div>

                          {voucher.subtitle && (
                            <p className="text-[11px] text-zinc-600 line-clamp-1 mt-0.5">
                              {voucher.subtitle}
                            </p>
                          )}

                          {voucher.amountOrQuantity && (
                            <div className="mt-2 inline-block">
                              <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                                {voucher.amountOrQuantity}
                              </span>
                            </div>
                          )}

                          {voucher.notes && (
                            <p className="text-[10px] text-zinc-500 italic mt-1.5 line-clamp-2 bg-zinc-50 p-1.5 rounded border border-zinc-100">
                              💬 {voucher.notes}
                            </p>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {voucher.paymentMethod ? `${tr('পেমেন্ট:', 'Method:', language)} ${voucher.paymentMethod}` : ''}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* View / Zoom */}
                            <button
                              type="button"
                              onClick={() => setViewingVoucher({
                                url: voucher.imageUrl,
                                title: voucher.title,
                                subtitle: `${voucher.categoryLabelBn} • ${voucher.subtitle || ''} (${voucher.date})`
                              })}
                              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                              title={tr('বড় করে দেখুন ও প্রিন্ট করুন', 'View & Print Voucher', language)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Download Image */}
                            <button
                              type="button"
                              onClick={() => handleDownloadVoucherImage(voucher)}
                              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                              title={tr('ছবি ডাউনলোড করুন', 'Download Image', language)}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Manage / Delete Voucher */}
                            <button
                              type="button"
                              onClick={() => setManagingVoucher(voucher)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={tr('ভাউচার ছবি মুছুন বা পরিবর্তন', 'Remove Voucher Image', language)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PUBLICATION NOTEBOOK */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              
              {/* Add / Edit Note Trigger & Form */}
              {!isAddingNote ? (
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <StickyNote className="w-4 h-4 text-zinc-700" />
                      <span>{tr('জরুরি প্রকাশনা মেমো ও নোট তৈরি করুন', 'Create Publication Notes & Reminders', language)}</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      {tr('প্রেস অর্ডার মিটিং, লাইব্রেরি তাগাদা বা যেকোনো তথ্য লিখে রাখতে পারেন', 'Keep track of press meetings, library dues reminders or book ideas', language)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoteId(null);
                      setNoteTitle('');
                      setNoteContent('');
                      setNoteColor('yellow');
                      setIsAddingNote(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-black text-white rounded-lg shadow-xs transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{tr('নতুন নোট লিখুন', 'New Note', language)}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-zinc-50 border border-zinc-300 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900">
                      {editingNoteId ? tr('নোট সম্পাদনা করুন', 'Edit Note', language) : tr('নতুন নোট লিখুন', 'Write New Note', language)}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNote(false);
                        setEditingNoteId(null);
                      }}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder={tr('নোটের শিরোনাম (যেমন: ফরিদ ভাই প্রেস তাগাদা)...', 'Note title (e.g., Press Meeting Reminder)...', language)}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
                  />

                  <textarea
                    rows={4}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={tr('নোটের বিস্তারিত বিবরণ লিখুন...', 'Write note details here...', language)}
                    className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 leading-relaxed font-sans"
                  />

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    {/* Color Picker */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-zinc-500">{tr('কালার ট্যাগ:', 'Color Tag:', language)}</span>
                      {(['yellow', 'blue', 'emerald', 'purple', 'zinc'] as NoteColor[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNoteColor(c)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            c === 'yellow' ? 'bg-amber-300' :
                            c === 'blue' ? 'bg-blue-400' :
                            c === 'emerald' ? 'bg-emerald-400' :
                            c === 'purple' ? 'bg-purple-400' : 'bg-zinc-400'
                          } ${noteColor === c ? 'border-zinc-900 scale-110 shadow-xs' : 'border-white'}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNote(false);
                          setEditingNoteId(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
                      >
                        {tr('বাতিল', 'Cancel', language)}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveNote}
                        className="px-4 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-black text-white rounded-lg shadow-xs transition-colors"
                      >
                        {editingNoteId ? tr('আপডেট করুন', 'Update Note', language) : tr('সংরক্ষণ করুন', 'Save Note', language)}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Grid */}
              {filteredNotes.length === 0 ? (
                <div className="text-center py-12 border border-zinc-200 rounded-2xl bg-zinc-50">
                  <StickyNote className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-700">
                    {tr('কোনো নোট লেখা হয়নি', 'No notes found', language)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {tr('প্রেস, কালেকশন বা মিটিং সংক্রান্ত যেকোনো দরকারি তথ্য নোটবুকে লিখে রাখুন।', 'Record any publication, press or collection notes above.', language)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredNotes.map((note) => {
                    const style = COLOR_MAP[note.color || 'zinc'];
                    return (
                      <div
                        key={note.id}
                        className={`p-4 rounded-xl border ${style.border} ${style.bg} flex flex-col justify-between shadow-2xs transition-all hover:shadow-xs group`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h5 className={`text-xs font-black ${style.text} leading-snug`}>
                              {note.title}
                            </h5>
                            <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                              {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed line-clamp-6 font-sans">
                            {note.content}
                          </p>
                        </div>

                        {/* Note Actions */}
                        <div className="pt-3 mt-3 border-t border-black/5 flex items-center justify-between text-[11px]">
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyNote(note)}
                              className="p-1 text-zinc-500 hover:text-zinc-900 rounded hover:bg-black/5 transition-colors"
                              title={tr('নোট কপি করুন', 'Copy Note', language)}
                            >
                              {copiedNoteId === note.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditNote(note)}
                              className="px-2 py-0.5 text-xs font-semibold text-zinc-700 hover:text-black rounded hover:bg-black/5 transition-colors"
                            >
                              {tr('এডিট', 'Edit', language)}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(tr('আপনি কি এই নোটটি মুছে ফেলতে চান?', 'Delete this note?', language))) {
                                  onDeleteNote(note.id);
                                }
                              }}
                              className="p-1 text-zinc-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                              title={tr('মুছে ফেলুন', 'Delete', language)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-3 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-500 font-medium">
            {activeTab === 'files' 
              ? `${files.length} ${tr('টি ফাইল সংরক্ষিত', 'Files Stored', language)} (${formatBytes(totalStorageBytes)})`
              : activeTab === 'vouchers'
              ? `${allVouchers.length} ${tr('টি ভাউচার ও চালানের ছবি সংরক্ষিত', 'Vouchers & Chalans Attached', language)}`
              : `${notes.length} ${tr('টি নোট লেখা হয়েছে', 'Notes Recorded', language)}`
            }
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-zinc-800 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
          >
            {tr('বন্ধ করুন', 'Close', language)}
          </button>
        </div>

      </div>

      {/* Lightbox / Preview Submodal for Stored Files */}
      {previewFile && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="bg-zinc-900 text-white px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-bold truncate pr-3">{previewFile.name}</span>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-zinc-100">
              {previewFile.category === 'image' ? (
                <img 
                  src={previewFile.dataUrl} 
                  alt={previewFile.name}
                  className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <pre className="text-xs p-4 bg-white border border-zinc-200 rounded-xl w-full h-full overflow-auto whitespace-pre-wrap font-mono">
                  {atob(previewFile.dataUrl.split(',')[1] || '')}
                </pre>
              )}
            </div>
            <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2">
              <button
                onClick={() => handleDownloadFile(previewFile)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{tr('ডাউনলোড', 'Download', language)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Viewer / Printer Modal for Vouchers */}
      {viewingVoucher && (
        <ImageViewerModal
          isOpen={!!viewingVoucher}
          onClose={() => setViewingVoucher(null)}
          imageUrl={viewingVoucher.url}
          title={viewingVoucher.title}
          subtitle={viewingVoucher.subtitle}
          language={language}
        />
      )}

      {/* Manage / Delete Voucher Options Dialog */}
      {managingVoucher && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-zinc-900">
                  {tr('ভাউচার ছবি পরিচালনা / মুছুন', 'Manage / Remove Voucher Image', language)}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {managingVoucher.title} ({managingVoucher.date})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingVoucher(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-1 text-zinc-600">
              <p>
                <strong>{tr('ক্যাটাগরি:', 'Category:', language)}</strong> {language === 'bn' ? managingVoucher.categoryLabelBn : managingVoucher.categoryLabelEn}
              </p>
              {managingVoucher.voucherNo && (
                <p>
                  <strong>{tr('ভাউচার / চালান নং:', 'Voucher / Chalan No:', language)}</strong> {managingVoucher.voucherNo}
                </p>
              )}
              {managingVoucher.amountOrQuantity && (
                <p>
                  <strong>{tr('পরিমাণ:', 'Amount / Quantity:', language)}</strong> {managingVoucher.amountOrQuantity}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {/* Option 1: Remove Voucher Image Only */}
              <button
                type="button"
                onClick={() => handleExecuteVoucherAction('remove_image_only')}
                className="w-full px-4 py-2.5 text-xs font-bold text-zinc-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="text-amber-900 font-bold">
                    {tr('শুধু ভাউচারের ছবি মুছুন (হিসাব থাকবে)', 'Remove Image Only (Keep Financial Entry)', language)}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">
                    {tr('লেজার বা ট্রানজ্যাকশন ডাটা ঠিক থাকবে, কেবল সংযুক্ত ফটো রিমুভ হবে', 'Financial ledger entry remains intact, only photo attachment is removed', language)}
                  </div>
                </div>
                <Trash2 className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform shrink-0 ml-2" />
              </button>

              {/* Option 2: Delete entire ledger record */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(tr('আপনি কি এই সম্পূর্ণ লেজার এন্ট্রি মুছে ফেলতে চান?', 'Delete this complete ledger entry?', language))) {
                    handleExecuteVoucherAction('delete_record');
                  }
                }}
                className="w-full px-4 py-2.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="text-red-900 font-bold">
                    {tr('সম্পূর্ণ রেকর্ড ও ছবি মুছে ফেলুন', 'Delete Entire Record & Image', language)}
                  </div>
                  <div className="text-[10px] text-red-600 mt-0.5">
                    {tr('সতর্কতা: লেজার থেকে এই এন্ট্রিটি সম্পূর্ণ মুছে যাবে', 'Warning: Completely deletes this record from publication database', language)}
                  </div>
                </div>
                <Trash2 className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform shrink-0 ml-2" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setManagingVoucher(null)}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg"
              >
                {tr('বাতিল', 'Cancel', language)}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
