const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function inspect() {
    console.log("--- Inspecting Codes ---");
    const codesSnapshot = await db.collection('codes').limit(1).get();
    if (codesSnapshot.empty) {
        console.log("No codes found.");
    } else {
        codesSnapshot.forEach(doc => {
            console.log(`Code ID: ${doc.id}`);
            console.log(doc.data());
        });
    }

    console.log("\n--- Inspecting Users ---");
    const usersSnapshot = await db.collection('users').limit(1).get();
    if (usersSnapshot.empty) {
        console.log("No users found.");
    } else {
        usersSnapshot.forEach(doc => {
            console.log(`User ID: ${doc.id}`);
            console.log(doc.data());
        });
    }
}

inspect().catch(console.error);
