// Quick script to delete today's scripture from Firestore
// Run with: node delete-today-scripture.js

const admin = require('firebase-admin');

// Initialize with service account or default credentials
admin.initializeApp({
  projectId: 'tea-time-with-the-word'
});

const db = admin.firestore();

async function deleteTodayScripture() {
  const today = '2025-11-01'; // Today's date
  
  try {
    const docRef = db.collection('meta').doc('dailyScripture');
    const snap = await docRef.get();
    
    if (snap.exists) {
      const data = snap.data();
      if (data && data[today]) {
        console.log(`Found scripture for ${today}:`, data[today].reference);
        
        // Delete just today's field
        await docRef.update({
          [today]: admin.firestore.FieldValue.delete()
        });
        
        console.log(`✅ Deleted ${today} from Firestore`);
        console.log('The next page load will fetch fresh data from the function with expandedVersions');
      } else {
        console.log(`No scripture found for ${today}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTodayScripture();
