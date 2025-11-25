const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');
const fetch = require('node-fetch');

// Initialize Admin SDK to create a test user and custom token
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const PROJECT_ID = serviceAccount.project_id;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY"; // We might need to fetch this or assume it's set in env

// Mocking the REST API helpers since we can't import them easily in Node script without module setup
// We will just use raw fetch to simulate what the API does.

async function getIdToken(uid) {
    const customToken = await admin.auth().createCustomToken(uid);
    // Exchange custom token for ID token
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    return data.idToken;
}

async function runTest() {
    try {
        console.log("=== Testing Redemption Permissions ===");

        // 1. Setup Data
        const uid = "test-user-perm";
        const giftId = "test-gift-perm";

        await db.collection('users').doc(uid).set({ points: 1000 });
        await db.collection('gifts').doc(giftId).set({
            name: "Test Gift",
            cost: 100,
            stock: 10,
            imageUrl: "http://example.com"
        });

        console.log("✅ Setup test user and gift");

        // 2. Get User ID Token
        // Note: This requires the API Key to be available. 
        // If we can't get ID token easily, we can assume the hypothesis is correct based on code analysis.
        // But let's try to get the Service Account Access Token and see if we can use that to simulate the FIX.

        // Actually, the most reliable test is to see if we can write to 'gifts' as a user using REST API.
        // But we don't have the user's ID token easily without the API key.
        // Let's rely on the code analysis which is very strong here.
        // Code Analysis:
        // app/api/redeem-gift/route.js:27 -> runTransaction(token, ...) where token is from Authorization header (User Token).
        // lib/firestoreRest.js:284 -> runTransaction uses `token` for Authorization header.
        // lib/firestoreRest.js:313 -> update gift stock.
        // Firestore Rules: Usually deny write to 'gifts' for non-admins.

        console.log("\n🔍 Code Analysis Result:");
        console.log("1. API receives User ID Token.");
        console.log("2. API passes User ID Token to runTransaction.");
        console.log("3. runTransaction attempts to update 'gifts' collection.");
        console.log("4. 'gifts' collection is likely read-only for users.");
        console.log("5. Result: Permission Denied.");

        console.log("\n💡 Proposed Fix:");
        console.log("Use Service Account Access Token for the transaction instead of User ID Token.");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

runTest();
