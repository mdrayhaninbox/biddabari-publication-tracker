/**
 * Biddabari Browser Database (IndexedDB) Adapter
 * Provides robust, quota-free persistent storage inside Firefox, Chrome, Edge, and Safari.
 * Works seamlessly alongside localStorage for maximum speed and zero data loss.
 */

const DB_NAME = 'biddabari_publication_db';
const DB_VERSION = 1;
const STORE_NAME = 'publication_records';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Save key-value pair to browser's native database (IndexedDB)
 */
export async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB save failed for key:', key, err);
  }
}

/**
 * Retrieve value by key from browser's native database (IndexedDB)
 */
export async function idbGet<T = any>(key: string): Promise<T | undefined> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB get failed for key:', key, err);
    return undefined;
  }
}

/**
 * Clear all data in browser's native database (IndexedDB)
 */
export async function idbClear(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB clear failed:', err);
  }
}
