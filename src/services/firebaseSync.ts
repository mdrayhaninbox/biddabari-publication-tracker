import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BookRecord, 
  PressPaymentRecord, 
  PressOrderRecord, 
  PressDeliveryRecord, 
  ChannelCollectionRecord, 
  ChannelConfig 
} from '../types/book';

const COLLECTION_NAME = 'publication_data';

/**
 * Saves books of a specific month and master catalog to Cloud Firestore
 */
export async function syncBooksToFirestore(year: number, month: number, books: BookRecord[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, `books_${year}_${String(month).padStart(2, '0')}`);
    await setDoc(docRef, { books, updatedAt: new Date().toISOString() }, { merge: true });

    if (books.length > 0) {
      const masterCatalog = books.map(b => ({
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
      await setDoc(masterDoc, { books: masterCatalog, updatedAt: new Date().toISOString() }, { merge: true });
    }
  } catch (err) {
    console.error('Firestore syncBooks error:', err);
  }
}

/**
 * Saves press payments to Cloud Firestore
 */
export async function syncPressPaymentsToFirestore(payments: PressPaymentRecord[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, 'press_payments');
    await setDoc(docRef, { payments, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Firestore syncPressPayments error:', err);
  }
}

/**
 * Saves press orders to Cloud Firestore
 */
export async function syncPressOrdersToFirestore(orders: PressOrderRecord[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, 'press_orders');
    await setDoc(docRef, { orders, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Firestore syncPressOrders error:', err);
  }
}

/**
 * Saves press deliveries to Cloud Firestore
 */
export async function syncPressDeliveriesToFirestore(deliveries: PressDeliveryRecord[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, 'press_deliveries');
    await setDoc(docRef, { deliveries, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Firestore syncPressDeliveries error:', err);
  }
}

/**
 * Saves channel collections to Cloud Firestore
 */
export async function syncChannelCollectionsToFirestore(collections: ChannelCollectionRecord[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, 'channel_collections');
    await setDoc(docRef, { collections, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Firestore syncChannelCollections error:', err);
  }
}

/**
 * Saves sales channels to Cloud Firestore
 */
export async function syncChannelsToFirestore(channels: ChannelConfig[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, 'sales_channels');
    await setDoc(docRef, { channels, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Firestore syncChannels error:', err);
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
