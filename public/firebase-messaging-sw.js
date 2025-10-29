// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDp5XZFCJcmXPB-UfpbKp4aosqRTcbm40o",
  authDomain: "tea-time-with-the-word.firebaseapp.com",
  projectId: "tea-time-with-the-word",
  storageBucket: "tea-time-with-the-word.appspot.com",
  messagingSenderId: "995241042465",
  appId: "1:995241042465:web:53a66b5d8edf41ddf57960",
  measurementId: "G-BFN92LJ629"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Tea Time with the Word';
  const notificationOptions = {
    body: payload.notification?.body || 'Your daily scripture is ready',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: payload.data,
    tag: 'daily-scripture',
    requireInteraction: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
