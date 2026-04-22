
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC4zxMsvEvBaWrxzezUaHcnVQqhEHjzfAk",
  authDomain: "studio-8965989657-abdd6.firebaseapp.com",
  projectId: "studio-8965989657-abdd6",
  storageBucket: "studio-8965989657-abdd6.firebasestorage.app",
  messagingSenderId: "118933055135",
  appId: "1:118933055135:web:4e7dd7d468db7d9635e4aa",
  measurementId: "G-XXXXXXXXXX"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented-state') {
      console.warn('Firestore persistence failed: Browser not supported');
    } else {
      console.error('Firestore persistence error:', err);
    }
  });
}

export const initializeFirebase = () => {
  return { app, firestore: db, auth };
};
