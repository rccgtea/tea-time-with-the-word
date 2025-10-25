import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDp5XZFCJcmXPB-UfpbKp4aosqRTcbm40o",
  authDomain: "tea-time-with-the-word.firebaseapp.com",
  projectId: "tea-time-with-the-word",
  storageBucket: "tea-time-with-the-word.appspot.com",
  messagingSenderId: "995241042465",
  appId: "1:995241042465:web:53a66b5d8edf41ddf57960",
  measurementId: "G-BFN92LJ629",
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
