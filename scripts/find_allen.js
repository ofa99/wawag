const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function findAllen() {
    const snapshot = await db.collection('users').where('displayName', '==', 'Allen').get();
    snapshot.forEach(doc => {
        console.log(`Found Allen: ${doc.id}`);
        console.log(doc.data());
    });
}

findAllen().catch(console.error);
