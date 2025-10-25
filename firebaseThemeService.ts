import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const THEME_DOC_ID = 'themes'; // Document ID used for storing themes

export async function fetchThemes() {
  const docRef = doc(db, 'meta', THEME_DOC_ID);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as Record<string, string>) : {};
}

export async function setThemeForMonthRemote(month: string, theme: string) {
  const docRef = doc(db, 'meta', THEME_DOC_ID);
  const existingSnap = await getDoc(docRef);
  const existingData = existingSnap.exists() ? (existingSnap.data() as Record<string, string>) : {};
  if (theme) {
    existingData[month] = theme;
  } else {
    delete existingData[month];
  }
  await setDoc(docRef, existingData);
  return existingData;
}

// Export db so other client services can read Firestore (re-uses same initialized app)
export { db };
