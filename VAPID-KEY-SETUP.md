# 🔔 URGENT: Complete Push Notifications Setup

## ⚠️ Action Required Before Notifications Will Work

Push notifications have been **implemented** but require **one final configuration step** that only you can complete from the Firebase Console.

## Step-by-Step Instructions

### 1. Get Your VAPID Key

1. Go to: https://console.firebase.google.com/project/tea-time-with-the-word/settings/cloudmessaging
2. Scroll down to "Web Push certificates" section
3. Click **"Generate key pair"** button
4. A key will be generated (starts with "B..." and is about 87 characters long)
5. Click the **copy icon** to copy the key

### 2. Update the Code

Open the file: `services/notificationService.ts`

Find this line (around line 18):
```typescript
const VAPID_KEY = 'BK7YourVapidKeyHere'; // TODO: Replace with actual VAPID key
```

Replace it with your actual VAPID key:
```typescript
const VAPID_KEY = 'BYourActualKeyFromFirebaseConsole'; // Paste the key you copied
```

### 3. Rebuild and Redeploy

```powershell
npm run build
npx firebase deploy --only hosting
```

### 4. Test It!

1. Visit: https://tea-time-with-the-word.web.app
2. You should see a "🔔 Notify Me" button
3. Click it
4. Grant permission when browser asks
5. You should see: "🔔 Notifications enabled! You'll receive daily scripture notifications at midnight MST."
6. Check Firestore > fcmTokens collection - your token should appear there

## What Happens After Setup

- **Midnight MST every night:** All users with notifications enabled receive a push notification
- **Notification content:** "📖 Today's Scripture is Ready! [Theme] - [Reference]"
- **Click notification:** Opens the app to today's scripture
- **Automatic cleanup:** Invalid/expired tokens are automatically removed

## Firestore Collections

A new collection `fcmTokens` will be created automatically when the first user enables notifications.

Each document structure:
```javascript
{
  token: "eXampleFCMToken123...",  // Unique device identifier
  createdAt: "2025-10-28T10:30:00.000Z",
  updatedAt: "2025-10-28T10:30:00.000Z"
}
```

## Troubleshooting

**"TypeError: Cannot read properties of undefined"**
→ You haven't set the VAPID key yet. Follow steps above.

**"Notification permission denied"**
→ User clicked "Block". They need to clear site data and try again.

**Button doesn't show**
→ User already granted permission (notifications enabled)

**No notifications received**
→ Check:
1. VAPID key is correct
2. Token exists in Firestore fcmTokens collection  
3. Cloud Function logs for errors
4. Browser is supported (see PUSH-NOTIFICATIONS-SETUP.md)

## Browser Compatibility

| Platform | Support |
|----------|---------|
| Desktop Chrome/Edge | ✅ Full |
| Desktop Firefox | ✅ Full |
| Android Chrome | ✅ Full |
| iOS Safari (PWA) | ⚠️ Limited |
| iOS Chrome | ❌ Not supported |

## Files Modified for Notifications

- ✅ `public/firebase-messaging-sw.js` (service worker)
- ✅ `services/notificationService.ts` (notification logic)
- ✅ `components/UserView.tsx` (UI button)
- ✅ `functions/src/index.ts` (backend notification sending)

## Everything Else Is Done!

✅ Service worker created
✅ Frontend code written
✅ Backend function ready
✅ UI button added
✅ Code deployed to Firebase

**Only missing:** Your VAPID key in `notificationService.ts`

Once you add it and redeploy, notifications will work! 🎉

---

**Questions?** Contact tech@rccgtea.org
