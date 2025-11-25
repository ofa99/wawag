const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkUsers() {
    console.log("=== Checking Users Points Fields ===");
    const snapshot = await db.collection('users').limit(10).get();

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`User: ${data.displayName || data.email || doc.id}`);
        console.log(`- points: ${data.points} (${typeof data.points})`);
        console.log(`- totalPointsEarned: ${data.totalPointsEarned} (${typeof data.totalPointsEarned})`);
        console.log("-------------------");
    });
}

checkUsers().catch(console.error);
