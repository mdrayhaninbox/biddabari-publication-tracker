import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BookRecord, 
  PressPaymentRecord, 
  PressOrderRecord, 
  PressDeliveryRecord, 
  ChannelCollectionRecord, 
  ChannelConfig,
  DEFAULT_BOOK_CATEGORIES,
  getEffectiveChannels
} from '../types/book';
import { StoredFileRecord, NotebookNoteRecord } from '../types/storage';

const COLLECTION_NAME = 'publication_data';

/**
 * Removes any undefined fields or non-serializable properties for safe Firestore storage
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

let booksDebounceTimer: any = null;

/**
 * Saves books of a specific month and master catalog to Cloud Firestore
 */
export async function syncBooksToFirestore(year: number, month: number, books: BookRecord[]): Promise<void> {
  if (booksDebounceTimer) {
    clearTimeout(booksDebounceTimer);
  }

  return new Promise((resolve) => {
    booksDebounceTimer = setTimeout(async () => {
      try {
        const cleanBooks = sanitizeForFirestore(books);
        const docRef = doc(db, COLLECTION_NAME, `books_${year}_${String(month).padStart(2, '0')}`);
        await setDoc(docRef, { books: cleanBooks, updatedAt: new Date().toISOString() });

        if (cleanBooks.length > 0) {
          const masterCatalog = cleanBooks.map(b => ({
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
          const masterDoc = doc(db, COLLECTION_NAME, 'master_catalog');
          await setDoc(masterDoc, { books: masterCatalog, updatedAt: new Date().toISOString() });
        }
        resolve();
      } catch (err) {
        console.error('Firestore syncBooks error:', err);
        resolve();
      }
    }, 150);
  });
}

/**
 * Saves press payments to Cloud Firestore
 */
export async function syncPressPaymentsToFirestore(payments: PressPaymentRecord[]): Promise<void> {
  try {
    const cleanPayments = sanitizeForFirestore(payments);
    const docRef = doc(db, COLLECTION_NAME, 'press_payments');
    await setDoc(docRef, { payments: cleanPayments, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Firestore syncPressPayments error:', err);
  }
}

/**
 * Saves press orders to Cloud Firestore
 */
export async function syncPressOrdersToFirestore(orders: PressOrderRecord[]): Promise<void> {
  try {
    const cleanOrders = sanitizeForFirestore(orders);
    const docRef = doc(db, COLLECTION_NAME, 'press_orders');
    await setDoc(docRef, { orders: cleanOrders, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Firestore syncPressOrders error:', err);
  }
}

/**
 * Saves press deliveries to Cloud Firestore
 */
export async function syncPressDeliveriesToFirestore(deliveries: PressDeliveryRecord[]): Promise<void> {
  try {
    const cleanDeliveries = sanitizeForFirestore(deliveries);
    const docRef = doc(db, COLLECTION_NAME, 'press_deliveries');
    await setDoc(docRef, { deliveries: cleanDeliveries, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Firestore syncPressDeliveries error:', err);
  }
}

/**
 * Saves channel collections to Cloud Firestore
 */
export async function syncChannelCollectionsToFirestore(collections: ChannelCollectionRecord[]): Promise<void> {
  try {
    const cleanCollections = sanitizeForFirestore(collections);
    const docRef = doc(db, COLLECTION_NAME, 'channel_collections');
    await setDoc(docRef, { collections: cleanCollections, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Firestore syncChannelCollections error:', err);
  }
}

/**
 * Saves sales channels to Cloud Firestore
 */
export async function syncChannelsToFirestore(channels: ChannelConfig[]): Promise<void> {
  try {
    const effective = getEffectiveChannels(channels);
    const cleanChannels = sanitizeForFirestore(effective);
    const docRef = doc(db, COLLECTION_NAME, 'sales_channels');
    await setDoc(docRef, { channels: cleanChannels, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Firestore syncChannels error:', err);
  }
}

/**
 * Saves book categories to Cloud Firestore
 */
export async function syncBookCategoriesToFirestore(categories: string[]): Promise<void> {
  try {
    const cleanCategories = sanitizeForFirestore(categories);
    const docRef = doc(db, COLLECTION_NAME, 'book_categories');
    await setDoc(docRef, { categories: cleanCategories, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Firestore syncBookCategories error:', err);
  }
}

/**
 * Saves publication notebook notes to Cloud Firestore
 */
export async function syncNotebookNotesToFirestore(notes: NotebookNoteRecord[]): Promise<void> {
  try {
    const cleanNotes = sanitizeForFirestore(notes);
    const docRef = doc(db, COLLECTION_NAME, 'notebook_notes');
    await setDoc(docRef, { notes: cleanNotes, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Firestore syncNotebookNotes error:', err);
  }
}

const FILES_COLLECTION = 'publication_stored_files';
const CHUNK_SIZE = 600000; // ~600KB base64 chunk to safely stay under Firestore 1MB limit

/**
 * Saves a stored file to Cloud Firestore (with auto-chunking if > 600KB)
 */
export async function saveStoredFileToFirestore(file: StoredFileRecord): Promise<void> {
  try {
    const cleanFile = sanitizeForFirestore(file);
    const fileDocRef = doc(db, FILES_COLLECTION, cleanFile.id);

    if (cleanFile.dataUrl.length <= CHUNK_SIZE) {
      await setDoc(fileDocRef, {
        ...cleanFile,
        isChunked: false,
        totalChunks: 1,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Large file: chunk dataUrl
      const chunks: string[] = [];
      for (let i = 0; i < cleanFile.dataUrl.length; i += CHUNK_SIZE) {
        chunks.push(cleanFile.dataUrl.substring(i, i + CHUNK_SIZE));
      }

      // Write master file metadata
      await setDoc(fileDocRef, {
        id: cleanFile.id,
        name: cleanFile.name,
        size: cleanFile.size,
        type: cleanFile.type,
        category: cleanFile.category,
        notes: cleanFile.notes || '',
        createdAt: cleanFile.createdAt,
        isChunked: true,
        totalChunks: chunks.length,
        updatedAt: new Date().toISOString(),
      });

      // Write chunk sub-docs
      const chunkPromises = chunks.map((chunk, idx) =>
        setDoc(doc(db, FILES_COLLECTION, `${cleanFile.id}_chk_${idx}`), {
          parentFileId: cleanFile.id,
          chunkIndex: idx,
          chunkData: chunk,
        })
      );
      await Promise.all(chunkPromises);
    }
  } catch (err) {
    console.error('Firestore saveStoredFile error:', err);
  }
}

/**
 * Deletes a stored file from Cloud Firestore (and its chunks if any)
 */
export async function deleteStoredFileFromFirestore(fileId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, FILES_COLLECTION, fileId));
    // Clean up any chunks if present (up to 50 chunks = ~30MB capacity)
    const chunkDeletes: Promise<void>[] = [];
    for (let i = 0; i < 50; i++) {
      chunkDeletes.push(deleteDoc(doc(db, FILES_COLLECTION, `${fileId}_chk_${i}`)).catch(() => {}));
    }
    await Promise.all(chunkDeletes);
  } catch (err) {
    console.error('Firestore deleteStoredFile error:', err);
  }
}

/**
 * Reassembles all stored files from Firestore
 */
export async function fetchStoredFilesFromFirestore(): Promise<StoredFileRecord[]> {
  try {
    const colRef = collection(db, FILES_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];

    const fileDocs: any[] = [];
    const chunksMap = new Map<string, { chunkIndex: number; chunkData: string }[]>();

    snapshot.docs.forEach(d => {
      const data = d.data();
      if (d.id.includes('_chk_')) {
        const parentId = data.parentFileId;
        if (!chunksMap.has(parentId)) chunksMap.set(parentId, []);
        chunksMap.get(parentId)!.push({
          chunkIndex: data.chunkIndex || 0,
          chunkData: data.chunkData || '',
        });
      } else {
        fileDocs.push(data);
      }
    });

    const fullFiles: StoredFileRecord[] = fileDocs.map(f => {
      if (f.isChunked) {
        const parts = chunksMap.get(f.id) || [];
        parts.sort((a, b) => a.chunkIndex - b.chunkIndex);
        const fullDataUrl = parts.map(p => p.chunkData).join('');
        return {
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          category: f.category,
          notes: f.notes,
          dataUrl: fullDataUrl || f.dataUrl || '',
          createdAt: f.createdAt,
        };
      }
      return {
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        category: f.category,
        notes: f.notes,
        dataUrl: f.dataUrl || '',
        createdAt: f.createdAt,
      };
    });

    // Sort newest first
    fullFiles.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return fullFiles;
  } catch (err) {
    console.error('Firestore fetchStoredFiles error:', err);
    return [];
  }
}

/**
 * One-time fetch of month books or master catalog from Firestore
 */
export async function fetchMonthBooksFromFirestore(year: number, month: number): Promise<BookRecord[] | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, `books_${year}_${String(month).padStart(2, '0')}`);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists() && Array.isArray(snapshot.data()?.books) && snapshot.data().books.length > 0) {
      return snapshot.data().books as BookRecord[];
    }

    const masterDoc = doc(db, COLLECTION_NAME, 'master_catalog');
    const masterSnap = await getDoc(masterDoc);
    if (masterSnap.exists() && Array.isArray(masterSnap.data()?.books) && masterSnap.data().books.length > 0) {
      return masterSnap.data().books as BookRecord[];
    }
    return null;
  } catch (err) {
    console.error('Firestore fetchMonthBooks error:', err);
    return null;
  }
}

/**
 * Resets Firestore data for all documents on intentional reset
 */
export async function resetFirestoreData(year?: number, month?: number): Promise<void> {
  try {
    const promises = [
      setDoc(doc(db, COLLECTION_NAME, 'master_catalog'), { books: [], updatedAt: new Date().toISOString() }),
      setDoc(doc(db, COLLECTION_NAME, 'press_payments'), { payments: [], updatedAt: new Date().toISOString() }),
      setDoc(doc(db, COLLECTION_NAME, 'press_orders'), { orders: [], updatedAt: new Date().toISOString() }),
      setDoc(doc(db, COLLECTION_NAME, 'press_deliveries'), { deliveries: [], updatedAt: new Date().toISOString() }),
      setDoc(doc(db, COLLECTION_NAME, 'channel_collections'), { collections: [], updatedAt: new Date().toISOString() }),
      setDoc(doc(db, COLLECTION_NAME, 'book_categories'), { categories: DEFAULT_BOOK_CATEGORIES, updatedAt: new Date().toISOString() }),
    ];
    if (year && month) {
      promises.push(
        setDoc(doc(db, COLLECTION_NAME, `books_${year}_${String(month).padStart(2, '0')}`), { books: [], updatedAt: new Date().toISOString() })
      );
    }
    await Promise.all(promises);
  } catch (err) {
    console.error('Firestore reset error:', err);
  }
}
