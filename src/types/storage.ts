export type FileCategory = 'pdf' | 'document' | 'spreadsheet' | 'image' | 'text' | 'other';

export interface StoredFileRecord {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // MIME type
  category: FileCategory;
  dataUrl: string; // Base64 data URL
  notes?: string; // Optional user memo
  createdAt: string; // ISO timestamp
}

export type NoteColor = 'yellow' | 'blue' | 'emerald' | 'purple' | 'zinc';

export interface NotebookNoteRecord {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned?: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export type VoucherCategory = 'all' | 'payment' | 'delivery' | 'order' | 'collection';

export interface VoucherStorageItem {
  id: string;
  recordId: string;
  category: 'payment' | 'delivery' | 'order' | 'collection';
  categoryLabelBn: string;
  categoryLabelEn: string;
  categoryColor: string;
  icon: string;
  title: string;
  subtitle?: string;
  date: string;
  voucherNo?: string;
  amountOrQuantity?: string;
  paymentMethod?: string;
  notes?: string;
  imageUrl: string;
}
