import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseThemeService';
import { Scripture } from '../types';

/**
 * Reads today's scripture from Firestore written by the server-side function.
 * Expects a document at `meta/dailyScripture` with keys like `YYYY-MM-DD`.
 */
export async function getTodaysScriptureFromFirestore(): Promise<Scripture> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const docRef = doc(db, 'meta', 'dailyScripture');
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Daily scripture doc not found in Firestore. Have you deployed the Cloud Function?');
  }
  const data = snap.data() as Record<string, any>;
  if (!data || !data[today]) {
    throw new Error('Today\'s scripture is not yet available. The scheduled job may not have run.');
  }
  return data[today] as Scripture;
}

export default getTodaysScriptureFromFirestore;
