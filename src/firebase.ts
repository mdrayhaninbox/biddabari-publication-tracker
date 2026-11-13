import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "biddabari-pub-cloud",
  appId: "1:921883409734:web:54e646a07f83cc87693947",
  storageBucket: "biddabari-pub-cloud.firebasestorage.app",
  apiKey: "AIzaSyBL0gUz04XazK7iryDleF7pLWw4pL6SgQ4",
  authDomain: "biddabari-pub-cloud.firebaseapp.com",
  messagingSenderId: "921883409734",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Enable offline persistence so it works even without internet
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore offline persistence: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore offline persistence not supported in this browser');
    }
  });
}
