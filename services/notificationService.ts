import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDp5XZFCJcmXPB-UfpbKp4aosqRTcbm40o",
  authDomain: "tea-time-with-the-word.firebaseapp.com",
  projectId: "tea-time-with-the-word",
  storageBucket: "tea-time-with-the-word.appspot.com",
  messagingSenderId: "995241042465",
  appId: "1:995241042465:web:53a66b5d8edf41ddf57960",
  measurementId: "G-BFN92LJ629",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// VAPID key for web push (Web Push certificate from Firebase Console)
const VAPID_KEY = 'BOMCfHHllgWMiODFgXe59tq_d_vOXz-E6Dlwasmj1snyLkZa_0Sz8A2ZZ0UgyzurChC6g3N3J7qQDOsDfpGC3Q8';

let messaging: any = null;

// Initialize messaging only in browser environment
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
  }
}

/**
 * Request notification permission and get FCM token
 * @returns FCM token if successful, null otherwise
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('Firebase Messaging not available');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service worker registered:', registration);

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('FCM Token:', token);
      await saveTokenToFirestore(token);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

/**
 * Save FCM token to Firestore
 */
async function saveTokenToFirestore(token: string): Promise<void> {
  try {
    const tokenDoc = doc(db, 'fcmTokens', token);
    await setDoc(tokenDoc, {
      token,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('Token saved to Firestore');
  } catch (error) {
    console.error('Error saving token to Firestore:', error);
  }
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return Notification.permission === 'granted';
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: any) => void): void {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}

/**
 * Remove FCM token (disable notifications)
 */
export async function disableNotifications(token: string): Promise<void> {
  try {
    // In a production app, you might want to delete the token from Firestore
    // For now, we'll just log it
    console.log('Notifications disabled for token:', token);
  } catch (error) {
    console.error('Error disabling notifications:', error);
  }
}
