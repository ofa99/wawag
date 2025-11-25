const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkGifts() {
    console.log("=== Checking Gifts ===");
    const snapshot = await db.collection('gifts').get();

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Gift: ${data.name} (ID: ${doc.id})`);
        console.log(`- cost: ${data.cost} (${typeof data.cost})`);
        console.log(`- stock: ${data.stock}`);
        console.log("-------------------");
    });
}

checkGifts().catch(console.error);
