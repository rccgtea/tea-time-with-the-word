import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseThemeService';
import { Scripture } from '../types';

/**
 * Reads today's scripture from Firestore written by the server-side function.
 * Expects a document at `meta/dailyScripture` with keys like `YYYY-MM-DD`.
 */
const SCRIPTURE_TZ =
  import.meta.env.VITE_SCRIPTURE_TIMEZONE || 'America/Denver';
const SCRIPTURE_ENDPOINT =
  import.meta.env.VITE_SCRIPTURE_ENDPOINT ||
  '/api/scripture';

const getTodayString = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: SCRIPTURE_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

const fetchFromFunction = async (): Promise<Scripture> => {
  try {
    const resp = await fetch(SCRIPTURE_ENDPOINT, {
      headers: { 'cache-control': 'no-cache' },
    });
    if (!resp.ok) {
      throw new Error('Unable to fetch today\'s scripture from the server.');
    }
    return (await resp.json()) as Scripture;
  } catch (err) {
    console.error('Failed to fetch scripture via HTTPS function', err);
    throw new Error('Unable to load today\'s scripture right now. Please try again shortly.');
  }
};

export async function getTodaysScriptureFromFirestore(): Promise<Scripture> {
  const today = getTodayString();
  const docRef = doc(db, 'meta', 'dailyScripture');
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return fetchFromFunction();
  }
  const data = snap.data() as Record<string, any>;
  if (!data || !data[today]) {
    return fetchFromFunction();
  }
  return data[today] as Scripture;
}

export default getTodaysScriptureFromFirestore;
