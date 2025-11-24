const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkCode() {
    const codeToCheck = 'WAWAG-58B65488';

    console.log(`\n=== Checking code: ${codeToCheck} ===\n`);

    const snapshot = await db.collection('codes')
        .where('codeId', '==', codeToCheck)
        .get();

    if (snapshot.empty) {
        console.log('❌ Code NOT FOUND in database');
    } else {
        console.log('✅ Code FOUND!');
        snapshot.forEach(doc => {
            console.log(`\nDocument ID: ${doc.id}`);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
        });
    }
}

checkCode().catch(console.error);
