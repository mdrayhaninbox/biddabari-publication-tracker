import React, { useState, useRef } from 'react';
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
  Calendar,
  AlertCircle,
  ImageIcon
} from 'lucide-react';
import { StoredFileRecord, NotebookNoteRecord, FileCategory, NoteColor } from '../types/storage';
import { Language, tr } from '../utils/i18n';

interface FileStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StoredFileRecord[];
  notes: NotebookNoteRecord[];
  onAddFile: (file: Omit<StoredFileRecord, 'id' | 'createdAt'>) => void;
  onDeleteFile: (fileId: string) => void;
  onAddNote: (note: Omit<NotebookNoteRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (note: NotebookNoteRecord) => void;
  onDeleteNote: (noteId: string) => void;
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

export const FileStorageModal: React.FC<FileStorageModalProps> = ({
  isOpen,
  onClose,
  files,
  notes,
  onAddFile,
  onDeleteFile,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'notes'>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all'>('all');

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

  // Preview state (Image or Text)
  const [previewFile, setPreviewFile] = useState<StoredFileRecord | null>(null);

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
        
        // Optional 25MB check
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
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View / Open File
  const handleOpenFile = (file: StoredFileRecord) => {
    if (file.category === 'image' || file.category === 'text') {
      setPreviewFile(file);
    } else {
      // For PDF or other files, open in new tab
      const win = window.open();
      if (win) {
        if (file.category === 'pdf') {
          win.document.write(`<iframe src="${file.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
          handleDownloadFile(file);
        }
      } else {
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

  // Filtered files
  const filteredFiles = files.filter(f => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || f.name.toLowerCase().includes(q) || (f.notes && f.notes.toLowerCase().includes(q));
    const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchQuery && matchCat;
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-zinc-200 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl text-white">
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
              </div>
              <p className="text-xs text-zinc-400">
                {tr(
                  'পাবলিকেশন চালানের ছবি, চুক্তিপত্র, পিডিএফ ও গুরুত্বপূর্ণ হিসাবের নোট সংরক্ষণাগার',
                  'Store publication chalans, invoices, agreements, PDFs & memos',
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
              placeholder={activeTab === 'files' ? tr('ফাইল বা নোট খুঁজুন...', 'Search files or notes...', language) : tr('নোটের শিরোনাম বা বিষয়...', 'Search notes...', language)}
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

          {/* TAB 2: PUBLICATION NOTEBOOK */}
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

      {/* Lightbox / Preview Submodal */}
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

    </div>
  );
};
