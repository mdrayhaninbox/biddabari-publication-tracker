import React, { useState, useEffect } from 'react';
import { 
  BookRecord, 
  ActiveTab, 
  PressPaymentRecord, 
  ChannelCollectionRecord, 
  PressOrderRecord, 
  PressDeliveryRecord,
  ChannelConfig,
  ChannelType,
  DEFAULT_CHANNELS
} from './types/book';
import { INITIAL_BOOKS } from './data/initialBooks';
import { 
  INITIAL_PRESS_PAYMENTS, 
  INITIAL_CHANNEL_COLLECTIONS, 
  INITIAL_PRESS_ORDERS, 
  INITIAL_PRESS_DELIVERIES 
} from './data/initialAccountsData';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BooksTable } from './components/BooksTable';
import { DailyEntryModal } from './components/DailyEntryModal';
import { BookDetailMatrix } from './components/BookDetailMatrix';
import { AddEditBookModal } from './components/AddEditBookModal';
import { ExcelSyncModal } from './components/ExcelSyncModal';
import { PrintableReport, PrintScope } from './components/PrintableReport';
import { PeriodViewSystem } from './components/PeriodViewSystem';
import { QuickDataEntry } from './components/QuickDataEntry';
import { AccountsDueLedger } from './components/AccountsDueLedger';
import { AddPressPaymentModal } from './components/AddPressPaymentModal';
import { AddPressOrderModal } from './components/AddPressOrderModal';
import { AddPressDeliveryModal } from './components/AddPressDeliveryModal';
import { AddChannelCollectionModal } from './components/AddChannelCollectionModal';
import { AddEditChannelModal } from './components/AddEditChannelModal';
import { FileStorageModal } from './components/FileStorageModal';
import { StoredFileRecord, NotebookNoteRecord } from './types/storage';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { exportBooksToExcel, FullDatabaseImportResult } from './utils/excelHandler';
import { idbSet, idbGet, idbClear } from './utils/indexedDBStorage';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { 
  syncBooksToFirestore, 
  syncPressPaymentsToFirestore, 
  syncPressOrdersToFirestore, 
  syncPressDeliveriesToFirestore, 
  syncChannelCollectionsToFirestore, 
  syncChannelsToFirestore,
  resetFirestoreData
} from './services/firebaseSync';
import { 
  getDaysInMonth, 
  createFreshMonthBooks, 
  formatMonthYearBengali,
  setAppLanguage,
  setBookChannelDailySales
} from './utils/calculations';
import { Theme, Language } from './utils/i18n';

const CLEAN_SLATE_ZERO_KEY = 'biddabari_clean_slate_zero_v4';
const MASTER_CATALOG_STORAGE_KEY = 'biddabari_master_book_catalog_v4';

const ZOOM_STORAGE_KEY = 'biddabari_ui_zoom_v1';
const MONTH_STORAGE_KEY = 'biddabari_selected_month_v4';
const YEAR_STORAGE_KEY = 'biddabari_selected_year_v4';
const PRESS_PAYMENTS_STORAGE_KEY = 'biddabari_press_payments_v4';
const PRESS_ORDERS_STORAGE_KEY = 'biddabari_press_orders_v4';
const PRESS_DELIVERIES_STORAGE_KEY = 'biddabari_press_deliveries_v4';
const CHANNEL_COLLECTIONS_STORAGE_KEY = 'biddabari_channel_collections_v4';
const CHANNELS_STORAGE_KEY = 'biddabari_sales_channels_v5';
const THEME_STORAGE_KEY = 'biddabari_theme_v2';
const LANGUAGE_STORAGE_KEY = 'biddabari_language_v2';
const STORED_FILES_KEY = 'biddabari_stored_files_v1';
const NOTEBOOK_NOTES_KEY = 'biddabari_notebook_notes_v1';

const getMonthlyStorageKey = (year: number, month: number) => 
  `biddabari_books_data_v4_${year}-${String(month).padStart(2, '0')}`;

/**
 * Safe localStorage & native browser IndexedDB writer (Firefox, Chrome, Edge)
 * Dual-sync ensures quota-free storage and deep persistence.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
      // Dual-sync to browser database (IndexedDB in Firefox, Chrome, etc.)
      idbSet(key, value).catch(() => {});
      return true;
    }
    return false;
  } catch (err: any) {
    console.error(`Safe storage save error on "${key}":`, err);
    // Even if localStorage is full or throws, save to browser IndexedDB
    idbSet(key, value).catch(() => {});
    return false;
  }
}

export const App: React.FC = () => {
  // UI Zoom state: default 75% compact view on desktop as requested
  const [uiZoom, setUiZoom] = useState<'75' | '100'>(() => {
    try {
      const savedZoom = localStorage.getItem(ZOOM_STORAGE_KEY);
      if (savedZoom === '100') return '100';
    } catch (e) {
      // fallback
    }
    return '75';
  });

  // Responsive Zoom handler: Desktop (>=1024px) supports 75% compact view; Mobile/Tablet (<1024px) remains native 100%
  useEffect(() => {
    const applyZoom = () => {
      try {
        localStorage.setItem(ZOOM_STORAGE_KEY, uiZoom);
        if (window.innerWidth >= 1024 && uiZoom === '75') {
          document.body.style.zoom = '0.75';
        } else {
          document.body.style.zoom = '1';
        }
      } catch (e) {
        console.error(e);
      }
    };

    applyZoom();
    window.addEventListener('resize', applyZoom);
    return () => window.removeEventListener('resize', applyZoom);
  }, [uiZoom]);

  // Color Theme & Language State (Default: Royal Navy Blue & English)
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      if (saved && ['classic', 'navy', 'emerald'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      // fallback
    }
    return 'navy';
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (saved && ['bn', 'en'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      // fallback
    }
    return 'en';
  });

  // Apply theme to document element
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // Apply language globally
  useEffect(() => {
    try {
      setAppLanguage(language);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (e) {
      console.error(e);
    }
  }, [language]);

  // Selected Month & Year (Default to current active month: Nov 2026)
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    try {
      const savedYear = localStorage.getItem(YEAR_STORAGE_KEY);
      if (savedYear) {
        const parsed = Number(savedYear);
        if (!isNaN(parsed) && parsed >= 2020 && parsed <= 2040) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return 2026;
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    try {
      const savedMonth = localStorage.getItem(MONTH_STORAGE_KEY);
      if (savedMonth) {
        const parsed = Number(savedMonth);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return 11; // November
  });

  // Calculate dynamic days in the selected month
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  // Helper to load books for specific month & year with master catalog inheritance
  const loadBooksForPeriod = (year: number, month: number): BookRecord[] => {
    try {
      const currentKey = getMonthlyStorageKey(year, month);
      const saved = localStorage.getItem(currentKey);
      let monthBooks: BookRecord[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          monthBooks = parsed;
        }
      }

      // Check master catalog
      const masterSaved = localStorage.getItem(MASTER_CATALOG_STORAGE_KEY);
      let masterCatalog: BookRecord[] = [];
      if (masterSaved) {
        try {
          const parsedMaster = JSON.parse(masterSaved);
          if (Array.isArray(parsedMaster) && parsedMaster.length > 0) {
            masterCatalog = parsedMaster;
          }
        } catch (err) {
          console.error(err);
        }
      }

      // If this month already has saved books:
      if (monthBooks.length > 0) {
        // If master catalog has books that are missing in this month, merge them in cleanly
        if (masterCatalog.length > 0) {
          const existingIds = new Set(monthBooks.map(b => b.id));
          const missing = masterCatalog.filter(mb => !existingIds.has(mb.id));
          if (missing.length > 0) {
            const freshMissing = createFreshMonthBooks(missing);
            monthBooks = [...monthBooks, ...freshMissing];
            safeLocalStorageSet(currentKey, JSON.stringify(monthBooks));
          }
        }
        return monthBooks;
      }

      // If this month has NO saved books yet, but master catalog has books:
      if (masterCatalog.length > 0) {
        const freshFromMaster = createFreshMonthBooks(masterCatalog);
        safeLocalStorageSet(currentKey, JSON.stringify(freshFromMaster));
        return freshFromMaster;
      }

      // Fallback: search any other existing monthly keys for books!
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('biddabari_books_data_v4_') && k !== currentKey) {
            try {
              const fallbackSaved = localStorage.getItem(k);
              if (fallbackSaved) {
                const fallbackParsed = JSON.parse(fallbackSaved);
                if (Array.isArray(fallbackParsed) && fallbackParsed.length > 0) {
                  const freshFromFallback = createFreshMonthBooks(fallbackParsed);
                  safeLocalStorageSet(currentKey, JSON.stringify(freshFromFallback));
                  safeLocalStorageSet(MASTER_CATALOG_STORAGE_KEY, JSON.stringify(fallbackParsed));
                  return freshFromFallback;
                }
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }

      return INITIAL_BOOKS;
    } catch (e) {
      console.error('Failed to load books for period:', e);
      return INITIAL_BOOKS;
    }
  };

  // Helper to synchronously save books to local storage and keep master catalog in sync
  const syncSaveBooks = (updatedBooks: BookRecord[], year = selectedYear, month = selectedMonth) => {
    try {
      const currentKey = getMonthlyStorageKey(year, month);
      safeLocalStorageSet(currentKey, JSON.stringify(updatedBooks));

      if (updatedBooks.length > 0) {
        // Strip monthly dynamic daily numbers to keep master catalog lightweight
        const masterCatalog = updatedBooks.map(b => ({
          ...b,
          pressDailyReceipts: {},
          boibari: {},
          rokomari: {},
          wafilife: {},
          othersOnline: {},
          headOfficeSellOffline: {},
          nilkhetLibrary: {},
          sumonaLibrary: {},
          promiseLibrary: {},
          joystarLibrary: {},
          dailyReturns: {},
          marketing: 0,
          service: 0,
          adVideoMaking: 0,
          rd: 0,
          gift: 0,
        }));
        safeLocalStorageSet(MASTER_CATALOG_STORAGE_KEY, JSON.stringify(masterCatalog));
      }

      // Sync to Firebase Cloud Firestore in background
      syncBooksToFirestore(year, month, updatedBooks).catch(() => {});
    } catch (e) {
      console.error('Failed to sync-save books:', e);
    }
  };

  // State: books for the active month/year
  const [books, setBooks] = useState<BookRecord[]>(() => {
    return loadBooksForPeriod(selectedYear, selectedMonth);
  });

  // State: Press Payments Ledger
  const [pressPayments, setPressPayments] = useState<PressPaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(PRESS_PAYMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRESS_PAYMENTS;
  });

  // State: Channel Collections Ledger
  const [channelCollections, setChannelCollections] = useState<ChannelCollectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(CHANNEL_COLLECTIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CHANNEL_COLLECTIONS;
  });

  // State: Press Orders (Multi-press order management)
  const [pressOrders, setPressOrders] = useState<PressOrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem(PRESS_ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRESS_ORDERS;
  });

  // State: Press Deliveries (Books received from Press)
  const [pressDeliveries, setPressDeliveries] = useState<PressDeliveryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(PRESS_DELIVERIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRESS_DELIVERIES;
  });

  // State: Sales Channels (Dynamic Online & Offline Channels)
  const [channels, setChannels] = useState<ChannelConfig[]>(() => {
    try {
      const saved = localStorage.getItem(CHANNELS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CHANNELS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMatrixBookId, setSelectedMatrixBookId] = useState<string>(books[0]?.id || 'book-1');

  // Input states
  const [entrySelectedDay, setEntrySelectedDay] = useState<number>(1);
  const [entrySelectedBookId, setEntrySelectedBookId] = useState<string>(books[0]?.id || 'book-1');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRecord | null>(null);

  const [isDailyEntryModalOpen, setIsDailyEntryModalOpen] = useState(false);
  const [modalBookId, setModalBookId] = useState<string>(books[0]?.id || 'book-1');

  const [isExcelSyncOpen, setIsExcelSyncOpen] = useState(false);

  // Accounts & Orders Modals
  const [isPressPaymentModalOpen, setIsPressPaymentModalOpen] = useState(false);
  const [isPressOrderModalOpen, setIsPressOrderModalOpen] = useState(false);
  const [pressOrderPreSelectedBookId, setPressOrderPreSelectedBookId] = useState<string | undefined>(undefined);
  const [isPressDeliveryModalOpen, setIsPressDeliveryModalOpen] = useState(false);
  const [pressDeliveryPreSelectedBookId, setPressDeliveryPreSelectedBookId] = useState<string | undefined>(undefined);
  const [isChannelCollectionModalOpen, setIsChannelCollectionModalOpen] = useState(false);
  const [selectedChannelForCollection, setSelectedChannelForCollection] = useState<string | undefined>(undefined);

  // Channel Management Modal
  const [isAddEditChannelOpen, setIsAddEditChannelOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null);
  const [channelModalDefaultType, setChannelModalDefaultType] = useState<ChannelType>('offline');

  // Reset Security Confirmation Modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Single Book Printing Pre-selection & Print Scope routing
  const [reportPreSelectedBookId, setReportPreSelectedBookId] = useState<string | undefined>(undefined);
  const [reportScope, setReportScope] = useState<PrintScope>('all');
  const [reportLibraryFilter, setReportLibraryFilter] = useState<string>('all');

  // File Storage & Notebook Modals & State
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [storedFiles, setStoredFiles] = useState<StoredFileRecord[]>([]);
  const [notebookNotes, setNotebookNotes] = useState<NotebookNoteRecord[]>([]);

  // Auto-save month & year selection
  useEffect(() => {
    try {
      localStorage.setItem(YEAR_STORAGE_KEY, String(selectedYear));
      localStorage.setItem(MONTH_STORAGE_KEY, String(selectedMonth));
    } catch (e) {
      console.error(e);
    }
  }, [selectedYear, selectedMonth]);

  // Startup sync: if localStorage has no books or ledgers, attempt recovery from native browser IndexedDB
  useEffect(() => {
    const hydrateFromIndexedDB = async () => {
      try {
        if (books.length === 0) {
          const currentKey = getMonthlyStorageKey(selectedYear, selectedMonth);
          const idbBooks = await idbGet<string>(currentKey);
          if (idbBooks) {
            const parsed = JSON.parse(idbBooks);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBooks(parsed);
              localStorage.setItem(currentKey, idbBooks);
            }
          } else {
            const idbMaster = await idbGet<string>(MASTER_CATALOG_STORAGE_KEY);
            if (idbMaster) {
              const parsedMaster = JSON.parse(idbMaster);
              if (Array.isArray(parsedMaster) && parsedMaster.length > 0) {
                const fresh = createFreshMonthBooks(parsedMaster);
                setBooks(fresh);
                syncSaveBooks(fresh);
              }
            }
          }
        }

        if (pressPayments.length === 0) {
          const idbPayments = await idbGet<string>(PRESS_PAYMENTS_STORAGE_KEY);
          if (idbPayments) {
            const parsed = JSON.parse(idbPayments);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPressPayments(parsed);
              localStorage.setItem(PRESS_PAYMENTS_STORAGE_KEY, idbPayments);
            }
          }
        }

        if (channelCollections.length === 0) {
          const idbCollections = await idbGet<string>(CHANNEL_COLLECTIONS_STORAGE_KEY);
          if (idbCollections) {
            const parsed = JSON.parse(idbCollections);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setChannelCollections(parsed);
              localStorage.setItem(CHANNEL_COLLECTIONS_STORAGE_KEY, idbCollections);
            }
          }
        }

        // Hydrate Stored Files & Notebook Notes from IndexedDB
        const idbFiles = await idbGet<StoredFileRecord[]>(STORED_FILES_KEY);
        if (Array.isArray(idbFiles)) {
          setStoredFiles(idbFiles);
        }

        const idbNotes = await idbGet<NotebookNoteRecord[]>(NOTEBOOK_NOTES_KEY);
        if (Array.isArray(idbNotes)) {
          setNotebookNotes(idbNotes);
        }
      } catch (e) {
        console.error('IndexedDB hydrate error:', e);
      }
    };

    hydrateFromIndexedDB();
  }, []);

  // 1. Real-time Firebase Firestore Sync for Active Month Books
  useEffect(() => {
    const monthStr = String(selectedMonth).padStart(2, '0');
    const docRef = doc(db, 'publication_data', `books_${selectedYear}_${monthStr}`);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      // Ignore local writes that haven't been committed yet to avoid loops
      if (snapshot.metadata.hasPendingWrites) return;

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data?.books)) {
          if (data.books.length > 0) {
            setBooks(prev => {
              if (JSON.stringify(prev) === JSON.stringify(data.books)) return prev;
              const currentKey = getMonthlyStorageKey(selectedYear, selectedMonth);
              safeLocalStorageSet(currentKey, JSON.stringify(data.books));
              idbSet(currentKey, JSON.stringify(data.books)).catch(() => {});
              return data.books;
            });
          } else if (localStorage.getItem(CLEAN_SLATE_ZERO_KEY) === 'true') {
            setBooks([]);
          }
        }
      }
    }, (error) => {
      console.warn('Firestore books subscription note:', error);
    });

    return () => unsubscribe();
  }, [selectedYear, selectedMonth]);

  // 2. Real-time Firebase Firestore Sync for Ledgers & Configurations
  useEffect(() => {
    // Press Payments Listener
    const unsubPayments = onSnapshot(doc(db, 'publication_data', 'press_payments'), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.payments)) {
          setPressPayments(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.payments)) return prev;
            safeLocalStorageSet(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(data.payments));
            idbSet(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(data.payments)).catch(() => {});
            return data.payments;
          });
        }
      }
    });

    // Press Orders Listener
    const unsubOrders = onSnapshot(doc(db, 'publication_data', 'press_orders'), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.orders)) {
          setPressOrders(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.orders)) return prev;
            safeLocalStorageSet(PRESS_ORDERS_STORAGE_KEY, JSON.stringify(data.orders));
            idbSet(PRESS_ORDERS_STORAGE_KEY, JSON.stringify(data.orders)).catch(() => {});
            return data.orders;
          });
        }
      }
    });

    // Press Deliveries Listener
    const unsubDeliveries = onSnapshot(doc(db, 'publication_data', 'press_deliveries'), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.deliveries)) {
          setPressDeliveries(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.deliveries)) return prev;
            safeLocalStorageSet(PRESS_DELIVERIES_STORAGE_KEY, JSON.stringify(data.deliveries));
            idbSet(PRESS_DELIVERIES_STORAGE_KEY, JSON.stringify(data.deliveries)).catch(() => {});
            return data.deliveries;
          });
        }
      }
    });

    // Channel Collections Listener
    const unsubCollections = onSnapshot(doc(db, 'publication_data', 'channel_collections'), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.collections)) {
          setChannelCollections(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.collections)) return prev;
            safeLocalStorageSet(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(data.collections));
            idbSet(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(data.collections)).catch(() => {});
            return data.collections;
          });
        }
      }
    });

    // Sales Channels Listener
    const unsubChannels = onSnapshot(doc(db, 'publication_data', 'sales_channels'), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.channels) && data.channels.length > 0) {
          setChannels(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.channels)) return prev;
            safeLocalStorageSet(CHANNELS_STORAGE_KEY, JSON.stringify(data.channels));
            return data.channels;
          });
        }
      }
    });

    return () => {
      unsubPayments();
      unsubOrders();
      unsubDeliveries();
      unsubCollections();
      unsubChannels();
    };
  }, []);

  // Auto-save active month's books to its dedicated localStorage key
  useEffect(() => {
    try {
      const key = getMonthlyStorageKey(selectedYear, selectedMonth);
      localStorage.setItem(key, JSON.stringify(books));
    } catch (e) {
      console.error('Failed to save books to localStorage:', e);
    }
  }, [books, selectedYear, selectedMonth]);

  // Auto-save Press Payments
  useEffect(() => {
    try {
      localStorage.setItem(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(pressPayments));
    } catch (e) {
      console.error(e);
    }
  }, [pressPayments]);

  // Auto-save Press Orders
  useEffect(() => {
    try {
      localStorage.setItem(PRESS_ORDERS_STORAGE_KEY, JSON.stringify(pressOrders));
    } catch (e) {
      console.error(e);
    }
  }, [pressOrders]);

  // Auto-save Press Deliveries
  useEffect(() => {
    try {
      localStorage.setItem(PRESS_DELIVERIES_STORAGE_KEY, JSON.stringify(pressDeliveries));
    } catch (e) {
      console.error(e);
    }
  }, [pressDeliveries]);

  // Auto-save Channel Collections
  useEffect(() => {
    try {
      localStorage.setItem(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(channelCollections));
    } catch (e) {
      console.error(e);
    }
  }, [channelCollections]);

  // Auto-save Channels to localStorage only
  useEffect(() => {
    try {
      localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(channels));
    } catch (e) {
      console.error(e);
    }
  }, [channels]);

  // Channel Actions (Add, Edit, Safe Delete)
  const handleOpenAddChannel = (defaultType: ChannelType = 'offline') => {
    setEditingChannel(null);
    setChannelModalDefaultType(defaultType);
    setIsAddEditChannelOpen(true);
  };

  const handleOpenEditChannel = (channel: ChannelConfig) => {
    setEditingChannel(channel);
    setChannelModalDefaultType(channel.type);
    setIsAddEditChannelOpen(true);
  };

  const handleSaveChannel = (channelData: Partial<ChannelConfig>) => {
    if (editingChannel) {
      setChannels(prev => {
        const updated = prev.map(c => (c.id === editingChannel.id ? ({ ...c, ...channelData } as ChannelConfig) : c));
        syncChannelsToFirestore(updated).catch(() => {});
        return updated;
      });
    } else {
      const newId = `channel_${Date.now()}`;
      const newChannel: ChannelConfig = {
        id: newId,
        name: channelData.name || 'নতুন চ্যানেল',
        nameEn: channelData.nameEn || '',
        type: channelData.type || channelModalDefaultType,
        source: channelData.type === 'offline' ? (channelData.source || 'headOffice') : undefined,
        pressId: channelData.pressId,
        address: channelData.address,
        phone: channelData.phone,
        category:
          channelData.category ||
          (channelData.type === 'press'
            ? 'মুদ্রণ ও বাঁধাই প্রেস'
            : channelData.type === 'online'
            ? 'অনলাইন ই-কমার্স'
            : channelData.source === 'press'
            ? 'প্রেস সরাসরি'
            : 'হেড অফিস সরবরাহ'),
        isSystemDefault: false,
      };
      setChannels(prev => {
        const updated = [...prev, newChannel];
        syncChannelsToFirestore(updated).catch(() => {});
        return updated;
      });
    }
    setIsAddEditChannelOpen(false);
    setEditingChannel(null);
  };

  const handleDeleteChannel = (channelId: string) => {
    setChannels(prev => {
      const updated = prev.filter(c => c.id !== channelId);
      syncChannelsToFirestore(updated).catch(() => {});
      return updated;
    });
    setIsAddEditChannelOpen(false);
    setEditingChannel(null);
  };

  // Switch month and year safely
  const handleSelectPeriod = (newMonth: number, newYear: number) => {
    // 1. Save current books before switching
    syncSaveBooks(books, selectedYear, selectedMonth);

    // 2. Load books for target month (with master catalog inheritance)
    const newBooks = loadBooksForPeriod(newYear, newMonth);
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setBooks(newBooks);

    safeLocalStorageSet(YEAR_STORAGE_KEY, String(newYear));
    safeLocalStorageSet(MONTH_STORAGE_KEY, String(newMonth));

    const maxDays = getDaysInMonth(newYear, newMonth);
    setEntrySelectedDay(prev => Math.min(prev, maxDays));
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      handleSelectPeriod(12, selectedYear - 1);
    } else {
      handleSelectPeriod(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      handleSelectPeriod(1, selectedYear + 1);
    } else {
      handleSelectPeriod(selectedMonth + 1, selectedYear);
    }
  };

  // Handle saving daily entry
  const handleSaveDailyEntry = (
    bookId: string,
    day: number,
    data: {
      pressReceipt: number;
      boibari: number;
      rokomari: number;
      wafilife: number;
      othersOnline: number;
      headOfficeOffline: number;
      nilkhet: number;
      sumona: number;
      promise: number;
      joystar: number;
      returns: number;
      marketing: number;
      service: number;
      adVideoMaking: number;
      rd: number;
      gift: number;
      channelSales?: { [channelId: string]: number };
    }
  ) => {
    setBooks(prev => {
      const nextBooks = prev.map(b => {
        if (b.id !== bookId) return b;

        let updatedBook: BookRecord = {
          ...b,
          pressDailyReceipts: { ...b.pressDailyReceipts, [day]: data.pressReceipt },
          boibari: { ...b.boibari, [day]: data.boibari },
          rokomari: { ...b.rokomari, [day]: data.rokomari },
          wafilife: { ...b.wafilife, [day]: data.wafilife },
          othersOnline: { ...b.othersOnline, [day]: data.othersOnline },
          headOfficeSellOffline: { ...b.headOfficeSellOffline, [day]: data.headOfficeOffline },
          nilkhetLibrary: { ...b.nilkhetLibrary, [day]: data.nilkhet },
          sumonaLibrary: { ...b.sumonaLibrary, [day]: data.sumona },
          promiseLibrary: { ...b.promiseLibrary, [day]: data.promise },
          joystarLibrary: { ...b.joystarLibrary, [day]: data.joystar },
          dailyReturns: { ...b.dailyReturns, [day]: data.returns },
          marketing: data.marketing,
          service: data.service,
          adVideoMaking: data.adVideoMaking,
          rd: data.rd,
          gift: data.gift,
          updatedAt: new Date().toISOString(),
        };

        if (data.channelSales) {
          Object.entries(data.channelSales).forEach(([chId, qty]) => {
            updatedBook = setBookChannelDailySales(updatedBook, chId, day, Number(qty) || 0);
          });
        }

        return updatedBook;
      });
      syncSaveBooks(nextBooks);
      return nextBooks;
    });
  };

  // Handle inline cell update from Matrix view
  const handleUpdateDailyCell = (bookId: string, channelKey: string, day: number, value: number) => {
    setBooks(prev => {
      const nextBooks = prev.map(b => {
        if (b.id !== bookId) return b;
        const updated = setBookChannelDailySales(b, channelKey, day, value);
        return {
          ...updated,
          updatedAt: new Date().toISOString(),
        };
      });
      syncSaveBooks(nextBooks);
      return nextBooks;
    });
  };

  // Handle adding or editing a book
  const handleSaveBook = (bookData: Partial<BookRecord>) => {
    try {
      localStorage.removeItem(CLEAN_SLATE_ZERO_KEY);
    } catch {}
    if (editingBook) {
      setBooks(prev => {
        const nextBooks = prev.map(b => (b.id === editingBook.id ? ({ ...b, ...bookData } as BookRecord) : b));
        syncSaveBooks(nextBooks);
        return nextBooks;
      });
    } else {
      const newBook: BookRecord = {
        id: `book-${Date.now()}`,
        sl: books.length + 1,
        bookName: bookData.bookName || 'নতুন বই',
        edition: bookData.edition || '1st Edition',
        publishMonth: bookData.publishMonth || '',
        adCost: Number(bookData.adCost) || 0,
        makingCost: Number(bookData.makingCost) || 0,
        perBookAmount: Number(bookData.perBookAmount) || 0,
        profitPerBook:
          (Number(bookData.perBookAmount) || 0) -
          ((Number(bookData.adCost) || 0) + (Number(bookData.makingCost) || 0)),
        totalOrderFaridBhai: Number(bookData.totalOrderFaridBhai) || 0,
        pressDailyReceipts: {},
        boibari: {},
        rokomari: {},
        wafilife: {},
        othersOnline: {},
        headOfficeSellOffline: {},
        nilkhetLibrary: {},
        sumonaLibrary: {},
        promiseLibrary: {},
        joystarLibrary: {},
        dailyReturns: {},
        marketing: 0,
        service: 0,
        adVideoMaking: 0,
        rd: 0,
        gift: 0,
        remarks: bookData.remarks || '',
        updatedAt: new Date().toISOString(),
      };
      setBooks(prev => {
        const nextBooks = [...prev, newBook];
        syncSaveBooks(nextBooks);
        return nextBooks;
      });
    }
    setIsAddEditOpen(false);
    setEditingBook(null);
  };

  // Handle deleting a book
  const handleDeleteBook = (bookId: string) => {
    const target = books.find(b => b.id === bookId);
    if (!target) return;
    if (window.confirm(`আপনি কি নিশ্চিত যে "${target.bookName}" তালিকা থেকে মুছে ফেলতে চান?`)) {
      setBooks(prev => {
        const nextBooks = prev.filter(b => b.id !== bookId);
        syncSaveBooks(nextBooks);
        return nextBooks;
      });
    }
  };

  // Press Payment Actions
  const handleAddPressPayment = (payment: Omit<PressPaymentRecord, 'id' | 'createdAt'>) => {
    const newRecord: PressPaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPressPayments(prev => {
      const updated = [newRecord, ...prev];
      safeLocalStorageSet(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(updated));
      idbSet(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      syncPressPaymentsToFirestore(updated).catch(() => {});
      return updated;
    });
    setIsPressPaymentModalOpen(false);
  };

  const handleDeletePressPayment = (id: string) => {
    setPressPayments(prev => {
      const updated = prev.filter(p => p.id !== id);
      safeLocalStorageSet(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(updated));
      idbSet(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      syncPressPaymentsToFirestore(updated).catch(() => {});
      return updated;
    });
  };

  // Press Order Actions (Multi-press order management)
  const handleAddPressOrder = (order: Omit<PressOrderRecord, 'id' | 'createdAt'>) => {
    const newRecord: PressOrderRecord = {
      ...order,
      id: `po-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedOrders = [newRecord, ...pressOrders];
    setPressOrders(updatedOrders);
    safeLocalStorageSet(PRESS_ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    idbSet(PRESS_ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders)).catch(() => {});
    syncPressOrdersToFirestore(updatedOrders).catch(() => {});

    // Synchronize the book's totalOrderFaridBhai to the exact sum of its press orders
    setBooks(prev => {
      const nextBooks = prev.map(b => {
        if (b.id !== order.bookId) return b;
        const bookOrders = updatedOrders.filter(po => po.bookId === b.id);
        const newTotal = bookOrders.reduce((sum, o) => sum + (Number(o.orderQuantity) || 0), 0);
        return {
          ...b,
          totalOrderFaridBhai: newTotal,
          updatedAt: new Date().toISOString(),
        };
      });
      syncSaveBooks(nextBooks);
      return nextBooks;
    });
  };

  const handleDeletePressOrder = (id: string) => {
    const orderToDelete = pressOrders.find(o => o.id === id);
    if (!orderToDelete) return;
    const remaining = pressOrders.filter(o => o.id !== id);
    setPressOrders(remaining);
    safeLocalStorageSet(PRESS_ORDERS_STORAGE_KEY, JSON.stringify(remaining));
    idbSet(PRESS_ORDERS_STORAGE_KEY, JSON.stringify(remaining)).catch(() => {});
    syncPressOrdersToFirestore(remaining).catch(() => {});

    // Synchronize the book's totalOrderFaridBhai
    setBooks(prev => {
      const nextBooks = prev.map(b => {
        if (b.id !== orderToDelete.bookId) return b;
        const bookOrders = remaining.filter(po => po.bookId === b.id);
        const newTotal = bookOrders.reduce((sum, o) => sum + (Number(o.orderQuantity) || 0), 0);
        return {
          ...b,
          totalOrderFaridBhai: newTotal,
          updatedAt: new Date().toISOString(),
        };
      });
      syncSaveBooks(nextBooks);
      return nextBooks;
    });
  };

  const handleOpenAddPressOrder = (bookId?: string) => {
    setPressOrderPreSelectedBookId(bookId);
    setIsPressOrderModalOpen(true);
  };

  // Press Delivery (Chalan) Actions (Books received from Press)
  const handleAddPressDelivery = (delivery: Omit<PressDeliveryRecord, 'id' | 'createdAt'>) => {
    const newRecord: PressDeliveryRecord = {
      ...delivery,
      id: `del-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPressDeliveries(prev => {
      const updated = [newRecord, ...prev];
      safeLocalStorageSet(PRESS_DELIVERIES_STORAGE_KEY, JSON.stringify(updated));
      idbSet(PRESS_DELIVERIES_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      syncPressDeliveriesToFirestore(updated).catch(() => {});
      return updated;
    });

    // If delivery date falls in active month, update book's pressDailyReceipts
    try {
      const [delYear, delMonth, delDay] = delivery.deliveryDate.split('-').map(Number);
      if (delYear === selectedYear && delMonth === selectedMonth && delDay >= 1 && delDay <= 31) {
        setBooks(prev => {
          const nextBooks = prev.map(b => {
            if (b.id !== delivery.bookId) return b;
            const currentReceipts = { ...b.pressDailyReceipts };
            currentReceipts[delDay] = (Number(currentReceipts[delDay]) || 0) + Number(delivery.quantity);
            return {
              ...b,
              pressDailyReceipts: currentReceipts,
              updatedAt: new Date().toISOString(),
            };
          });
          syncSaveBooks(nextBooks);
          return nextBooks;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePressDelivery = (id: string) => {
    const deliveryToDelete = pressDeliveries.find(d => d.id === id);
    if (!deliveryToDelete) return;
    setPressDeliveries(prev => {
      const remaining = prev.filter(d => d.id !== id);
      safeLocalStorageSet(PRESS_DELIVERIES_STORAGE_KEY, JSON.stringify(remaining));
      idbSet(PRESS_DELIVERIES_STORAGE_KEY, JSON.stringify(remaining)).catch(() => {});
      syncPressDeliveriesToFirestore(remaining).catch(() => {});
      return remaining;
    });

    // If delivery date falls in active month, reduce book's pressDailyReceipts
    try {
      const [delYear, delMonth, delDay] = deliveryToDelete.deliveryDate.split('-').map(Number);
      if (delYear === selectedYear && delMonth === selectedMonth && delDay >= 1 && delDay <= 31) {
        setBooks(prev => {
          const nextBooks = prev.map(b => {
            if (b.id !== deliveryToDelete.bookId) return b;
            const currentReceipts = { ...b.pressDailyReceipts };
            const currentVal = Number(currentReceipts[delDay]) || 0;
            currentReceipts[delDay] = Math.max(0, currentVal - Number(deliveryToDelete.quantity));
            return {
              ...b,
              pressDailyReceipts: currentReceipts,
              updatedAt: new Date().toISOString(),
            };
          });
          syncSaveBooks(nextBooks);
          return nextBooks;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddPressDelivery = (bookId?: string) => {
    setPressDeliveryPreSelectedBookId(bookId);
    setIsPressDeliveryModalOpen(true);
  };

  // Channel Collection Actions
  const handleAddChannelCollection = (collection: Omit<ChannelCollectionRecord, 'id' | 'createdAt'>) => {
    const newRecord: ChannelCollectionRecord = {
      ...collection,
      id: `col-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setChannelCollections(prev => {
      const updated = [newRecord, ...prev];
      safeLocalStorageSet(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(updated));
      idbSet(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      syncChannelCollectionsToFirestore(updated).catch(() => {});
      return updated;
    });
    setIsChannelCollectionModalOpen(false);
  };

  const handleDeleteChannelCollection = (id: string) => {
    setChannelCollections(prev => {
      const updated = prev.filter(c => c.id !== id);
      safeLocalStorageSet(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(updated));
      idbSet(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      syncChannelCollectionsToFirestore(updated).catch(() => {});
      return updated;
    });
  };

  // Reset all data to clean zero slate (Opens Secure Modal with Math Challenge)
  const handleResetAllData = () => {
    setIsResetConfirmOpen(true);
  };

  const handlePerformActualReset = () => {
    try {
      const keysToPreserve = new Set([
        ZOOM_STORAGE_KEY,
        THEME_STORAGE_KEY,
        LANGUAGE_STORAGE_KEY,
        STORED_FILES_KEY,
        NOTEBOOK_NOTES_KEY,
      ]);

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('biddabari_') && !keysToPreserve.has(k)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(CLEAN_SLATE_ZERO_KEY, 'true');
      
      // Clear publication cache from IndexedDB while preserving stored files & notebook notes
      idbClear().then(() => {
        if (storedFiles.length > 0) idbSet(STORED_FILES_KEY, storedFiles).catch(() => {});
        if (notebookNotes.length > 0) idbSet(NOTEBOOK_NOTES_KEY, notebookNotes).catch(() => {});
      }).catch(() => {});

      resetFirestoreData(selectedYear, selectedMonth).catch(() => {});
    } catch (e) {
      console.error(e);
    }
    setBooks([]);
    setPressOrders([]);
    setPressDeliveries([]);
    setPressPayments([]);
    setChannelCollections([]);
    setChannels(DEFAULT_CHANNELS);
    setIsResetConfirmOpen(false);
  };

  const handleOpenAddChannelCollection = (channelKey?: string) => {
    setSelectedChannelForCollection(channelKey);
    setIsChannelCollectionModalOpen(true);
  };

  // Open triggers
  const handleOpenDailyEntryForBook = (bookId: string) => {
    setModalBookId(bookId);
    setIsDailyEntryModalOpen(true);
  };

  const handleSelectBookForMatrix = (bookId: string) => {
    setSelectedMatrixBookId(bookId);
    setActiveTab('matrix');
  };

  const handleOpenEditBook = (book: BookRecord) => {
    setEditingBook(book);
    setIsAddEditOpen(true);
  };

  const handlePrintSingleBook = (bookId: string) => {
    setReportPreSelectedBookId(bookId);
    setReportScope('all');
    setActiveTab('reports');
  };

  const handleOpenPrintCollectionVouchers = (libraryKey?: string) => {
    setReportScope('collection_vouchers');
    setReportLibraryFilter(libraryKey || 'all');
    setReportPreSelectedBookId(undefined);
    setActiveTab('reports');
  };

  const handleOpenPrintPressVouchers = () => {
    setReportScope('press_vouchers');
    setReportPreSelectedBookId(undefined);
    setActiveTab('reports');
  };

  // Navigation handlers from Period View to Quick Data Entry
  const handleOpenDailyEntryForDay = (day: number) => {
    setEntrySelectedDay(day);
    setActiveTab('entry');
  };

  const handleOpenDailyEntryForBookAndDay = (bookId: string, day: number) => {
    setEntrySelectedBookId(bookId);
    setEntrySelectedDay(day);
    setActiveTab('entry');
  };

  const handleImportBooksSuccess = (result: FullDatabaseImportResult) => {
    try {
      localStorage.removeItem(CLEAN_SLATE_ZERO_KEY);
    } catch {}

    const importedBooks = result.books || [];
    setBooks(importedBooks);
    if (importedBooks.length > 0) {
      setSelectedMatrixBookId(importedBooks[0].id);
      setEntrySelectedBookId(importedBooks[0].id);
      setModalBookId(importedBooks[0].id);
    }
    // Full sync-save to localStorage, IndexedDB, Master Catalog, and Google Cloud Firestore
    syncSaveBooks(importedBooks, selectedYear, selectedMonth);

    // 1. Press Payments
    if (result.pressPayments !== undefined) {
      setPressPayments(result.pressPayments);
      safeLocalStorageSet(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(result.pressPayments));
      idbSet(PRESS_PAYMENTS_STORAGE_KEY, JSON.stringify(result.pressPayments)).catch(() => {});
      syncPressPaymentsToFirestore(result.pressPayments);
    }

    // 2. Press Orders (Editions)
    if (result.pressOrders !== undefined) {
      setPressOrders(result.pressOrders);
      safeLocalStorageSet(PRESS_ORDERS_STORAGE_KEY, JSON.stringify(result.pressOrders));
      idbSet(PRESS_ORDERS_STORAGE_KEY, JSON.stringify(result.pressOrders)).catch(() => {});
      syncPressOrdersToFirestore(result.pressOrders);
    }

    // 3. Press Deliveries (Chalans)
    if (result.pressDeliveries !== undefined) {
      setPressDeliveries(result.pressDeliveries);
      safeLocalStorageSet(PRESS_DELIVERIES_STORAGE_KEY, JSON.stringify(result.pressDeliveries));
      idbSet(PRESS_DELIVERIES_STORAGE_KEY, JSON.stringify(result.pressDeliveries)).catch(() => {});
      syncPressDeliveriesToFirestore(result.pressDeliveries);
    }

    // 4. Channel Collections (Receipts)
    if (result.channelCollections !== undefined) {
      setChannelCollections(result.channelCollections);
      safeLocalStorageSet(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(result.channelCollections));
      idbSet(CHANNEL_COLLECTIONS_STORAGE_KEY, JSON.stringify(result.channelCollections)).catch(() => {});
      syncChannelCollectionsToFirestore(result.channelCollections);
    }

    // 5. Channels Configuration
    if (result.channels !== undefined && result.channels.length > 0) {
      setChannels(result.channels);
      safeLocalStorageSet(CHANNELS_STORAGE_KEY, JSON.stringify(result.channels));
      syncChannelsToFirestore(result.channels);
    }

    // 6. Notebook Notes
    if (result.notebookNotes !== undefined && result.notebookNotes.length > 0) {
      setNotebookNotes(result.notebookNotes);
      idbSet(NOTEBOOK_NOTES_KEY, result.notebookNotes).catch(() => {});
    }
  };

  // Storage & Notebook Handlers
  const handleAddFile = (newFile: Omit<StoredFileRecord, 'id' | 'createdAt'>) => {
    const record: StoredFileRecord = {
      ...newFile,
      id: `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [record, ...storedFiles];
    setStoredFiles(updated);
    idbSet(STORED_FILES_KEY, updated).catch(console.error);
  };

  const handleDeleteFile = (fileId: string) => {
    const updated = storedFiles.filter(f => f.id !== fileId);
    setStoredFiles(updated);
    idbSet(STORED_FILES_KEY, updated).catch(console.error);
  };

  const handleAddNote = (newNote: Omit<NotebookNoteRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const record: NotebookNoteRecord = {
      ...newNote,
      id: `NOTE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [record, ...notebookNotes];
    setNotebookNotes(updated);
    idbSet(NOTEBOOK_NOTES_KEY, updated).catch(console.error);
  };

  const handleUpdateNote = (updatedNote: NotebookNoteRecord) => {
    const updated = notebookNotes.map(n => n.id === updatedNote.id ? updatedNote : n);
    setNotebookNotes(updated);
    idbSet(NOTEBOOK_NOTES_KEY, updated).catch(console.error);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notebookNotes.filter(n => n.id !== noteId);
    setNotebookNotes(updated);
    idbSet(NOTEBOOK_NOTES_KEY, updated).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-zinc-900">
      
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddBook={() => {
          setEditingBook(null);
          setIsAddEditOpen(true);
        }}
        onOpenDailyEntry={() => {
          setActiveTab('entry');
        }}
        onExportExcel={() => exportBooksToExcel(books, selectedMonth, selectedYear, {
          pressPayments,
          pressOrders,
          pressDeliveries,
          channelCollections,
          channels,
          notebookNotes,
        })}
        onOpenImport={() => setIsExcelSyncOpen(true)}
        onResetData={handleResetAllData}
        onPrint={() => {
          setReportPreSelectedBookId(undefined);
          setReportScope('all');
          setActiveTab('reports');
        }}
        bookCount={books.length}
        zoom={uiZoom}
        onSetZoom={setUiZoom}
        onOpenStorage={() => setIsStorageOpen(true)}
        storageCount={storedFiles.length + notebookNotes.length}
        language={language}
        onSetLanguage={setLanguage}
        theme={theme}
        onSetTheme={setTheme}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onSelectPeriod={handleSelectPeriod}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* 1. Main Dashboard */}
        {activeTab === 'dashboard' && (
          <Dashboard
            books={books}
            onSelectBookForMatrix={handleSelectBookForMatrix}
            onOpenDailyEntryForBook={handleOpenDailyEntryForBook}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
            language={language}
            channels={channels}
            onOpenAddChannel={handleOpenAddChannel}
            onOpenEditChannel={handleOpenEditChannel}
          />
        )}

        {/* 2. Daily / Weekly / Monthly / 3-Month / 6-Month / Yearly / Custom Period View */}
        {activeTab === 'period' && (
          <PeriodViewSystem
            books={books}
            onOpenDailyEntryForDay={handleOpenDailyEntryForDay}
            onOpenDailyEntryForBookAndDay={handleOpenDailyEntryForBookAndDay}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
            pressPayments={pressPayments}
            channelCollections={channelCollections}
            language={language}
          />
        )}

        {/* 3. Accounts & Due Ledger (প্রেস হিসাব, প্রেস অর্ডার ম্যানেজমেন্ট ও অনলাইন-অফলাইন ডিউ খতিয়ান) */}
        {activeTab === 'accounts' && (
          <AccountsDueLedger
            books={books}
            pressPayments={pressPayments}
            pressOrders={pressOrders}
            pressDeliveries={pressDeliveries}
            channelCollections={channelCollections}
            onAddPressPayment={() => setIsPressPaymentModalOpen(true)}
            onDeletePressPayment={handleDeletePressPayment}
            onAddPressOrder={handleOpenAddPressOrder}
            onDeletePressOrder={handleDeletePressOrder}
            onAddPressDelivery={handleOpenAddPressDelivery}
            onDeletePressDelivery={handleDeletePressDelivery}
            onAddChannelCollection={handleOpenAddChannelCollection}
            onDeleteChannelCollection={handleDeleteChannelCollection}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            language={language}
            channels={channels}
            onOpenAddChannel={handleOpenAddChannel}
            onOpenEditChannel={handleOpenEditChannel}
            onOpenPrintCollectionVouchers={handleOpenPrintCollectionVouchers}
            onOpenPrintPressVouchers={handleOpenPrintPressVouchers}
          />
        )}

        {/* 4. Simple Data Input System */}
        {activeTab === 'entry' && (
          <QuickDataEntry
            books={books}
            initialBookId={entrySelectedBookId}
            initialDay={entrySelectedDay}
            onSaveDailyEntry={handleSaveDailyEntry}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
            language={language}
            channels={channels}
          />
        )}

        {/* 5. Books Master Table */}
        {activeTab === 'books' && (
          <BooksTable
            books={books}
            onSelectBookForMatrix={handleSelectBookForMatrix}
            onOpenDailyEntryForBook={handleOpenDailyEntryForBook}
            onOpenEditBook={handleOpenEditBook}
            onDeleteBook={handleDeleteBook}
            onPrintSingleBook={handlePrintSingleBook}
            onOpenAddBook={() => {
              setEditingBook(null);
              setIsAddEditOpen(true);
            }}
            language={language}
          />
        )}

        {/* 6. 31-Day Matrix View */}
        {activeTab === 'matrix' && (
          <BookDetailMatrix
            books={books}
            selectedBookId={selectedMatrixBookId}
            onSelectBook={setSelectedMatrixBookId}
            onUpdateDailyCell={handleUpdateDailyCell}
            onBackToDashboard={() => setActiveTab('dashboard')}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
            language={language}
            channels={channels}
          />
        )}

        {/* 7. Executive Reports & Print */}
        {activeTab === 'reports' && (
          <PrintableReport 
            books={books} 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            daysInMonth={daysInMonth}
            pressPayments={pressPayments}
            pressOrders={pressOrders}
            pressDeliveries={pressDeliveries}
            channelCollections={channelCollections}
            initialSelectedBookId={reportPreSelectedBookId}
            initialScope={reportScope}
            initialLibraryFilter={reportLibraryFilter}
            language={language}
            channels={channels}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-zinc-200/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2 text-center sm:text-left">
          <div>
            © {selectedYear} <b>{language === 'bn' ? 'বিদ্যাবাড়ি পাবলিকেশন (Biddabari Publication)' : 'Biddabari Publication'}</b>. {language === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'} ({formatMonthYearBengali(selectedMonth, selectedYear, language)})
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span>{language === 'bn' ? 'প্রেস পেমেন্ট ও চ্যানেল ডিউ ট্র্যাকিং সক্রিয়' : 'Press & Channel Tracking Active'}</span>
            <span className="hidden sm:inline">•</span>
            <button
              onClick={() => exportBooksToExcel(books, selectedMonth, selectedYear)}
              className="text-zinc-900 hover:underline font-semibold"
            >
              {language === 'bn' ? 'এক্সেল এক্সপোর্ট' : 'Excel Export'}
            </button>
            <span>•</span>
            <a
              href="/biddabari_publication_books_data.xlsx"
              download="biddabari publication all books data.xlsx"
              className="text-zinc-600 hover:underline"
            >
              {language === 'bn' ? 'মূল ফাইল ডাউনলোড' : 'Download Original File'}
            </a>
          </div>
        </div>
      </footer>

      {/* Popups / Modals */}
      <DailyEntryModal
        isOpen={isDailyEntryModalOpen}
        onClose={() => setIsDailyEntryModalOpen(false)}
        books={books}
        initialBookId={modalBookId}
        onSaveDailyEntry={handleSaveDailyEntry}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        daysInMonth={daysInMonth}
        language={language}
        channels={channels}
      />

      <AddEditBookModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingBook(null);
        }}
        editingBook={editingBook}
        onSaveBook={handleSaveBook}
        nextSl={books.length + 1}
        language={language}
      />

      <ExcelSyncModal
        isOpen={isExcelSyncOpen}
        onClose={() => setIsExcelSyncOpen(false)}
        books={books}
        pressPayments={pressPayments}
        pressOrders={pressOrders}
        pressDeliveries={pressDeliveries}
        channelCollections={channelCollections}
        channels={channels}
        notebookNotes={notebookNotes}
        onImportSuccess={handleImportBooksSuccess}
        language={language}
      />

      {/* Press Payment Voucher Modal */}
      <AddPressPaymentModal
        isOpen={isPressPaymentModalOpen}
        onClose={() => setIsPressPaymentModalOpen(false)}
        books={books}
        channels={channels}
        onSavePayment={handleAddPressPayment}
        language={language}
      />

      {/* Press Order Modal (Multi-order / Edition lot management) */}
      <AddPressOrderModal
        isOpen={isPressOrderModalOpen}
        onClose={() => setIsPressOrderModalOpen(false)}
        books={books}
        channels={channels}
        onAddOrder={handleAddPressOrder}
        preSelectedBookId={pressOrderPreSelectedBookId}
        language={language}
      />

      {/* Press Delivery Modal (Received books chalan voucher) */}
      <AddPressDeliveryModal
        isOpen={isPressDeliveryModalOpen}
        onClose={() => setIsPressDeliveryModalOpen(false)}
        books={books}
        channels={channels}
        onAddDelivery={handleAddPressDelivery}
        preSelectedBookId={pressDeliveryPreSelectedBookId}
        language={language}
      />

      {/* Channel Collection Receipt Modal */}
      <AddChannelCollectionModal
        isOpen={isChannelCollectionModalOpen}
        onClose={() => setIsChannelCollectionModalOpen(false)}
        onSaveCollection={handleAddChannelCollection}
        initialChannelKey={selectedChannelForCollection}
        language={language}
      />

      {/* Add / Edit Channel Modal (With Safe Deletion Guard) */}
      <AddEditChannelModal
        isOpen={isAddEditChannelOpen}
        onClose={() => {
          setIsAddEditChannelOpen(false);
          setEditingChannel(null);
        }}
        editingChannel={editingChannel}
        defaultType={channelModalDefaultType}
        onSaveChannel={handleSaveChannel}
        onDeleteChannel={handleDeleteChannel}
        books={books}
        channelCollections={channelCollections}
        channels={channels}
        language={language}
      />

      {/* System Reset Security Verification Modal (Math Equation + I Understand Checkbox) */}
      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirmReset={handlePerformActualReset}
        booksCount={books.length}
        ordersCount={pressOrders.length}
        paymentsCount={pressPayments.length}
        deliveriesCount={pressDeliveries.length}
        collectionsCount={channelCollections.length}
        language={language}
      />

      {/* File Storage & Digital Notebook Modal */}
      <FileStorageModal
        isOpen={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        files={storedFiles}
        notes={notebookNotes}
        onAddFile={handleAddFile}
        onDeleteFile={handleDeleteFile}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        language={language}
      />

    </div>
  );
};

export default App;
