# Push Notifications Setup Guide

## Overview
Push notifications have been implemented to notify users when new daily scriptures are available.

## Configuration Required

### 1. Generate VAPID Key (Web Push Certificate)

**IMPORTANT:** Before push notifications will work, you need to generate a VAPID key from Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **tea-time-with-the-word**
3. Click the ⚙️ (Settings) icon → **Project settings**
4. Click the **Cloud Messaging** tab
5. Scroll to **Web Push certificates** section
6. Click **Generate key pair**
7. Copy the generated key (starts with "B...")

### 2. Update the VAPID Key in Code

Open `services/notificationService.ts` and replace this line:

```typescript
const VAPID_KEY = 'BK7YourVapidKeyHere'; // TODO: Replace with actual VAPID key
```

With your actual VAPID key:

```typescript
const VAPID_KEY = 'BYourActualVapidKeyFromFirebaseConsole';
```

### 3. Rebuild and Redeploy

After updating the VAPID key:

```powershell
npm run build
npx firebase deploy
```

## How It Works

### User Experience

1. **First Visit:**
   - User sees "🔔 Enable Notifications" button
   - Clicks button → Browser asks for permission
   - Accepts → Token saved, notifications enabled

2. **Daily Notifications:**
   - At midnight MST, new scripture generates
   - All subscribed users receive push notification
   - Notification shows: "📖 Today's Scripture: [Theme] - [Reference]"
   - Click notification → Opens app

3. **Disable:**
   - User can disable via browser settings
   - Or revoke permission in browser

### Technical Flow

```
User clicks "Enable Notifications"
    ↓
Browser requests permission
    ↓
User grants permission
    ↓
Service worker registers
    ↓
FCM token generated
    ↓
Token saved to Firestore (fcmTokens collection)
    ↓
Midnight MST: Scripture generates
    ↓
Cloud Function fetches all FCM tokens
    ↓
Sends notification to all tokens via FCM
    ↓
Users receive notification
```

## Firestore Structure

### Collection: `fcmTokens`
Each document represents one device/browser:

```javascript
{
  token: "eXampleFCMToken123...",
  createdAt: "2025-10-28T10:30:00.000Z",
  updatedAt: "2025-10-28T10:30:00.000Z"
}
```

Document ID = FCM token (auto-generated unique string)

## Files Added/Modified

### New Files:
- `public/firebase-messaging-sw.js` - Service worker for background notifications
- `services/notificationService.ts` - Frontend notification management
- `PUSH-NOTIFICATIONS-SETUP.md` - This file

### Modified Files:
- `components/UserView.tsx` - Added "Enable Notifications" button
- `functions/src/index.ts` - Added notification sending to `scheduledDailyScripture`

## Testing

### Test Locally:
1. Run `npm run dev`
2. Click "Enable Notifications"
3. Grant permission
4. Check browser console for "FCM Token: ..."
5. Check Firestore for token in `fcmTokens` collection

### Test Notifications:
You can manually send a test notification from Firebase Console:
1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter title/body
4. Click "Send test message"
5. Paste your FCM token
6. Click "Test"

## Platform Support

| Platform | Browser | Support |
|----------|---------|---------|
| Windows | Chrome/Edge | ✅ Full |
| Windows | Firefox | ✅ Full |
| macOS | Chrome/Edge | ✅ Full |
| macOS | Safari | ⚠️ Limited |
| Android | Chrome | ✅ Full |
| Android | Firefox | ✅ Full |
| iOS | Safari | ⚠️ PWA only |
| iOS | Chrome | ❌ No |

**Note:** iOS Safari only supports push notifications when the app is "installed" (added to home screen as a PWA).

## Troubleshooting

### "Permission denied"
- User clicked "Block" on permission prompt
- Solution: Clear site data and try again, or change in browser settings

### "Service worker registration failed"
- Check browser console for errors
- Ensure `firebase-messaging-sw.js` is in the `public` folder
- Verify HTTPS (required for service workers)

### "No token generated"
- Verify VAPID key is correct
- Check browser console for Firebase errors
- Ensure notifications are not blocked globally in browser

### "Notifications not received"
- Verify token exists in Firestore `fcmTokens` collection
- Check Cloud Function logs for errors
- Test with Firebase Console test message first

## Privacy & Permissions

- **What we store:** Only the FCM token (device identifier)
- **No personal data:** We don't store names, emails, or locations
- **Revocable:** Users can disable at any time via browser settings
- **Automatic cleanup:** Tokens expire automatically if browser is uninstalled

## Cost

- **Free tier:** Firebase Cloud Messaging is completely free
- **No limits:** Unlimited notifications on Firebase free plan

## Next Steps

1. ✅ Generate VAPID key from Firebase Console
2. ✅ Update `notificationService.ts` with VAPID key
3. ✅ Test locally
4. ✅ Deploy to production
5. ✅ Monitor FCM tokens in Firestore
6. ✅ Test notification delivery at midnight MST

---

**Last Updated:** October 28, 2025  
**Contact:** tech@rccgtea.org
