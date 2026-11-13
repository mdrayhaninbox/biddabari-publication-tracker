import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "biddabari-pub-tracker",
  appId: "1:14043126876:web:620aea365a3cc21d295a99",
  storageBucket: "biddabari-pub-tracker.firebasestorage.app",
  apiKey: "AIzaSyBTTsZA5W2xKeJ99dgirx9Klj2tbaRACCI",
  authDomain: "biddabari-pub-tracker.firebaseapp.com",
  messagingSenderId: "14043126876",
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
