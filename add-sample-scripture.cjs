const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'tea-time-with-the-word'
});

const db = admin.firestore();

async function addSampleScripture() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  
  const sampleData = {
    [today]: {
      title: "The Eagles Ark",
      passages: [
        "Isaiah 40:31 - But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."
      ],
      reflection: "Today, let us remember that in our waiting upon the Lord, we find our strength renewed. Like eagles rising on the wind, we too can rise above our challenges through faith."
    }
  };

  try {
    await db.collection('meta').doc('dailyScripture').set(sampleData, { merge: true });
    console.log('✅ Sample scripture added successfully for', today);
  } catch (error) {
    console.error('❌ Error adding scripture:', error);
  }
}

addSampleScripture().then(() => process.exit(0));
